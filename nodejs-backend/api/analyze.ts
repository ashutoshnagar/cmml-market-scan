/**
 * /api/analyze endpoint
 * Handles company analysis requests with file uploads
 * Matches the Python backend's API contract exactly
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AnalysisResponse } from '../lib/types';
import SessionManager from '../lib/sessionManager';
import { logger } from '../lib/logger';

// Temporary placeholder for the actual analysis workflow
// This would be replaced with real implementation using LangChain.js
async function runWorkflow(companyName: string, pdfPath: string, analysisId: string) {
  // Set status to processing
  SessionManager.setStatus(analysisId, 'processing');
  
  logger.info(`Starting workflow execution for analysis ${analysisId} (company: ${companyName})`);
  
  // Simulate workflow execution
  // In the real implementation, this would call the LangChain.js workflow
  setTimeout(() => {
    logger.info(`Executing workflow nodes for analysis ${analysisId}`);
    
    // In a real implementation, we would log each node execution
    logger.info(`Node: extract_pdf_text completed for analysis ${analysisId}`);
    logger.info(`Node: generate_company_summary completed for analysis ${analysisId}`);
    logger.info(`Node: generate_market_analysis completed for analysis ${analysisId}`);
    
    // Complete the analysis with a placeholder result
    // This would be replaced with actual results from the workflow
    SessionManager.completeAnalysis(analysisId, {
      success: true,
      report: `# Analysis Report for ${companyName}\n\nThis is a placeholder report.`,
      company: companyName,
      errors: []
    });
    
    logger.info(`Analysis ${analysisId} completed successfully`);
  }, 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>
) {
  logger.info(`API: /analyze - Request received`);
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    logger.warning(`API: /analyze - Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      company: '',
      errors: ['Method not allowed']
    });
  }
  
  try {
    // In a real implementation, we'd use multer or a similar middleware to handle file uploads
    // For this placeholder, we're just extracting the company_name
    const { company_name } = req.body;
    
    // Validate request
    if (!company_name) {
      logger.warning(`API: /analyze - Missing company name`);
      return res.status(400).json({
        success: false,
        company: '',
        errors: ['Company name is required']
      });
    }
    
    // Check if PDF file was uploaded
    // In a real implementation, we'd validate the file using middleware like multer
    // For now, we'll just check if there's a content-type that includes multipart/form-data
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      logger.warning(`API: /analyze - Missing PDF file upload for company: ${company_name}`);
      return res.status(400).json({
        success: false,
        company: company_name,
        errors: ['PDF file is required']
      });
    }
    
    // In a production implementation, we would use middleware to handle file uploads
    // For this demo, we'll simulate a successful file upload
    
    // For this placeholder, we just pretend we saved the file
    // In a real implementation, we'd use Vercel Blob or similar for file storage
    const pdfPath = `/tmp/uploads/${Date.now()}-${company_name}.pdf`;
    
    // Create a new analysis session
    const analysisId = SessionManager.createSession(company_name, pdfPath);
    logger.info(`API: /analyze - Created session ${analysisId} for company: ${company_name}`);
    
    // Start analysis in background
    logger.info(`API: /analyze - Starting workflow for analysis ${analysisId}`);
    runWorkflow(company_name, pdfPath, analysisId);
    
    // Return success response
    logger.info(`API: /analyze - Successfully initiated analysis ${analysisId}`);
    return res.status(200).json({
      success: true,
      company: company_name,
      analysis_id: analysisId,
      message: 'Analysis started successfully'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API: /analyze - Error processing request: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      company: req.body?.company_name || '',
      errors: [errorMessage]
    });
  }
}
