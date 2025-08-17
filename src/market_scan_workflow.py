"""
LangGraph workflow for CMML Market Scan with 7-node architecture.
"""

import os
from datetime import datetime
from typing import TypedDict, Optional, Dict, List, Any, Annotated
import json
from operator import add
from pathlib import Path
from loguru import logger

from langgraph.graph import StateGraph, END
from langgraph.graph.graph import CompiledGraph

from .gemini_service import GeminiService
from .google_search_service import GoogleSearchService
from .config import Config
from .prompt_manager import PromptManager
from .pdf_utils import PdfUtils


# Custom reducer for merging dictionaries
def merge_dicts(left: Dict, right: Dict) -> Dict:
    """Merge two dictionaries, with right taking precedence."""
    if left is None:
        return right
    if right is None:
        return left
    result = left.copy()
    result.update(right)
    return result


class MarketScanState(TypedDict):
    """State management for the market scan workflow."""
    company_name: str
    pdf_path: Optional[str]
    pdf_processed: bool
    pdf_chunks: Optional[Dict[str, Any]]
    
    # Node outputs
    company_overview: Optional[str]
    industry_overview: Optional[str]
    promoters_directors: Optional[str]
    credit_rating: Optional[str]
    financials: Optional[str]
    compliance_checks: Optional[str]
    news_checks: Optional[str]
    
    # Final output
    final_report: Optional[str]
    
    # Use Annotated types for fields updated by multiple nodes
    errors: Annotated[List[str], add]  # Concatenates lists
    processing_status: Annotated[Dict[str, str], merge_dicts]  # Merges dictionaries


