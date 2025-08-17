/**
 * API Service for CMML Research Platform
 * Handles communication with the Python backend
 */

// Types
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
  
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
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
