import React, { useState } from 'react';
import wordGenerator from '../services/document/wordGenerator';
import pdfGenerator from '../services/document/pdfGenerator';
import copyService, { CopyFormat } from '../services/document/copyService';

// SVG Icons as components
const WordIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 16L10 12L12 16M14 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PdfIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Props definition
interface DocumentActionsProps {
  content: string;
  title: string;
  companyName: string;
  elementId: string;
}

// Tooltip component
const Tooltip: React.FC<{content: string, children: React.ReactNode}> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="tooltip-container" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className="tooltip">
          {content}
        </span>
      )}
    </div>
  );
};

// Copy dropdown component
const CopyDropdown: React.FC<{content: string, isOpen: boolean, onClose: () => void}> = ({ content, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const handleCopyAs = async (format: CopyFormat) => {
    await copyService.copyToClipboard({
      content,
      format,
      showSuccess: true
    });
    onClose();
  };
  
  return (
    <div className="copy-dropdown">
      <button onClick={() => handleCopyAs(CopyFormat.MARKDOWN)}>
        Copy as Markdown
      </button>
      <button onClick={() => handleCopyAs(CopyFormat.PLAIN_TEXT)}>
        Copy as Plain Text
      </button>
      <button onClick={() => handleCopyAs(CopyFormat.RICH_TEXT)}>
        Copy as Rich Text
      </button>
    </div>
  );
};

// Main component
const DocumentActions: React.FC<DocumentActionsProps> = ({ content, title, companyName, elementId }) => {
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  
  // Handle Word document generation
  const handleWordDownload = async () => {
    try {
      setIsGeneratingWord(true);
      
      await wordGenerator.generateWordDocument({
        title,
        companyName,
        content,
        includeTimestamp: true,
        includePageNumbers: true
      });
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'copy-toast success';
      toast.textContent = 'Word document downloaded successfully';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'copy-toast error';
      toast.textContent = 'Failed to generate Word document';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    } finally {
      setIsGeneratingWord(false);
    }
  };
  
  // Handle PDF document generation
  const handlePdfDownload = async () => {
    try {
      setIsGeneratingPdf(true);
      
      await pdfGenerator.generatePdfFromElement({
        title,
        companyName,
        content,
        elementId,
        includeTimestamp: true
      });
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'copy-toast success';
      toast.textContent = 'PDF document downloaded successfully';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PDF document:', error);
      
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'copy-toast error';
      toast.textContent = 'Failed to generate PDF document';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Handle copy button click
  const handleCopyClick = () => {
    setIsCopyDropdownOpen(!isCopyDropdownOpen);
  };
  
  return (
    <div className="document-actions">
      <div className="action-buttons">
        <Tooltip content="Copy report content">
          <button 
            className={`action-btn copy-btn ${isCopyDropdownOpen ? 'active' : ''}`}
            onClick={handleCopyClick}
            aria-label="Copy report content"
          >
            <CopyIcon />
            <span>Copy</span>
          </button>
        </Tooltip>
        
        <Tooltip content="Download as Word document">
          <button 
            className="action-btn word-btn"
            onClick={handleWordDownload}
            disabled={isGeneratingWord}
            aria-label="Download as Word document"
          >
            {isGeneratingWord ? (
              <div className="loading-spinner small" />
            ) : (
              <WordIcon />
            )}
            <span>Word</span>
          </button>
        </Tooltip>
        
        <Tooltip content="Download as PDF">
          <button 
            className="action-btn pdf-btn"
            onClick={handlePdfDownload}
            disabled={isGeneratingPdf}
            aria-label="Download as PDF"
          >
            {isGeneratingPdf ? (
              <div className="loading-spinner small" />
            ) : (
              <PdfIcon />
            )}
            <span>PDF</span>
          </button>
        </Tooltip>
      </div>
      
      {/* Copy dropdown */}
      <CopyDropdown 
        content={content}
        isOpen={isCopyDropdownOpen}
        onClose={() => setIsCopyDropdownOpen(false)}
      />
    </div>
  );
};

export default DocumentActions;
