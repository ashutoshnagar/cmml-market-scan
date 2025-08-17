"""
Gemini AI service for PDF analysis in CMML Market Scan.
"""

import base64
import requests
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from loguru import logger


class GeminiService:
    """Service class for interacting with Google Gemini API using direct HTTP requests."""
    
    def __init__(self, config):
        """Initialize Gemini service with configuration."""
        self.config = config
        self.api_key = config.google_api_key
        self.model_name = config.gemini_model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        logger.info(f"Gemini service initialized with model: {config.gemini_model}")
    
    def _encode_pdf_to_base64(self, pdf_path: str) -> Optional[str]:
        """
        Encode PDF file to base64.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Base64 encoded PDF data or None if failed
        """
        try:
            pdf_file = Path(pdf_path)
            if not pdf_file.exists():
                logger.error(f"PDF file not found: {pdf_path}")
                return None
            
            with open(pdf_file, 'rb') as f:
                pdf_data = f.read()
            
            base64_data = base64.b64encode(pdf_data).decode('utf-8')
            logger.info(f"PDF encoded to base64: {pdf_file.name}")
            
            return base64_data
            
        except Exception as e:
            logger.error(f"Error encoding PDF to base64: {str(e)}")
            return None
    
    def analyze_pdf_from_path(
        self, 
        pdf_path: str, 
        company_name: str, 
        custom_prompt: Optional[str] = None
    ) -> Optional[str]:
        """
        Analyze PDF using Gemini API.
        
        Args:
            pdf_path: Path to the PDF file
            company_name: Name of the company
            custom_prompt: Custom analysis prompt
            
        Returns:
            Analysis results or None if failed
        """
        try:
            return self._process_full_pdf(pdf_path, company_name, custom_prompt)
        except Exception as e:
            logger.error(f"Error in PDF analysis workflow: {str(e)}")
            return None
    
    def _process_full_pdf(self, pdf_path: str, company_name: str, custom_prompt: Optional[str] = None) -> Optional[str]:
        """Process the complete PDF without any modifications."""
        try:
            # Encode PDF to base64
            base64_data = self._encode_pdf_to_base64(pdf_path)
            if not base64_data:
                return None
            
            # Use the custom prompt directly
            if not custom_prompt:
                logger.warning(f"No custom prompt provided for {company_name}, analysis may be generic")
                # Simple fallback prompt if none is provided
                custom_prompt = f"Analyze this PDF document for company {company_name}. Extract key information about directors, financials, and credit ratings."
            
            # Make API call
            return self._make_gemini_api_call(base64_data, custom_prompt, company_name, "Complete PDF")
            
        except Exception as e:
            logger.error(f"Error in full PDF processing: {str(e)}")
            return None
    
    def _make_gemini_api_call(self, base64_data: str, prompt: str, company_name: str, processing_type: str = "PDF") -> Optional[str]:
        """Make the actual API call to Gemini."""
        try:
            # Prepare request payload
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": "application/pdf",
                                    "data": base64_data
                                }
                            },
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            
            # Prepare request headers
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': self.api_key
            }
            
            # Make API request
            url = f"{self.base_url}/{self.model_name}:generateContent"
            
            # Log API details
            logger.info(f"=== PDF DOCUMENT ANALYSIS API CALL ===")
            logger.info(f"Company: {company_name}")
            logger.info(f"Processing Type: {processing_type}")
            logger.info(f"API Endpoint: {url}")
            logger.info(f"Model: {self.model_name}")
            logger.info(f"Request Headers: {headers}")
            
            # Log payload structure info (without base64)
            payload_info = {
                "model": self.model_name,
                "content_parts": len(payload["contents"][0]["parts"]),
                "has_pdf_data": True,
                "has_text_prompt": True,
                "pdf_size_bytes": len(base64_data) if base64_data else 0,
                "prompt_length_chars": len(prompt)
            }
            logger.info(f"Request payload info: {payload_info}")
            
            # Log equivalent curl command (without base64 data)
            masked_api_key = f"{self.api_key[:8]}..." if len(self.api_key) > 8 else "***"
            curl_command = f'''curl -X POST '{url}' \\
-H 'Content-Type: application/json' \\
-H 'X-goog-api-key: {masked_api_key}' \\
-d '{{
  "contents": [{{
    "parts": [{{
      "inline_data": {{
        "mime_type": "application/pdf",
        "data": "[BASE64_PDF_DATA_OMITTED - {len(base64_data)} chars]"
      }}
    }}, {{
      "text": "{prompt[:100]}..."
    }}]
  }}]
}}' \\
--max-time 300'''
            
            logger.info(f"Equivalent curl command:\n{curl_command}")
            
            logger.info(f"Sending request to Gemini API for company: {company_name}")
            
            response = requests.post(
                url,
                headers=headers,
                data=json.dumps(payload),
                timeout=300  # 5 minutes timeout
            )
            
            # Log response details
            logger.info(f"API Response Status: {response.status_code}")
            logger.info(f"Response Headers: {dict(response.headers)}")
            if hasattr(response, 'elapsed'):
                logger.info(f"Request Duration: {response.elapsed.total_seconds():.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract text from response
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        parts = candidate['content']['parts']
                        if len(parts) > 0 and 'text' in parts[0]:
                            analysis_text = parts[0]['text']
                            
                            # Log the actual Gemini output
                            logger.info(f"=== GEMINI OUTPUT FOR {company_name} ===")
                            logger.info(f"Analysis Length: {len(analysis_text)} characters")
                            logger.info(f"First 500 characters: {analysis_text[:500]}...")
                            if len(analysis_text) > 500:
                                logger.info(f"Last 300 characters: ...{analysis_text[-300:]}")
                            logger.info(f"=== END GEMINI OUTPUT ===")
                            
                            logger.success(f"Analysis completed for {company_name}")
                            return analysis_text
                
                logger.error("No valid response content found")
                return None
            else:
                logger.error(f"API request failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error in Gemini API call: {str(e)}")
            return None

    def analyze_text_content(
        self, 
        text_content: str, 
        prompt: str, 
        company_name: str,
        max_output_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Optional[str]:
        """
        Analyze text content using Gemini API without PDF processing.
        Specifically designed for report consolidation with higher token limits.
        
        Args:
            text_content: The text content to analyze
            prompt: Analysis prompt
            company_name: Company name for logging
            max_output_tokens: Maximum output tokens (default: 8192, max: 32768)
            temperature: Response creativity (0.0-1.0)
            
        Returns:
            Analysis results or None if failed
        """
        try:
            # Prepare request payload with generation config for better control
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"{prompt}\n\nContent to analyze:\n{text_content}"
                    }]
                }],
                "generationConfig": {
                    "maxOutputTokens": max_output_tokens or 8192,  # Higher limit for reports
                    "temperature": temperature or 0.1,  # Low for factual reports
                    "topP": 0.8,
                    "topK": 40
                }
            }
            
            # Prepare request headers
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': self.api_key
            }
            
            # Make API request
            url = f"{self.base_url}/{self.model_name}:generateContent"
            
            # Log API details
            logger.info(f"=== TEXT-ONLY ANALYSIS API CALL ===")
            logger.info(f"Company: {company_name}")
            logger.info(f"Processing Type: Text-Only Consolidation")
            logger.info(f"API Endpoint: {url}")
            logger.info(f"Model: {self.model_name}")
            logger.info(f"Token Settings: max_output_tokens={max_output_tokens or 8192}, temperature={temperature or 0.1}")
            
            # Log payload structure info
            payload_info = {
                "model": self.model_name,
                "prompt_length_chars": len(prompt),
                "text_content_length_chars": len(text_content),
                "max_output_tokens": max_output_tokens or 8192,
                "temperature": temperature or 0.1
            }
            logger.info(f"Request payload info: {payload_info}")
            
            logger.info(f"Sending text-only request to Gemini API for company: {company_name}")
            
            response = requests.post(
                url,
                headers=headers,
                data=json.dumps(payload),
                timeout=300  # 5 minutes timeout
            )
            
            # Log response details
            logger.info(f"API Response Status: {response.status_code}")
            logger.info(f"Response Headers: {dict(response.headers)}")
            if hasattr(response, 'elapsed'):
                logger.info(f"Request Duration: {response.elapsed.total_seconds():.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract text from response
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        parts = candidate['content']['parts']
                        if len(parts) > 0 and 'text' in parts[0]:
                            analysis_text = parts[0]['text']
                            
                            # Log the actual Gemini output
                            logger.info(f"=== GEMINI TEXT ANALYSIS OUTPUT FOR {company_name} ===")
                            logger.info(f"Analysis Length: {len(analysis_text)} characters")
                            logger.info(f"First 500 characters: {analysis_text[:500]}...")
                            if len(analysis_text) > 500:
                                logger.info(f"Last 300 characters: ...{analysis_text[-300:]}")
                            logger.info(f"=== END GEMINI OUTPUT ===")
                            
                            logger.success(f"Text analysis completed for {company_name}")
                            return analysis_text
                
                logger.error("No valid response content found")
                return None
            else:
                logger.error(f"API request failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error in Gemini text analysis API call: {str(e)}")
            return None
    
    def health_check(self) -> bool:
        """
        Check if Gemini service is healthy using direct API.
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Hello, this is a health check."
                            }
                        ]
                    }
                ]
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': self.api_key
            }
            
            url = f"{self.base_url}/{self.model_name}:generateContent"
            
            response = requests.post(
                url,
                headers=headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return False
