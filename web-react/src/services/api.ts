/**
 * API Service for CMML Research Platform
 * Handles communication with both Python and Node.js backends
 */

// Backend Types
export type BackendType = 'python' | 'nodejs';

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
   * Get base URL based on the backend type
   */
  private getBaseUrl(backendType: BackendType): string {
    switch (backendType) {
      case 'nodejs':
        // Use localhost for local development
        return 'http://localhost:3001/api';
      case 'python':
      default:
        // Use relative path for Python backend (default)
        return '/api';
    }
  }
  
  /**
   * Switch to a different backend
   */
  switchBackend(backendType: BackendType): void {
    this.backendType = backendType;
    this.baseUrl = this.getBaseUrl(backendType);
    console.log(`Switched to ${backendType} backend at ${this.baseUrl}`);
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
export const apiService = new ApiService();

export default apiService;