class MarketScanWorkflow:
    """Main workflow class for market scan analysis."""
    
    def __init__(self, config: Config):
        """
        Initialize the workflow with configuration.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.gemini_service = GeminiService(config)
        self.google_search_service = GoogleSearchService(config)
        self.prompt_manager = PromptManager()
        self.pdf_utils = PdfUtils(config.output_dir)
        self.workflow = self._build_workflow()
        
    def _build_workflow(self) -> CompiledGraph:
        """Build the LangGraph workflow with all nodes."""
        workflow = StateGraph(MarketScanState)
        
        # Add all nodes with unique names (avoiding conflict with state keys)
        workflow.add_node("init", self._initialize_node)
        workflow.add_node("pdf_processor", self._process_pdf_node)
        workflow.add_node("node_company", self._company_overview_node)
        workflow.add_node("node_industry", self._industry_overview_node)
        workflow.add_node("node_directors", self._promoters_directors_node)
        workflow.add_node("node_credit", self._credit_rating_node)
        workflow.add_node("node_financial", self._financials_node)
        workflow.add_node("node_compliance", self._compliance_checks_node)
        workflow.add_node("node_news", self._news_checks_node)
        workflow.add_node("writer", self._report_writer_node)
        
        # Define the flow
        workflow.set_entry_point("init")
        
        # Initialize branches to parallel nodes
        workflow.add_edge("init", "pdf_processor")
        workflow.add_edge("init", "node_company")
        workflow.add_edge("init", "node_industry")
        workflow.add_edge("init", "node_compliance")
        workflow.add_edge("init", "node_news")
        
        # PDF-dependent nodes
        workflow.add_edge("pdf_processor", "node_directors")
        workflow.add_edge("pdf_processor", "node_credit")
        workflow.add_edge("pdf_processor", "node_financial")
        
        # All analysis nodes lead to report writer
        workflow.add_edge("node_company", "writer")
        workflow.add_edge("node_industry", "writer")
        workflow.add_edge("node_directors", "writer")
        workflow.add_edge("node_credit", "writer")
        workflow.add_edge("node_financial", "writer")
        workflow.add_edge("node_compliance", "writer")
        workflow.add_edge("node_news", "writer")
        
        # Report writer is the end
        workflow.add_edge("writer", END)
        
        return workflow.compile()
    
    def _should_execute_node(self, node_id: str) -> bool:
        """Check if node should be executed based on enabled status."""
        try:
            return self.prompt_manager.is_node_enabled(node_id)
        except Exception as e:
            logger.warning(f"Error checking if node {node_id} is enabled: {str(e)}")
            return True  # Default to enabled if there's an error
    
    def _initialize_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Initialize the workflow state."""
        logger.info(f"Initializing workflow for company: {state.get('company_name', 'Unknown')}")
        
        # Only return the fields we're updating
        return {
            'errors': [],
            'processing_status': {
                'company_overview': 'pending',
                'industry_overview': 'pending',
                'promoters_directors': 'pending',
                'credit_rating': 'pending',
                'financials': 'pending',
                'compliance_checks': 'pending',
                'news_checks': 'pending'
            },
            'pdf_processed': False
        }
    
    def _process_pdf_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Process PDF for extraction of relevant sections."""
        try:
            pdf_path = state.get('pdf_path')
            
            # Use PdfUtils to process the PDF
            result = self.pdf_utils.process_pdf(pdf_path)
            
            if not result['success']:
                return {
                    'errors': [result.get('error', "Unknown PDF processing error")],
                    'pdf_processed': False
                }
            
            return {
                'pdf_chunks': result['pdf_chunks'],
                'pdf_processed': True
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return {
                'errors': [f"PDF processing error: {str(e)}"],
                'pdf_processed': False
            }
    
    # Node 1: Company & Business Overview (Google Search)
    def _company_overview_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 1: Analyze company and business overview using Google Search."""
        node_id = 'company_overview'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 1: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 1: Analyzing company overview for {state.get('company_name', 'Unknown')}")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('company_overview', company_name=company_name)
            
            result = self.google_search_service._perform_search_analysis(
                company_name,
                prompt,
                "company_overview"
            )
            
            if result:
                logger.success(f"Node 1: Company overview analysis completed for {company_name}")
                return {
                    'company_overview': result,
                    'processing_status': {'company_overview': 'completed'}
                }
            else:
                logger.error(f"Node 1: Failed to analyze company overview for {company_name}")
                return {
                    'errors': ["Failed to analyze company overview"],
                    'processing_status': {'company_overview': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 1 error: {str(e)}")
            return {
                'errors': [f"Company overview error: {str(e)}"],
                'processing_status': {'company_overview': 'failed'}
            }
    
    # Node 2: Industry Overview (Google Search)
    def _industry_overview_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 2: Analyze industry overview using Google Search."""
        node_id = 'industry_overview'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 2: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 2: Analyzing industry overview for {state.get('company_name', 'Unknown')}")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('industry_overview', company_name=company_name)
            
            result = self.google_search_service._perform_search_analysis(
                company_name,
                prompt,
                "industry_overview"
            )
            
            if result:
                logger.success(f"Node 2: Industry overview analysis completed for {company_name}")
                return {
                    'industry_overview': result,
                    'processing_status': {'industry_overview': 'completed'}
                }
            else:
                logger.error(f"Node 2: Failed to analyze industry overview for {company_name}")
                return {
                    'errors': ["Failed to analyze industry overview"],
                    'processing_status': {'industry_overview': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 2 error: {str(e)}")
            return {
                'errors': [f"Industry overview error: {str(e)}"],
                'processing_status': {'industry_overview': 'failed'}
            }
    
    # Node 3: Promoters and Directors (PDF Analysis)
    def _promoters_directors_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 3: Extract promoters and directors information from PDF."""
        node_id = 'promoters_directors'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 3: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 3: Starting promoters and directors analysis")
            logger.info(f"Node 3: State check - pdf_processed: {state.get('pdf_processed')}, pdf_chunks: {state.get('pdf_chunks', {}).keys()}")
            
            if not state.get('pdf_processed'):
                logger.warning("Node 3: PDF not processed, skipping directors analysis")
                return {
                    'errors': ["PDF not processed, skipping directors analysis"],
                    'processing_status': {'promoters_directors': 'skipped'}
                }
            
            logger.info("Node 3: PDF is processed, proceeding with analysis")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Use the extracted chunk for directors section
            pdf_chunks = state.get('pdf_chunks', {})
            directors_pdf = pdf_chunks.get('directors')
            
            if not directors_pdf:
                logger.warning("Node 3: Directors section not found in PDF chunks, using full PDF")
                directors_pdf = state.get('pdf_path')
            else:
                logger.info(f"Node 3: Using extracted directors section: {directors_pdf}")
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('promoters_directors', company_name=company_name)
            
            result = self.gemini_service.analyze_pdf_from_path(
                directors_pdf,
                company_name,
                prompt
            )
            
            if result:
                logger.success("Node 3: Promoters and directors analysis completed")
                return {
                    'promoters_directors': result,
                    'processing_status': {'promoters_directors': 'completed'}
                }
            else:
                return {
                    'errors': ["Failed to analyze promoters and directors"],
                    'processing_status': {'promoters_directors': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 3 error: {str(e)}")
            return {
                'errors': [f"Promoters/Directors error: {str(e)}"],
                'processing_status': {'promoters_directors': 'failed'}
            }
    
    # Node 4: Credit Rating (PDF Analysis)
    def _credit_rating_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 4: Extract credit rating history from PDF."""
        node_id = 'credit_rating'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 4: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 4: Starting credit rating analysis")
            logger.info(f"Node 4: State check - pdf_processed: {state.get('pdf_processed')}, pdf_chunks: {state.get('pdf_chunks', {}).keys()}")
            
            if not state.get('pdf_processed'):
                logger.warning("Node 4: PDF not processed, skipping credit rating analysis")
                return {
                    'errors': ["PDF not processed, skipping credit rating analysis"],
                    'processing_status': {'credit_rating': 'skipped'}
                }
            
            logger.info("Node 4: PDF is processed, proceeding with analysis")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Use the extracted chunk for rating section
            pdf_chunks = state.get('pdf_chunks', {})
            rating_pdf = pdf_chunks.get('rating')
            
            if not rating_pdf:
                logger.warning("Node 4: Rating section not found in PDF chunks, using full PDF")
                rating_pdf = state.get('pdf_path')
            else:
                logger.info(f"Node 4: Using extracted rating section: {rating_pdf}")
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('credit_rating', company_name=company_name)
            
            result = self.gemini_service.analyze_pdf_from_path(
                rating_pdf,
                company_name,
                prompt
            )
            
            if result:
                logger.success("Node 4: Credit rating analysis completed")
                return {
                    'credit_rating': result,
                    'processing_status': {'credit_rating': 'completed'}
                }
            else:
                return {
                    'errors': ["Failed to analyze credit rating"],
                    'processing_status': {'credit_rating': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 4 error: {str(e)}")
            return {
                'errors': [f"Credit rating error: {str(e)}"],
                'processing_status': {'credit_rating': 'failed'}
            }
    
    # Node 5: Financials (PDF Analysis)
    def _financials_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 5: Extract financial information from PDF."""
        node_id = 'financials'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 5: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 5: Starting financial analysis")
            logger.info(f"Node 5: State check - pdf_processed: {state.get('pdf_processed')}, pdf_chunks: {state.get('pdf_chunks', {}).keys()}")
            
            if not state.get('pdf_processed'):
                logger.warning("Node 5: PDF not processed, skipping financial analysis")
                return {
                    'errors': ["PDF not processed, skipping financial analysis"],
                    'processing_status': {'financials': 'skipped'}
                }
            
            logger.info("Node 5: PDF is processed, proceeding with analysis")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Use the extracted chunk for financials section
            pdf_chunks = state.get('pdf_chunks', {})
            financials_pdf = pdf_chunks.get('financials')
            
            if not financials_pdf:
                logger.warning("Node 5: Financials section not found in PDF chunks, using full PDF")
                financials_pdf = state.get('pdf_path')
            else:
                logger.info(f"Node 5: Using extracted financials section: {financials_pdf}")
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('financials', company_name=company_name)
            
            result = self.gemini_service.analyze_pdf_from_path(
                financials_pdf,
                company_name,
                prompt
            )
            
            if result:
                logger.success("Node 5: Financial analysis completed")
                return {
                    'financials': result,
                    'processing_status': {'financials': 'completed'}
                }
            else:
                return {
                    'errors': ["Failed to analyze financials"],
                    'processing_status': {'financials': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 5 error: {str(e)}")
            return {
                'errors': [f"Financial analysis error: {str(e)}"],
                'processing_status': {'financials': 'failed'}
            }
    
    # Node 6: Compliance Checks (Google Search)
    def _compliance_checks_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 6: Perform compliance and due diligence checks using Google Search."""
        node_id = 'compliance_checks'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 6: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 6: Performing compliance checks for {state.get('company_name', 'Unknown')}")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('compliance_checks', company_name=company_name)
            
            result = self.google_search_service._perform_search_analysis(
                company_name,
                prompt,
                "compliance_checks"
            )
            
            if result:
                logger.success(f"Node 6: Compliance checks completed for {company_name}")
                return {
                    'compliance_checks': result,
                    'processing_status': {'compliance_checks': 'completed'}
                }
            else:
                logger.error(f"Node 6: Failed to perform compliance checks for {company_name}")
                return {
                    'errors': ["Failed to perform compliance checks"],
                    'processing_status': {'compliance_checks': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 6 error: {str(e)}")
            return {
                'errors': [f"Compliance checks error: {str(e)}"],
                'processing_status': {'compliance_checks': 'failed'}
            }
    
    # Node 7: News/Google Checks (Google Search)
    def _news_checks_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Node 7: Analyze recent news and media coverage using Google Search."""
        node_id = 'news_checks'
        
        # Check if node is enabled
        if not self._should_execute_node(node_id):
            logger.info(f"Node 7: {node_id} is disabled, skipping")
            return {
                'processing_status': {node_id: 'skipped'}
            }
        
        try:
            logger.info(f"Node 7: Analyzing news and media coverage for {state.get('company_name', 'Unknown')}")
            
            company_name = state.get('company_name', 'Unknown Company')
            
            # Get prompt from configuration
            prompt = self.prompt_manager.get_prompt('news_checks', company_name=company_name)
            
            result = self.google_search_service._perform_search_analysis(
                company_name,
                prompt,
                "news_checks"
            )
            
            if result:
                logger.success(f"Node 7: News analysis completed for {company_name}")
                return {
                    'news_checks': result,
                    'processing_status': {'news_checks': 'completed'}
                }
            else:
                logger.error(f"Node 7: Failed to analyze news for {company_name}")
                return {
                    'errors': ["Failed to analyze news"],
                    'processing_status': {'news_checks': 'failed'}
                }
                
        except Exception as e:
            logger.error(f"Node 7 error: {str(e)}")
            return {
                'errors': [f"News analysis error: {str(e)}"],
                'processing_status': {'news_checks': 'failed'}
            }
    
    def _create_consolidated_markdown_report(self, company_name: str, node_results: Dict[str, str]) -> str:
        """
        Simple concatenation of all node results into a single Markdown report.
        No LLM processing - just programmatic assembly.
        
        Args:
            company_name: Name of the company being analyzed
            node_results: Dictionary of node outputs (keyed by node name)
            
        Returns:
            Markdown string with concatenated report
        """
        logger.info("Creating consolidated Markdown report through direct concatenation")
        
        # Professional header
        report_header = f"""# CMML Market Scan Report: {company_name}
*Generated by Piramal Finance Corporate & Mid-Market Lending Team*
*Report Date: {datetime.now().strftime('%d-%b-%Y')}*

---

"""
        
        # Section order and titles
        sections = [
            ("company_overview", "1. Company & Business Overview"),
            ("industry_overview", "2. Industry Overview"), 
            ("promoters_directors", "3. Promoters and Board of Directors"),
            ("credit_rating", "4. Credit Rating History"),
            ("financials", "5. Financial Performance"),
            ("compliance_checks", "6. Compliance & Due Diligence"),
            ("news_checks", "7. News & Media Analysis")
        ]
        
        # Combine all sections
        report_content = report_header
        
        for section_key, section_title in sections:
            if section_key in node_results and node_results[section_key]:
                # Add section with proper numbering
                section_content = node_results[section_key]
                
                # Ensure section starts with proper header if not already
                if not section_content.strip().startswith(f"## {section_title}"):
                    section_content = f"## {section_title}\n\n{section_content}"
                
                report_content += section_content + "\n\n---\n\n"
            else:
                # Add placeholder for missing sections
                report_content += f"## {section_title}\n\n*No data available for this section.*\n\n---\n\n"
        
        # Professional footer
        report_footer = f"""
---
**Disclaimer:** This report is generated for internal assessment purposes only. All information is based on publicly available data and should be verified independently.

*© {datetime.now().year} Piramal Finance Limited. All rights reserved.*
"""
        
        report_content += report_footer
        
        return report_content
    
    # Report Writer Node
    def _report_writer_node(self, state: MarketScanState) -> Dict[str, Any]:
        """Consolidate all node outputs into a comprehensive final report using LLM or direct concatenation."""
        try:
            logger.info("Consolidating final report using LLM-powered formatter")
            company_name = state.get('company_name', 'Unknown Company')
            
            # Get all the section outputs
            company_overview = state.get('company_overview', '')
            industry_overview = state.get('industry_overview', '')
            promoters_directors = state.get('promoters_directors', '')
            credit_rating = state.get('credit_rating', '')
            financials = state.get('financials', '')
            compliance_checks = state.get('compliance_checks', '')
            news_checks = state.get('news_checks', '')
            
            # Check if we have enough data to generate a report
            if not company_overview and not industry_overview and not promoters_directors:
                logger.warning("Insufficient data to generate report")
                return {
                    'final_report': self._generate_error_report(state),
                    'errors': ["Insufficient data to generate comprehensive report"]
                }
            
            # Get the consolidator prompt from prompt manager
            logger.info("Getting report consolidator prompt")
            prompt = self.prompt_manager.get_prompt('report_consolidator', 
                company_name=company_name,
                company_overview=company_overview,
                industry_overview=industry_overview,
                promoters_directors=promoters_directors,
                credit_rating=credit_rating,
                financials=financials,
                compliance_checks=compliance_checks,
                news_checks=news_checks
            )
            
            # Use Gemini to generate a professionally formatted report
            logger.info(f"Generating professionally formatted report for {company_name}")
            
            # Create a temporary PDF-like string data to pass to the API
            # This is a workaround since we want to use the gemini_service but don't have a PDF
            dummy_pdf_path = f"temp_dummy_pdf_for_{company_name.replace(' ', '_')}.pdf"
            with open(dummy_pdf_path, 'w') as f:
                f.write("DUMMY PDF FOR API CALL - CONTENT IS PASSED IN PROMPT")
            
            # Try to use the direct Gemini text-only API with higher token limits
            try:
                # Concatenate all sections for context
                all_content = "\n\n".join([
                    f"# Section 1: Company & Business Overview\n{company_overview}",
                    f"# Section 2: Industry Overview\n{industry_overview}",
                    f"# Section 3: Promoters and Board of Directors\n{promoters_directors}",
                    f"# Section 4: Credit Rating History\n{credit_rating}",
                    f"# Section 5: Financial Performance\n{financials}",
                    f"# Section 6: Compliance & Due Diligence\n{compliance_checks}",
                    f"# Section 7: News & Media Analysis\n{news_checks}"
                ])
                
                # Use the Gemini service directly with text-only API and higher token limits
                logger.info(f"Using direct Gemini text-only API with higher token limits for report consolidation")
                llm_final_report = self.gemini_service.analyze_text_content(
                    text_content=all_content,
                    prompt=prompt,
                    company_name=company_name,
                    max_output_tokens=16384,  # Much higher limit for large reports
                    temperature=0.1  # Low temperature for factual, consistent output
                )
                
                # Clean up temporary file
                if os.path.exists(dummy_pdf_path):
                    os.remove(dummy_pdf_path)
                
                if not llm_final_report:
                    logger.error("LLM failed to generate report")
                    # Try the Markdown concatenation method as first fallback
                    logger.info("Attempting to generate report using direct Markdown concatenation")
                    
                    node_results = {
                        'company_overview': company_overview,
                        'industry_overview': industry_overview,
                        'promoters_directors': promoters_directors,
                        'credit_rating': credit_rating,
                        'financials': financials,
                        'compliance_checks': compliance_checks,
                        'news_checks': news_checks
                    }
                    
                    markdown_report = self._create_consolidated_markdown_report(company_name, node_results)
                    logger.success("Successfully generated Markdown report through direct concatenation")
                    
                    final_report = markdown_report
                else:
                    logger.success("LLM successfully generated professional report")
                    final_report = llm_final_report
                
                # Save both report versions for debugging/comparison
                report_dir = Path("outputs") / "reports"
                report_dir.mkdir(parents=True, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                
                # Store the LLM report if available
                if llm_final_report:
                    llm_report_path = report_dir / f"{company_name.replace(' ', '_')}_{timestamp}_llm.md"
                    with open(llm_report_path, "w") as f:
                        f.write(llm_final_report)
                
                # Store the Markdown concatenated report
                node_results = {
                    'company_overview': company_overview,
                    'industry_overview': industry_overview,
                    'promoters_directors': promoters_directors,
                    'credit_rating': credit_rating,
                    'financials': financials,
                    'compliance_checks': compliance_checks,
                    'news_checks': news_checks
                }
                markdown_report = self._create_consolidated_markdown_report(company_name, node_results)
                md_report_path = report_dir / f"{company_name.replace(' ', '_')}_{timestamp}_concat.md"
                with open(md_report_path, "w") as f:
                    f.write(markdown_report)
                
                return {
                    'final_report': final_report
                }
            except Exception as e:
                logger.error(f"Error generating report with LLM: {str(e)}")
                # Clean up temporary file if it exists
                if os.path.exists(dummy_pdf_path):
                    os.remove(dummy_pdf_path)
                
                # Try the Markdown concatenation method as fallback
                try:
                    logger.info("Attempting to generate report using direct Markdown concatenation after LLM failure")
                    
                    node_results = {
                        'company_overview': company_overview,
                        'industry_overview': industry_overview,
                        'promoters_directors': promoters_directors,
                        'credit_rating': credit_rating,
                        'financials': financials,
                        'compliance_checks': compliance_checks,
                        'news_checks': news_checks
                    }
                    
                    markdown_report = self._create_consolidated_markdown_report(company_name, node_results)
                    logger.success("Successfully generated Markdown report through direct concatenation")
                    
                    return {
                        'final_report': markdown_report
                    }
                except Exception as md_error:
                    logger.error(f"Error generating Markdown report: {str(md_error)}")
                    # Final fallback to basic HTML report
                    return {
                        'final_report': self._generate_basic_html_report(state),
                        'errors': [f"Report generation error: {str(e)}", f"Markdown fallback error: {str(md_error)}"]
                    }
            
        except Exception as e:
            logger.error(f"Report writer error: {str(e)}")
            return {
                'final_report': self._generate_error_report(state),
                'errors': [f"Report consolidation error: {str(e)}"]
            }
    
    def _generate_basic_html_report(self, state: MarketScanState) -> str:
        """Generate a basic HTML report as fallback if LLM fails."""
        logger.info("Generating basic HTML report as fallback")
        company_name = state.get('company_name', 'Unknown Company')
        
        # Simple fallback report
        report = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Market Scan Report - {company_name}</title>
    <style>
        body {{ font-family: 'Arial', sans-serif; margin: 20px; }}
        h1 {{ color: #003366; }}
        h2 {{ color: #0066cc; margin-top: 30px; }}
        .section {{ margin-bottom: 30px; }}
    </style>
</head>
<body>
    <h1>Market Scan Report: {company_name}</h1>
    <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
"""
        
        # Add each section
        sections = [
            ('Company & Business Overview', 'company_overview'),
            ('Industry Overview', 'industry_overview'),
            ('Promoters and Board of Directors', 'promoters_directors'),
            ('Credit Rating History', 'credit_rating'),
            ('Financial Performance', 'financials'),
            ('Compliance & Due Diligence', 'compliance_checks'),
            ('News & Media Analysis', 'news_checks')
        ]
        
        for title, key in sections:
            content = state.get(key)
            if content:
                report += f"""
    <div class="section">
        <h2>{title}</h2>
        {content}
    </div>
"""
        
        # Close HTML
        report += """
    <hr>
    <footer>
        <p><small>Generated by CMML Research Platform - Piramal Finance</small></p>
    </footer>
</body>
</html>
"""
        return report
    
    def _generate_error_report(self, state: MarketScanState) -> str:
        """Generate an error report when processing fails."""
        errors = state.get('errors', ['Unknown error occurred'])
        error_list = '\n'.join([f"<li>{error}</li>" for error in errors])
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>CMML Market Scan - Error Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .error {{ color: #e74c3c; }}
    </style>
</head>
<body>
    <h1>Market Scan Report - Processing Error</h1>
    <p>Company: {state.get('company_name', 'Unknown')}</p>
    <h2 class="error">Errors Encountered:</h2>
    <ul class="error">
        {error_list}
    </ul>
    <p>Please check the input data and try again.</p>
</body>
</html>
"""
    
    def run(self, company_name: str, pdf_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Run the complete workflow.
        
        Args:
            company_name: Name of the company to analyze
            pdf_path: Optional path to company PDF document
            
        Returns:
            Dictionary with final report and processing details
        """
        try:
            # Initialize state as a regular dict
            initial_state = {
                'company_name': company_name,
                'pdf_path': pdf_path,
                'pdf_processed': False,
                'pdf_chunks': None,
                'company_overview': None,
                'industry_overview': None,
                'promoters_directors': None,
                'credit_rating': None,
                'financials': None,
                'compliance_checks': None,
                'news_checks': None,
                'final_report': None,
                'errors': [],
                'processing_status': {}
            }
            
            logger.info(f"Starting market scan workflow for: {company_name}")
            
            # Run the workflow
            final_state = self.workflow.invoke(initial_state)
            
            logger.success(f"Workflow for {company_name} completed successfully")
            
            # Include all node outputs in the result for API access
            result = {
                'success': True,
                'report': final_state.get('final_report'),
                'company': company_name,
                'errors': final_state.get('errors', []),
                'processing_status': final_state.get('processing_status', {}),
                
                # Include individual node outputs
                'company_overview': final_state.get('company_overview'),
                'industry_overview': final_state.get('industry_overview'),
                'promoters_directors': final_state.get('promoters_directors'),
                'credit_rating': final_state.get('credit_rating'),
                'financials': final_state.get('financials'),
                'compliance_checks': final_state.get('compliance_checks'),
                'news_checks': final_state.get('news_checks')
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}")
            
            return {
                'success': False,
                'report': None,
                'company': company_name,
                'errors': [str(e)],
                'processing_status': {}
            }
