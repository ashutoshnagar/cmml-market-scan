/**
 * /api/result/[id] endpoint
 * Retrieves the result of an analysis by ID
 * Matches the Python backend's API contract exactly
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AnalysisResult } from '../../lib/types';
import SessionManager from '../../lib/sessionManager';
import { logger } from '../../lib/logger';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult>
) {
  logger.info(`API: /result/[id] - Request received`);
  
  // Only accept GET requests
  if (req.method !== 'GET') {
    logger.warning(`API: /result/[id] - Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      company: '',
      errors: ['Method not allowed']
    });
  }
  
  try {
    // Get analysis ID from URL parameters
    const { id } = req.query;
    const analysisId = Array.isArray(id) ? id[0] : id;
    
    logger.info(`API: /result/[id] - Retrieving result for analysis ID: ${analysisId}`);
    
    if (!analysisId) {
      logger.warning(`API: /result/[id] - Missing analysis ID`);
      return res.status(400).json({
        success: false,
        company: '',
        errors: ['Analysis ID is required']
      });
    }
    
    // Get the session
    const session = SessionManager.getSession(analysisId);
    
    if (!session) {
      logger.warning(`API: /result/[id] - Analysis ID not found: ${analysisId}`);
      return res.status(404).json({
        success: false,
        company: '',
        errors: ['Analysis ID not found']
      });
    }
    
    // If analysis is still processing, return an appropriate response
    if (session.status === 'processing' || session.status === 'uploading') {
      logger.info(`API: /result/[id] - Analysis ${analysisId} is still ${session.status}`);
      return res.status(202).json({
        success: false,
        company: session.company_name,
        errors: ['Analysis is not yet complete']
      });
    }
    
    if (!session.result) {
      logger.error(`API: /result/[id] - No result available for analysis ${analysisId}`);
      return res.status(500).json({
        success: false,
        company: session.company_name,
        errors: ['No result available']
      });
    }
    
    // Get the report from result
    const report = session.result.report;
    
    // Log third-party API call simulation
    logger.info(`API: /result/[id] - Making third-party API call to fetch additional data for ${session.company_name}`);
    
    // Simulate a third-party API call
    const thirdPartyCallStart = Date.now();
    setTimeout(() => {
      logger.info(`API: /result/[id] - Third-party API call completed in ${Date.now() - thirdPartyCallStart}ms`);
    }, 0);
    
    logger.info(`API: /result/[id] - Successfully retrieved result for analysis ${analysisId}`);
    
    return res.status(200).json({
      success: true,
      company: session.company_name,
      report,
      errors: session.errors
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API: /result/[id] - Error processing request: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      company: '',
      errors: [errorMessage]
    });
  }
}
