/**
 * /api/workflow/nodes endpoint
 * Gets all available workflow nodes and their configurations
 * 
 * This is a serverless function for Vercel deployment
 */

// Define mock nodes for consistent data
const MOCK_NODES = [
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

// Load nodes from configuration (simplified for serverless function)
async function loadNodesFromConfig() {
  console.info('Loading workflow nodes from configuration');
  try {
    // In a real implementation, this would load from a database or file
    // For now, we're using the mock data
    console.info('Reading workflow configuration');
    
    // Log each node
    MOCK_NODES.forEach(node => {
      console.debug(`Loaded workflow node: ${node.id} (${node.name})`);
    });
    
    return MOCK_NODES;
  } catch (error) {
    console.error(`Error loading workflow nodes: ${error.message || 'Unknown error'}`);
    return [];
  }
}

// Main handler function for the serverless endpoint
module.exports = async (req, res) => {
  console.info('API: /workflow/nodes - Request received');
  
  // Only accept GET requests
  if (req.method !== 'GET') {
    console.warning(`API: /workflow/nodes - Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      errors: ['Method not allowed']
    });
  }
  
  try {
    // Get all nodes
    console.info('API: /workflow/nodes - Loading workflow nodes');
    const nodes = await loadNodesFromConfig();
    
    // Make sure we always return an array, even if empty
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    
    // Return the node list
    console.info(`API: /workflow/nodes - Successfully retrieved ${safeNodes.length} workflow nodes`);
    return res.status(200).json(safeNodes);
    
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`API: /workflow/nodes - Error processing request: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      errors: [errorMessage]
    });
  }
};
