"""
Configuration management for CMML Market Scan.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger


class Config:
    """Configuration class for CMML Market Scan."""
    
    def __init__(self):
        """Initialize configuration by loading environment variables."""
        # Load environment variables from .env file
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            load_dotenv(env_file)
            logger.info(f"Loaded environment variables from {env_file}")
        
        # Google Gemini Configuration
        self.google_api_key = os.getenv('GOOGLE_API_KEY', '')
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        # Application Settings
        self.log_level = os.getenv('LOG_LEVEL', 'INFO')
        self.output_dir = Path(os.getenv('OUTPUT_DIR', './outputs'))
        
        # Server Configuration
        self.server_host = os.getenv('SERVER_HOST', 'localhost')
        self.server_port = int(os.getenv('SERVER_PORT', '8000'))
        
        # Gemini Model Configuration
        self.gemini_model = "gemini-2.5-pro"  # Updated to use Flash model for PDF/doc analysis
        self.gemini_temperature = 0.1
        self.gemini_max_tokens = 8192
        
        # PDF Processing Configuration
        self.pdf_processing_mode = os.getenv('PDF_PROCESSING_MODE', 'bookmark_sections')
        self.pdf_max_pages = int(os.getenv('PDF_MAX_PAGES', '500'))
        self.pdf_enable_chunking = os.getenv('PDF_ENABLE_CHUNKING', 'true').lower() == 'true'
        
        # Smart Section Extraction Settings
        self.pdf_target_sections = [
            'profile', 'directors', 'rating', 'financials'
        ]
        
        # Section Keywords Mapping
        self.pdf_section_keywords = {
            'profile': ['PROFILE', 'COMPANY PROFILE', 'OVERVIEW', 'ABOUT'],
            'directors': ['DIRECTORS', 'DIRECTOR', 'BOARD', 'MANAGEMENT'],
            'rating': ['RATING', 'CREDIT RATING', 'RATINGS', 'CRISIL', 'CARE'],
            'financials': ['FINANCIALS', 'FINANCIAL', 'BALANCE SHEET', 'P&L', 'INCOME']
        }
        
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Configuration initialized - Output dir: {self.output_dir}")
    
    def validate(self):
        """Validate the configuration."""
        if not self.google_api_key:
            raise ValueError("Google API key is required")
        
        if not self.output_dir.exists():
            self.output_dir.mkdir(parents=True, exist_ok=True)
            
        # Validate PDF processing configuration
        self.validate_pdf_config()
    
    def validate_pdf_config(self):
        """Validate PDF processing configuration."""
        valid_modes = ['full', 'first_pages', 'smart_sections', 'bookmark_sections', 'keyword_based']
        
        if self.pdf_processing_mode not in valid_modes:
            logger.warning(f"Invalid PDF processing mode: {self.pdf_processing_mode}, setting to 'bookmark_sections'")
            self.pdf_processing_mode = 'bookmark_sections'
        
        if self.pdf_max_pages > 1000:
            logger.warning(f"PDF max pages ({self.pdf_max_pages}) exceeds API limit, setting to 990")
            self.pdf_max_pages = 990
        
        if self.pdf_max_pages < 10:
            logger.warning(f"PDF max pages ({self.pdf_max_pages}) too small, setting to 100")
            self.pdf_max_pages = 100
        
        logger.info(f"PDF Processing Config: mode={self.pdf_processing_mode}, max_pages={self.pdf_max_pages}, chunking_enabled={self.pdf_enable_chunking}")
        logger.info(f"Target sections: {self.pdf_target_sections}")
