/**
 * /api/workflow/nodes endpoint
 * Gets all available workflow nodes and their configurations
 * Matches the Python backend's API contract exactly
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { WorkflowNode } from '../../lib/types';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { logger } from '../../lib/logger';

// Placeholder data - in a real implementation, this would load from a file or database
const MOCK_NODES: WorkflowNode[] = [
  {
    id: 'company_overview',
    name: 'Company Overview',
    type: 'basic',
    description: 'Generate a comprehensive overview of the company',
    prompt_template: 'Generate a detailed overview for the company {{company_name}}.',
    enabled: true
  },
  {
    id: 'industry_overview',
    name: 'Industry Overview',
    type: 'basic',
    description: 'Generate an overview of the industry the company operates in',
    prompt_template: 'Generate an overview of the industry that {{company_name}} operates in.',
    enabled: true
  },
  {
    id: 'promoters_directors',
    name: 'Promoters & Directors',
    type: 'basic',
    description: 'Information about company promoters and directors',
    prompt_template: 'List and describe the key promoters and directors of {{company_name}}.',
    enabled: true
  },
  {
    id: 'credit_rating',
    name: 'Credit Rating',
    type: 'search',
    description: 'Get current credit ratings from rating agencies',
    prompt_template: 'Summarize the current credit ratings for {{company_name}} from major rating agencies.',
    enabled: true
  },
  {
    id: 'financials',
    name: 'Financial Analysis',
    type: 'analysis',
    description: 'Analyze key financial metrics',
    prompt_template: 'Analyze the key financial metrics and ratios for {{company_name}}.',
    enabled: true
  },
  {
    id: 'compliance_checks',
    name: 'Compliance Checks',
    type: 'search',
    description: 'Check for regulatory compliance issues',
    prompt_template: 'Check for any regulatory compliance issues or violations for {{company_name}}.',
    enabled: true
  },
  {
    id: 'news_checks',
    name: 'News Checks',
    type: 'search',
    description: 'Search for recent news about the company',
    prompt_template: 'Find and summarize recent news articles about {{company_name}}.',
    enabled: true
  }
];

// In a real implementation, this would load nodes from a configuration file
// similar to the Python backend's prompts_config.yaml
async function loadNodesFromConfig(): Promise<WorkflowNode[]> {
  logger.info('Loading workflow nodes from configuration');
  try {
    // This is a placeholder - in reality, you'd implement a proper loader
    // that reads from a config file or database
    
    // Simulate loading from a config file
    logger.info('Reading workflow configuration file');
    
    // Log each node as it's "loaded"
    MOCK_NODES.forEach(node => {
      logger.debug(`Loaded workflow node: ${node.id} (${node.name})`);
    });
    
    return MOCK_NODES;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error loading workflow nodes: ${errorMessage}`);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('API: /workflow/nodes - Request received');
  
  // Only accept GET requests
  if (req.method !== 'GET') {
    logger.warning(`API: /workflow/nodes - Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      errors: ['Method not allowed']
    });
  }
  
  try {
    // Get all nodes
    logger.info('API: /workflow/nodes - Loading workflow nodes');
    const nodes = await loadNodesFromConfig();
    
    // Return the node list
    logger.info(`API: /workflow/nodes - Successfully retrieved ${nodes.length} workflow nodes`);
    return res.status(200).json(nodes);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API: /workflow/nodes - Error processing request: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      errors: [errorMessage]
    });
  }
}
