import React, { useState, useEffect, useRef } from 'react';
import apiService, { BackendType } from './services/api';
import WorkflowManager from './components/WorkflowManager';
import MarkdownRenderer from './components/MarkdownRenderer';

// Types
type AnalysisState = 'idle' | 'loading' | 'completed' | 'error';

// SVG Icons as components
const PaperClipIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42939 14.0991 2.00056 15.16 2.00056C16.2209 2.00056 17.2394 2.42939 17.99 3.18C18.7406 3.93061 19.1694 4.94913 19.1694 6.01C19.1694 7.07087 18.7406 8.08939 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5258 5.99389 15.995C5.99389 15.4642 6.20472 14.9553 6.58 14.58L15.07 6.1" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Backend Toggle Icon Component
const BackendToggleIcon: React.FC<{ isNodeJs: boolean }> = ({ isNodeJs }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {isNodeJs ? (
      // Node.js-like icon
      <path d="M12 21.8C11.5 21.8 11 21.6 10.6 21.4L7.4 19.6C6.8 19.2 7.1 19.1 7.3 19.1C8 18.8 8.1 18.8 8.9 18.4C9 18.3 9.2 18.4 9.3 18.4L11.8 19.9C11.9 20 12.1 20 12.2 19.9L20.6 14.8C20.7 14.7 20.8 14.6 20.8 14.4V4.3C20.8 4.1 20.7 4 20.6 3.9L12.2 -1.2C12.1 -1.3 11.9 -1.3 11.8 -1.2L3.4 3.9C3.3 4 3.2 4.2 3.2 4.3V14.4C3.2 14.6 3.3 14.7 3.4 14.8L5.8 16.2C7.2 16.9 8 16.1 8 15.2V5.2C8 5 8.2 4.9 8.3 4.9H9.7C9.9 4.9 10 5 10 5.2V15.2C10 17.3 8.9 18.6 6.9 18.6C6.2 18.6 5.7 18.6 4.5 18C3.4 17.4 2.7 17.1 2.7 17.1C2.6 17 2.5 16.9 2.5 16.8V4.3C2.5 3.8 2.8 3.3 3.2 3.1L11.8 -2.1C12.2 -2.3 12.8 -2.3 13.2 -2.1L21.6 3.1C22 3.3 22.3 3.8 22.3 4.3V14.4C22.3 14.9 22 15.4 21.6 15.6L13.2 20.7C12.8 20.9 12.3 20.9 11.9 20.7L9.6 19.4C9.5 19.3 9.3 19.3 9.2 19.3" 
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    ) : (
      // Python-like icon
      <path d="M12 3C6.5 3 7 5.5 7 5.5V8.5H12.5V9H4.5C4.5 9 2 8.5 2 14S4.5 19 4.5 19H7V16C7 16 6.5 13.5 9.5 13.5H15C15 13.5 17.5 13.7 17.5 11V6C17.5 6 18.2 3 12 3zM9 6C9.8 6 10.5 6.7 10.5 7.5C10.5 8.3 9.8 9 9 9C8.2 9 7.5 8.3 7.5 7.5C7.5 6.7 8.2 6 9 6z" 
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

// Main App Component
const App: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{type: 'user' | 'system', content: string}[]>([]);
  const [isWorkflowManagerOpen, setIsWorkflowManagerOpen] = useState(false);
  const [backendType, setBackendType] = useState<BackendType>(() => {
    // Load from localStorage or default to 'python'
    const savedBackend = localStorage.getItem('cmml_backend_type');
    return (savedBackend as BackendType) || 'python';
  });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize API service with the saved backend type
  useEffect(() => {
    apiService.switchBackend(backendType);
  }, [backendType]);
  
  // Save backend type to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cmml_backend_type', backendType);
  }, [backendType]);
  
  // Toggle between Python and Node.js backends
  const toggleBackend = () => {
    const newBackendType: BackendType = backendType === 'python' ? 'nodejs' : 'python';
    setBackendType(newBackendType);
    apiService.switchBackend(newBackendType);
    
    // Add a system message about backend change
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Switched to ${newBackendType === 'python' ? 'Python' : 'Node.js'} backend.`
    }]);
  };
  
  // Handle new chat - resets the conversation
  const handleNewChat = () => {
    setMessages([]);
    setCompanyName('');
    setFile(null);
    setError(null);
    setAnalysisState('idle');
    setResult(null);
    setAnalysisId(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [companyName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for results when loading
  useEffect(() => {
    if (!analysisId || analysisState !== 'loading') return;
    
    const pollInterval = setInterval(async () => {
      try {
        // Get final result
        const resultResponse = await apiService.getAnalysisResult(analysisId);
        
        if (resultResponse.success && resultResponse.report) {
          clearInterval(pollInterval);
          setResult(resultResponse.report);
          setAnalysisState('completed');
          
          // Add result message
          setMessages(prev => [...prev, {
            type: 'system',
            content: resultResponse.report || 'Analysis completed successfully.'
          }]);
        }
      } catch (error) {
        console.error('Result polling error:', error);
        // If we get a "not complete" error, just continue polling
        // If it's another error, we might want to handle it differently
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [analysisId, analysisState]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  // Open file picker
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Remove attached file
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }
    
    if (!file) {
      setError('Please attach a PDF file');
      return;
    }
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: `Analyze ${companyName}${file ? ` (with file: ${file.name})` : ''}`
    }]);
    
    // Reset input
    setCompanyName('');
    
    try {
      setError(null);
      setAnalysisState('loading');
      
      // Add system response message
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Analyzing ${companyName}...`
      }]);
      
      // Call API
      const response = await apiService.analyzeCompany({
        company_name: companyName,
        pdf_file: file
      });
      
      if (response.success && response.analysis_id) {
        setAnalysisId(response.analysis_id);
      } else {
        throw new Error(response.errors?.[0] || 'Analysis failed');
      }
    } catch (err) {
      const errorMsg = (err as Error).message || 'An error occurred during analysis';
      setError(errorMsg);
      setAnalysisState('error');
      
      // Add error message
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Error: ${errorMsg}`
      }]);
    }
  };
  
  // Handle input keydown (Enter to submit)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <img src="/piramal-logo.svg" alt="Piramal" />
        <h1>CMML Research Platform</h1>
        <div className="header-buttons">
          <button 
            className="workflow-button"
            onClick={toggleBackend}
            title={`Switch to ${backendType === 'python' ? 'Node.js' : 'Python'} Backend`}
          >
            <span className="backend-label">{backendType === 'python' ? 'PY' : 'JS'}</span>
            <BackendToggleIcon isNodeJs={backendType === 'nodejs'} />
          </button>
          <button 
            className="workflow-button"
            onClick={handleNewChat}
            title="Start New Chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="workflow-button"
            onClick={() => setIsWorkflowManagerOpen(true)}
            title="Manage Workflow"
          >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V4M12 6C10.8954 6 10 6.89543 10 8C10 9.10457 10.8954 10 12 10M12 6C13.1046 6 14 6.89543 14 8C14 9.10457 13.1046 10 12 10M6 18C7.10457 18 8 17.1046 8 16C8 14.8954 7.10457 14 6 14M6 18C4.89543 18 4 17.1046 4 16C4 14.8954 4.89543 14 6 14M6 18V20M6 14V4M12 10V20M18 18C19.1046 18 20 17.1046 20 16C20 14.8954 19.1046 14 18 14M18 18C16.8954 18 16 17.1046 16 16C16 14.8954 16.8954 14 18 14M18 18V20M18 14V4" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        </div>
      </header>
      
      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Message History */}
        <div className="chat-messages">
          {/* Display all messages */}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}-message`}>
              {message.type === 'system' && analysisState === 'loading' && index === messages.length - 1 ? (
                <>
                  <p>{message.content}</p>
                  <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <p>Processing your request. This may take a few minutes...</p>
                  </div>
                </>
              ) : (
                message.type === 'system' && analysisState === 'completed' ? (
                  <div className="result-content">
                    <MarkdownRenderer 
                      content={message.content} 
                      companyName={companyName}
                    />
                  </div>
                ) : (
                  <p>{message.content}</p>
                )
              )}
            </div>
          ))}
          
          {/* For auto-scrolling */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="chat-input-container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="chat-input-wrapper">
              {/* File attachment display inside wrapper */}
              {file && (
                <div className="file-attachment">
                  <span>📎</span>
                  <span>{file.name}</span>
                  <button className="file-remove" onClick={handleRemoveFile}>×</button>
                </div>
              )}
              <textarea
                ref={inputRef}
                className="chat-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter company name for analysis..."
                disabled={analysisState === 'loading'}
              />
              
              {/* File Attachment Button */}
              <button 
                type="button"
                className="file-button"
                onClick={handleFileButtonClick}
                disabled={analysisState === 'loading'}
              >
                <PaperClipIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={analysisState === 'loading'}
              />
              
              {/* Send Button */}
              <button
                type="submit"
                className="send-button"
                disabled={!companyName || !file || analysisState === 'loading'}
              >
                {analysisState === 'loading' ? (
                  <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }} />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Workflow Manager */}
      <WorkflowManager
        analysisId={analysisId}
        isOpen={isWorkflowManagerOpen}
        onClose={() => setIsWorkflowManagerOpen(false)}
      />
    </div>
  );
};

export default App;
