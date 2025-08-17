"""
PDF Utility functions for CMML Market Scan application.
"""

import os
import time
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
from loguru import logger

try:
    import PyPDF2
    PDF_PROCESSING_AVAILABLE = True
except ImportError:
    PDF_PROCESSING_AVAILABLE = False
    logger.warning("PyPDF2 not available. PDF chunking features will be disabled.")


class PdfUtils:
    """Utility class for PDF processing operations."""
    
    def __init__(self, output_dir: str):
        """
        Initialize with output directory for temp files.
        
        Args:
            output_dir: Directory path for temporary extracted PDFs
        """
        self.output_dir = output_dir
    
    def extract_pdf_section(self, pdf_path: str, section_keyword: str) -> Optional[str]:
        """Extract a specific section from PDF using bookmark-based extraction."""
        try:
            if not PDF_PROCESSING_AVAILABLE:
                logger.warning("PyPDF2 not available, returning full PDF path")
                return pdf_path
            
            # Extract bookmarks and find the section
            bookmarks = self.extract_pdf_bookmarks(pdf_path)
            if not bookmarks:
                logger.warning(f"No bookmarks found, returning full PDF for {section_keyword}")
                return pdf_path
            
            # Get total pages
            total_pages = self.get_pdf_page_count(pdf_path)
            if not total_pages:
                logger.error("Could not determine total pages")
                return pdf_path
            
            # Get page ranges for all sections
            ranges = self.get_bookmark_ranges(bookmarks, total_pages)
            if not ranges:
                logger.error("Could not calculate bookmark ranges")
                return pdf_path
            
            # Find the matching section
            for section in ranges:
                if section_keyword.upper() in section['title'].upper():
                    # Extract this section to a temporary PDF
                    pages_to_extract = list(range(section['start_page'], section['end_page'] + 1))
                    temp_pdf = self.extract_pages(pdf_path, pages_to_extract)
                    
                    if temp_pdf:
                        logger.info(f"Extracted {section_keyword} section: {section['title']} ({len(pages_to_extract)} pages)")
                        return temp_pdf
                    break
            
            logger.warning(f"Section {section_keyword} not found in bookmarks, returning full PDF")
            return pdf_path
            
        except Exception as e:
            logger.error(f"Error extracting section {section_keyword}: {str(e)}")
            return pdf_path
    
    def get_pdf_page_count(self, pdf_path: str) -> Optional[int]:
        """Get total number of pages in PDF."""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except Exception as e:
            logger.error(f"Error getting PDF page count: {str(e)}")
            return None
    
    def extract_pages(self, pdf_path: str, page_numbers: List[int]) -> str:
        """Extract specific pages to a temporary PDF file."""
        try:
            temp_filename = f"temp_extract_{int(time.time())}_{len(page_numbers)}pages.pdf"
            temp_path = os.path.join(self.output_dir, temp_filename)
            
            with open(pdf_path, 'rb') as input_file:
                pdf_reader = PyPDF2.PdfReader(input_file)
                pdf_writer = PyPDF2.PdfWriter()
                
                for page_num in sorted(page_numbers):
                    if 0 <= page_num < len(pdf_reader.pages):
                        pdf_writer.add_page(pdf_reader.pages[page_num])
                
                with open(temp_path, 'wb') as output_file:
                    pdf_writer.write(output_file)
            
            logger.info(f"Extracted {len(page_numbers)} pages to {temp_filename}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Error extracting PDF pages: {str(e)}")
            return None
    
    def extract_pdf_bookmarks(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract PDF bookmarks/outline structure."""
        try:
            bookmarks = []
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Get the outline (bookmarks)
                if hasattr(pdf_reader, 'outline') and pdf_reader.outline:
                    bookmarks = self.parse_outline_recursive(pdf_reader.outline, pdf_reader)
                else:
                    logger.warning("No bookmarks/outline found in PDF")
                    return []
            
            logger.info(f"Extracted {len(bookmarks)} bookmarks from PDF")
            #for bookmark in bookmarks:
              # logger.info(f"  - {bookmark['title']}: page {bookmark['page'] + 1}")
            
            return bookmarks
            
        except Exception as e:
            logger.error(f"Error extracting PDF bookmarks: {str(e)}")
            return []
    
    def parse_outline_recursive(self, outline, pdf_reader) -> List[Dict[str, Any]]:
        """Recursively parse PDF outline structure."""
        bookmarks = []
        
        try:
            for item in outline:
                if isinstance(item, list):
                    # Nested bookmarks - recurse
                    bookmarks.extend(self.parse_outline_recursive(item, pdf_reader))
                else:
                    # Individual bookmark
                    try:
                        title = item.title.strip()
                        page_num = pdf_reader.get_destination_page_number(item)
                        
                        bookmarks.append({
                            'title': title,
                            'page': page_num
                        })
                    except Exception as e:
                        logger.warning(f"Could not parse bookmark item: {str(e)}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error in recursive outline parsing: {str(e)}")
        
        return bookmarks
    
    def filter_main_sections(self, bookmarks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter bookmarks to only include main sections (numbered sections like '1. PROFILE')."""
        main_sections = []
        
        try:
            # First pass: collect numbered sections
            for bookmark in bookmarks:
                title = bookmark['title'].strip()
                
                # Match numbered sections like "1. PROFILE", "2. DIRECTORS", "4. RATING", "5. FINANCIALS", "6. AUDITORS", etc.
                if re.match(r'^\d+\.\s+[A-Z\s]+$', title):
                    main_sections.append(bookmark)
                    logger.debug(f"  - Matched numbered section: {title}")
            
            # Sort by page number to ensure correct ordering
            main_sections.sort(key=lambda x: x['page'])
            
            logger.info(f"Filtered {len(main_sections)} main sections from {len(bookmarks)} total bookmarks")
            for section in main_sections:
                logger.info(f"  - Main section: {section['title']}: page {section['page'] + 1}")
            
            return main_sections
            
        except Exception as e:
            logger.error(f"Error filtering main sections: {str(e)}")
            return bookmarks  # Fallback to all bookmarks

    def get_bookmark_ranges(self, bookmarks: List[Dict[str, Any]], total_pages: int) -> List[Dict[str, Any]]:
        """Calculate page ranges for each bookmark section."""
        ranges = []
        
        try:
            # First, filter to only main sections
            main_sections = self.filter_main_sections(bookmarks)
            
            if not main_sections:
                logger.warning("No main sections found after filtering")
                return []
            
            # Sort main sections by page number
            sorted_sections = sorted(main_sections, key=lambda x: x['page'])
            
            for i, bookmark in enumerate(sorted_sections):
                start_page = bookmark['page']
                
                # End page is start of next main section - 1
                if i + 1 < len(sorted_sections):
                    end_page = sorted_sections[i + 1]['page'] - 1
                else:
                    end_page = total_pages - 1  # Last section goes to end of document
                
                # Ensure valid range
                if end_page >= start_page:
                    ranges.append({
                        'title': bookmark['title'],
                        'start_page': start_page,
                        'end_page': end_page,
                        'page_count': end_page - start_page + 1
                    })
                    logger.info(f"Calculated range for {bookmark['title']}: pages {start_page + 1}-{end_page + 1} ({end_page - start_page + 1} pages)")
                else:
                    logger.warning(f"Invalid range for {bookmark['title']}: start={start_page + 1}, end={end_page + 1}")
            
            return ranges
            
        except Exception as e:
            logger.error(f"Error calculating bookmark ranges: {str(e)}")
            return []

    def process_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Process PDF for extraction of relevant sections.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary with extracted sections and processing status
        """
        try:
            logger.info("Processing PDF for section extraction")
            
            if not pdf_path or not os.path.exists(pdf_path):
                logger.error(f"PDF file not found: {pdf_path}")
                return {
                    'success': False,
                    'error': "PDF file not found",
                    'pdf_chunks': None
                }
            
            logger.info(f"PDF found at: {pdf_path}")
            
            # Extract specific sections for each PDF-based node
            pdf_chunks = {
                'directors': self.extract_pdf_section(pdf_path, 'DIRECTORS'),
                'rating': self.extract_pdf_section(pdf_path, 'RATING'),
                'financials': self.extract_pdf_section(pdf_path, 'FINANCIALS')
            }
            
            logger.success(f"PDF processing completed successfully")
            logger.info(f"PDF chunks created: {list(pdf_chunks.keys())}")
            
            return {
                'success': True,
                'pdf_chunks': pdf_chunks
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return {
                'success': False,
                'error': f"PDF processing error: {str(e)}",
                'pdf_chunks': None
            }
