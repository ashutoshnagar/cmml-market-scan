/**
 * Workflow Management Service for CMML Research Platform
 * Handles node configuration, prompt management, and workflow visualization
 */

import apiService, { ApiService } from './api';

// Types
export interface Node {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt_template: string;
  enabled: boolean;
}

export interface NodeResult {
  nodeId: string;
  input: string;
  output: string;
  status: 'completed' | 'failed' | 'skipped' | 'pending' | 'processing';
}

export interface WorkflowConfig {
  nodes: Node[];
}

export interface UpdateNodeRequest {
  nodeId: string;
  enabled: boolean;
  prompt_template?: string;
  save_version?: boolean;
  version_name?: string;
}

export interface UpdateNodeResponse {
  success: boolean;
  node: Node;
  error?: string;
}

export interface PromptVersion {
  version_id: string;
  version_name: string;
  prompt_template: string;
  created_at: string;
  node_id: string;
  node_name: string;
}

export interface VersionResponse {
  success: boolean;
  version?: PromptVersion;
  versions?: PromptVersion[];
  error?: string;
  message?: string;
}

export interface ToggleNodeRequest {
  enabled: boolean;
}

// Mock data until backend is updated
const MOCK_NODES: Node[] = [
  {
    id: 'company_overview',
    name: 'Company & Business Overview',
    type: 'google_search',
    description: 'Analyzes company overview using web search',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, Please perform internet based research...',
    enabled: true
  },
  {
    id: 'industry_overview',
    name: 'Industry Overview',
    type: 'google_search',
    description: 'Analyzes industry trends and competitive landscape',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, Please perform internet based research...',
    enabled: true
  },
  {
    id: 'promoters_directors',
    name: 'Promoters and Directors',
    type: 'pdf_analysis',
    description: 'Extracts promoter and board information from PDF',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, pls extract and analyze information...',
    enabled: true
  },
  {
    id: 'credit_rating',
    name: 'Credit Rating History',
    type: 'pdf_analysis',
    description: 'Extracts credit rating history from PDF',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, please extract and analyze the Credit Rating History...',
    enabled: true
  },
  {
    id: 'financials',
    name: 'Financial Performance',
    type: 'pdf_analysis',
    description: 'Extracts financial metrics from PDF',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, please extract and analyze Key Financial Performance metrics...',
    enabled: true
  },
  {
    id: 'compliance_checks',
    name: 'Compliance & Due Diligence',
    type: 'google_search',
    description: 'Performs compliance and regulatory checks',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, Conduct comprehensive compliance and due diligence checks...',
    enabled: true
  },
  {
    id: 'news_checks',
    name: 'News & Media Analysis',
    type: 'google_search',
    description: 'Analyzes recent news and media coverage',
    prompt_template: 'As an analyst for the Corporate & Mid-Market Lending team in Piramal Finance, analyze recent news and media coverage...',
    enabled: true
  }
];

// Workflow Service Class
export class WorkflowService {
  private apiService: ApiService;
  
  constructor(apiServiceInstance = apiService) {
    this.apiService = apiServiceInstance;
  }
  
  /**
   * Get the current base URL from the API service
   */
  private getBaseUrl(): string {
    return this.apiService.getCurrentBaseUrl();
  }
  
