"""
Google Search service for market research analysis using Gemini.
"""

import json
import requests
from typing import Optional
from loguru import logger


class GoogleSearchService:
    """Service class for Google Search analysis using Gemini API."""
    
    def __init__(self, config):
        """Initialize Google Search service with configuration."""
        self.config = config
        self.api_key = config.google_api_key
        self.model_name = "gemini-2.5-flash"  # Using flash model for search
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        logger.info(f"Google Search service initialized with model: {self.model_name}")
    
    def analyze_company_market(
        self, 
        company_name: str, 
        custom_prompt: Optional[str] = None
    ) -> Optional[str]:
        """
        Analyze company and industry using Google Search.
        
        Args:
            company_name: Name of the company
            custom_prompt: Custom market research prompt
            
        Returns:
            Market analysis results or None if failed
        """
        if not custom_prompt:
            logger.warning(f"No custom market prompt provided for {company_name}, using simple fallback")
            custom_prompt = f"Provide a concise overview of {company_name} and its industry. Include details about when it was founded, its core business, products/services, and industry trends."
        
        return self._perform_search_analysis(
            company_name, 
            custom_prompt, 
            "market_research",
            None
        )
    
    def analyze_company_compliance(
        self, 
        company_name: str, 
        custom_prompt: Optional[str] = None
    ) -> Optional[str]:
        """
        Analyze company compliance and due diligence using Google Search.
        
        Args:
            company_name: Name of the company
            custom_prompt: Custom compliance analysis prompt
            
        Returns:
            Compliance analysis results or None if failed
        """
        if not custom_prompt:
            logger.warning(f"No custom compliance prompt provided for {company_name}, using simple fallback")
            custom_prompt = f"Analyze {company_name} for compliance issues. Check for any wilful defaulter status, legal proceedings, regulatory actions, or negative news coverage."
        
        return self._perform_search_analysis(
            company_name, 
            custom_prompt, 
            "compliance_analysis",
            None
        )
    
    
    def _perform_search_analysis(
        self, 
        company_name: str, 
        custom_prompt: Optional[str], 
        analysis_type: str,
        default_prompt: Optional[str] = None
    ) -> Optional[str]:
        """
        Perform search analysis with the given prompt.
        
        Args:
            company_name: Name of the company
            custom_prompt: Custom analysis prompt
            analysis_type: Type of analysis for logging
            default_prompt: Default prompt to use if custom is not provided (deprecated)
            
        Returns:
            Analysis results or None if failed
        """
        try:
            # Safety check for prompt
            if not custom_prompt:
                if not default_prompt:
                    # Fallback to a very basic prompt if both are missing
                    prompt = f"Provide a brief overview of {company_name}."
                    logger.warning(f"No prompt provided for {analysis_type}, using minimal fallback")
                else:
                    prompt = default_prompt.replace('[Company Name]', company_name)
            else:
                # Replace [Company Name] placeholder in custom prompt
                prompt = custom_prompt.replace('[Company Name]', company_name)
            
            logger.info(f"Using prompt for {analysis_type}: {prompt[:100]}...")
            
            # Prepare request payload with Google Search tools
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "tools": [
                    {
                        "google_search": {}
                    }
                ],
                "safetySettings": [
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_NONE"
                    }
                ]
            }
            
            # Add generation parameters
            payload["generationConfig"] = {
                "temperature": 0.2,
                "topP": 0.8,
                "maxOutputTokens": 4096
            }
            
            # Prepare request headers
            headers = {
                'Content-Type': 'application/json',
                'x-goog-api-key': self.api_key
            }
            
            # Make API request
            url = f"{self.base_url}/{self.model_name}:generateContent"
            
            logger.info(f"Sending {analysis_type} search request for company: {company_name}")
            
            # Use a shorter timeout for better responsiveness
            timeout_seconds = 60  # 1 minute timeout
            
            response = requests.post(
                url,
                headers=headers,
                data=json.dumps(payload),
                timeout=timeout_seconds
            )
            
            # Log response status and headers for debugging
            logger.info(f"{analysis_type} API response status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.debug(f"Response JSON structure: {list(result.keys())}")
                    
                    # Extract text from response
                    if 'candidates' in result and len(result['candidates']) > 0:
                        candidate = result['candidates'][0]
                        if 'content' in candidate and 'parts' in candidate['content']:
                            parts = candidate['content']['parts']
                            if len(parts) > 0 and 'text' in parts[0]:
                                analysis_text = parts[0]['text']
                                logger.success(f"{analysis_type} completed for {company_name}")
                                
                                # Check for empty or very short responses
                                if not analysis_text or len(analysis_text) < 50:
                                    logger.warning(f"{analysis_type} returned very short response: {analysis_text}")
                                    # Use a fallback for very short responses
                                    return f"Information about {company_name} could not be retrieved at this time. Please check manually."
                                
                                return analysis_text
                    
                    # If we got here, the response structure wasn't as expected
                    logger.error(f"Unexpected response structure: {json.dumps(result)[:500]}")
                    return f"Analysis for {company_name} encountered a data structure issue. Please try again later."
                    
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse JSON response: {response.text[:500]}")
                    return f"Analysis for {company_name} encountered a response parsing error. Please try again later."
            
            elif response.status_code == 400:
                # Bad request error
                error_info = "Unknown error"
                try:
                    error_data = response.json()
                    if 'error' in error_data and 'message' in error_data['error']:
                        error_info = error_data['error']['message']
                except:
                    error_info = response.text[:200]
                
                logger.error(f"{analysis_type} API bad request error: {error_info}")
                return f"Analysis for {company_name} encountered an API configuration error: {error_info}"
                
            elif response.status_code == 403:
                # Authentication/permission error
                logger.error(f"{analysis_type} API authentication error: {response.text[:200]}")
                return f"Analysis for {company_name} encountered an API authentication error. Please check API key permissions."
                
            elif response.status_code == 429:
                # Rate limit error
                logger.error(f"{analysis_type} API rate limit exceeded: {response.text[:200]}")
                return f"Analysis for {company_name} encountered a rate limit error. Please try again later."
                
            else:
                # Other error
                logger.error(f"{analysis_type} API request failed with status {response.status_code}: {response.text[:200]}")
                return f"Analysis for {company_name} encountered an error (HTTP {response.status_code}). Please try again later."
                
        except requests.exceptions.Timeout:
            logger.error(f"{analysis_type} API request timed out after {timeout_seconds} seconds")
            return f"Analysis for {company_name} timed out. Please try again later."
            
        except requests.exceptions.RequestException as e:
            logger.error(f"{analysis_type} API request error: {str(e)}")
            return f"Analysis for {company_name} encountered a network error. Please check your connection and try again."
            
        except Exception as e:
            logger.error(f"Error in {analysis_type}: {str(e)}")
            return f"Analysis for {company_name} encountered an unexpected error. Please try again later."
    
    def health_check(self) -> bool:
        """
        Check if Google Search service is healthy.
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Test search query"
                            }
                        ]
                    }
                ],
                "tools": [
                    {
                        "google_search": {}
                    }
                ]
            }
            
            headers = {
                'Content-Type': 'application/json',
                'x-goog-api-key': self.api_key
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
            logger.error(f"Google Search health check failed: {str(e)}")
            return False
