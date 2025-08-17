/**
 * /api/workflow/nodes/[id] endpoint
 * Updates a specific workflow node configuration
 * 
 * This is a serverless function for Vercel deployment
 */

// Shared mock data with the main nodes.js endpoint
// In a real implementation, this would be in a database or shared file
const MOCK_NODES = {
  'company_overview': {
    id: 'company_overview',
    name: 'Company Overview',
    type: 'basic',
    description: 'Generate a comprehensive overview of the company',
    prompt_template: 'Generate a detailed overview for the company {{company_name}}.',
    enabled: true
  },
  'industry_overview': {
    id: 'industry_overview',
    name: 'Industry Overview',
    type: 'basic',
    description: 'Generate an overview of the industry the company operates in',
    prompt_template: 'Generate an overview of the industry that {{company_name}} operates in.',
    enabled: true
  },
  'promoters_directors': {
    id: 'promoters_directors',
    name: 'Promoters & Directors',
    type: 'basic',
    description: 'Information about company promoters and directors',
    prompt_template: 'List and describe the key promoters and directors of {{company_name}}.',
    enabled: true
  },
  'credit_rating': {
    id: 'credit_rating',
    name: 'Credit Rating',
    type: 'search',
    description: 'Get current credit ratings from rating agencies',
    prompt_template: 'Summarize the current credit ratings for {{company_name}} from major rating agencies.',
    enabled: true
  },
  'financials': {
    id: 'financials',
    name: 'Financial Analysis',
    type: 'analysis',
    description: 'Analyze key financial metrics',
    prompt_template: 'Analyze the key financial metrics and ratios for {{company_name}}.',
    enabled: true
  },
  'compliance_checks': {
    id: 'compliance_checks',
    name: 'Compliance Checks',
    type: 'search',
    description: 'Check for regulatory compliance issues',
    prompt_template: 'Check for any regulatory compliance issues or violations for {{company_name}}.',
    enabled: true
  },
  'news_checks': {
    id: 'news_checks',
    name: 'News Checks',
    type: 'search',
    description: 'Search for recent news about the company',
    prompt_template: 'Find and summarize recent news articles about {{company_name}}.',
    enabled: true
  }
};

// Update a node configuration
async function updateNode(nodeId, updates) {
  // Check if node exists
  if (!MOCK_NODES[nodeId]) {
    throw new Error(`Node ${nodeId} not found`);
  }
  
  const node = { ...MOCK_NODES[nodeId] };
  
  // Update prompt template if provided
  if (updates.prompt_template !== undefined) {
    node.prompt_template = updates.prompt_template;
    
    // Handle version saving if requested
    if (updates.save_version) {
      console.log(`Saving version for ${nodeId}`, updates.version_name || 'unnamed');
    }
  }
  
  // Update enabled status if provided
  if (updates.enabled !== undefined) {
    node.enabled = updates.enabled;
  }
  
  // Update the node in our mock data
  MOCK_NODES[nodeId] = node;
  
  return node;
}

// Main handler function for the serverless endpoint
module.exports = async (req, res) => {
  // Extract the node ID from the URL
  const { id } = req.query;
  
  // Handle node toggling through a dedicated endpoint
  if (req.url.includes('/toggle')) {
    try {
      // Only accept PUT requests
      if (req.method !== 'PUT') {
        return res.status(405).json({
          success: false,
          node: {
            id: '',
            name: '',
            type: '',
            description: '',
            prompt_template: '',
            enabled: false
          },
          error: 'Method not allowed'
        });
      }
      
      // Parse request body for toggle data
      const updates = { enabled: req.body.enabled };
      
      // Update the node
      const updatedNode = await updateNode(id, updates);
      
      // Return success response
      return res.status(200).json({
        success: true,
        node: updatedNode
      });
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      console.error(`API error in /workflow/nodes/[id]/toggle: ${errorMessage}`);
      
      return res.status(500).json({
        success: false,
        node: {
          id: '',
          name: '',
          type: '',
          description: '',
          prompt_template: '',
          enabled: false
        },
        error: errorMessage
      });
    }
  }
  
  // Handle regular node updates
  try {
    // Only accept PUT requests
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        node: {
          id: '',
          name: '',
          type: '',
          description: '',
          prompt_template: '',
          enabled: false
        },
        error: 'Method not allowed'
      });
    }
    
    // Get node ID from URL parameters
    if (!id) {
      return res.status(400).json({
        success: false,
        node: {
          id: '',
          name: '',
          type: '',
          description: '',
          prompt_template: '',
          enabled: false
        },
        error: 'Missing node ID'
      });
    }
    
    // Parse the request body
    const updates = req.body;
    
    // Update the node
    const updatedNode = await updateNode(id, updates);
    
    // Return the updated node
    return res.status(200).json({
      success: true,
      node: updatedNode
    });
    
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`API error in /workflow/nodes/[id]: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      node: {
        id: '',
        name: '',
        type: '',
        description: '',
        prompt_template: '',
        enabled: false
      },
      error: errorMessage
    });
  }
};