  /**
   * Get all workflow nodes
   */
  async getNodes(): Promise<Node[]> {
    try {
      // Try to fetch from real API first
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not fetch nodes from API, using mock data:', e);
      }
      
      // Fallback to mock data
      return MOCK_NODES;
    } catch (error) {
      console.error('Failed to fetch workflow nodes:', error);
      throw error;
    }
  }
  
  /**
   * Update a node configuration
   */
  async updateNode(data: UpdateNodeRequest): Promise<UpdateNodeResponse> {
    try {
      // Try to use real API first
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes/${data.nodeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not update node via API, using mock data:', e);
      }
      
      // Fallback to mock response
      const node = MOCK_NODES.find(n => n.id === data.nodeId);
      if (!node) {
        return {
          success: false,
          node: MOCK_NODES[0], // Dummy
          error: `Node with ID ${data.nodeId} not found`
        };
      }
      
      // Update node in mock data
      node.enabled = data.enabled;
      if (data.prompt_template) {
        node.prompt_template = data.prompt_template;
      }
      
      return {
        success: true,
        node: { ...node }
      };
    } catch (error) {
      console.error(`Failed to update node ${data.nodeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Toggle a node's enabled status
   */
  async toggleNode(nodeId: string, enabled: boolean): Promise<UpdateNodeResponse> {
    try {
      // Try to use real API first
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes/${nodeId}/toggle`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled })
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not toggle node via API, using mock data:', e);
      }
      
      // Fallback to mock response
      const node = MOCK_NODES.find(n => n.id === nodeId);
      if (!node) {
        return {
          success: false,
          node: MOCK_NODES[0], // Dummy
          error: `Node with ID ${nodeId} not found`
        };
      }
      
      // Update node in mock data
      node.enabled = enabled;
      
      return {
        success: true,
        node: { ...node }
      };
    } catch (error) {
      console.error(`Failed to toggle node ${nodeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get prompt versions for a node
   */
  async getNodeVersions(nodeId: string): Promise<VersionResponse> {
    try {
      // Try to use real API
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes/${nodeId}/versions`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not fetch versions via API, using mock data:', e);
      }
      
      // Fallback to mock response
      return {
        success: true,
        versions: [
          {
            version_id: 'v1',
            version_name: 'Original Version',
            prompt_template: 'Mock prompt template for original version',
            created_at: new Date().toISOString(),
            node_id: nodeId,
            node_name: MOCK_NODES.find(n => n.id === nodeId)?.name || 'Unknown Node'
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to fetch versions for node ${nodeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save a new prompt version
   */
  async saveNodeVersion(nodeId: string, promptTemplate: string, versionName?: string): Promise<VersionResponse> {
    try {
      // Try to use real API
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes/${nodeId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt_template: promptTemplate,
            version_name: versionName
          })
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not save version via API, using mock data:', e);
      }
      
      // Fallback to mock response
      const versionId = `v${Date.now()}`;
      return {
        success: true,
        version: {
          version_id: versionId,
          version_name: versionName || `Version ${versionId}`,
          prompt_template: promptTemplate,
          created_at: new Date().toISOString(),
          node_id: nodeId,
          node_name: MOCK_NODES.find(n => n.id === nodeId)?.name || 'Unknown Node'
        }
      };
    } catch (error) {
      console.error(`Failed to save version for node ${nodeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Activate a specific prompt version
   */
  async activateNodeVersion(nodeId: string, versionId: string): Promise<VersionResponse> {
    try {
      // Try to use real API
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/nodes/${nodeId}/versions/${versionId}/activate`, {
          method: 'PUT'
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Could not activate version via API, using mock data:', e);
      }
      
      // Fallback to mock response
      return {
        success: true,
        message: `Version ${versionId} activated for node ${nodeId}`,
        version: {
          version_id: versionId,
          version_name: `Version ${versionId}`,
          prompt_template: 'Mock prompt template for activated version',
          created_at: new Date().toISOString(),
          node_id: nodeId,
          node_name: MOCK_NODES.find(n => n.id === nodeId)?.name || 'Unknown Node'
        }
      };
    } catch (error) {
      console.error(`Failed to activate version ${versionId} for node ${nodeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get node results for an analysis
   */
  async getNodeResults(analysisId: string): Promise<NodeResult[]> {
    try {
      // Get node outputs from the API (if available)
      let nodeOutputs: Record<string, string> = {};
      try {
        const response = await fetch(`${this.getBaseUrl()}/workflow/node_outputs/${analysisId}`);
        if (response.ok) {
          nodeOutputs = await response.json();
        }
      } catch (e) {
        console.warn('Could not fetch node outputs:', e);
      }
      
      // Return simplified node results with placeholder data
      return MOCK_NODES.map(node => {
        return {
          nodeId: node.id,
          input: `Input for ${node.name}`,
          output: nodeOutputs[node.id] || `<p>No output available for ${node.name}</p>`,
          status: 'completed' // We'll just show all nodes as completed
        };
      });
    } catch (error) {
      console.error(`Failed to fetch node results for analysis ${analysisId}:`, error);
      // Return default status for all nodes
      return MOCK_NODES.map(node => ({
        nodeId: node.id,
        input: `Input for ${node.name}`,
        output: `<p>Error fetching output for ${node.name}</p>`,
        status: 'pending' as NodeResult['status']
      }));
    }
  }
}

// Create and export a singleton instance
export const workflowService = new WorkflowService();

export default workflowService;
