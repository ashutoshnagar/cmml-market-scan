/**
 * API Service for CMML Research Platform
 * Handles communication with both Python and Node.js backends
 * Supports both local development and production deployments
 */

// Backend Types
export type BackendType = 'python' | 'nodejs';

// Environment detection
export const isProd = import.meta.env.PROD;
export const nodejsBackendUrl = import.meta.env.VITE_NODEJS_BACKEND_URL || 'http://localhost:3001/api';
export const pythonBackendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || '/api';

// API Types
export interface AnalysisRequest {
  company_name: string;
  pdf_file: File;
}

export interface AnalysisResponse {
  success: boolean;
  company: string;
  analysis_id?: string;
  report?: string;
  errors?: string[];
}

// Main API service class
export class ApiService {
  private baseUrl: string;
  private backendType: BackendType;
  
  constructor(backendType: BackendType = 'python') {
    this.backendType = backendType;
    this.baseUrl = this.getBaseUrl(backendType);
  }
  
  /**
   * Get base URL based on the backend type and environment
   */
  private getBaseUrl(backendType: BackendType): string {
    switch (backendType) {
      case 'nodejs':
        // Use environment variable or fallback to localhost for development
        return nodejsBackendUrl;
      case 'python':
      default:
        // Use environment variable or fallback to relative path
        return pythonBackendUrl;
    }
  }
  
  /**
   * Switch to a different backend
   */
  switchBackend(backendType: BackendType): void {
    this.backendType = backendType;
    this.baseUrl = this.getBaseUrl(backendType);
    console.log(`Switched to ${backendType} backend at ${this.baseUrl} (${isProd ? 'production' : 'development'} environment)`);
    
    // Save preference to localStorage for persistence
    try {
      localStorage.setItem('cmml_backend_type', backendType);
    } catch (e) {
      console.warn('Could not save backend preference to localStorage', e);
    }
  }
  
  /**
   * Get current backend type
   */
  getCurrentBackend(): BackendType {
    return this.backendType;
  }
  
  /**
   * Get current base URL
   */
  getCurrentBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Start company analysis with optional PDF document
   */
  async analyzeCompany(data: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('company_name', data.company_name);
      formData.append('pdf_file', data.pdf_file);
      
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Analysis request failed:', error);
      return {
        success: false,
        company: data.company_name,
        errors: [(error as Error).message],
      };
    }
  }
  
  /**
   * Get analysis result by analysis ID
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/result/${analysisId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Result request failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
// Initialize with saved preference from localStorage if available
const getSavedBackendType = (): BackendType => {
  try {
    const saved = localStorage.getItem('cmml_backend_type') as BackendType;
    return saved === 'nodejs' || saved === 'python' ? saved : 'python';
  } catch (e) {
    return 'python';
  }
};

export const apiService = new ApiService(getSavedBackendType());

export default apiService;
