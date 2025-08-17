import React, { useState, useEffect } from 'react';
import workflowService, { Node, NodeResult } from '../services/workflowService';
import NodeEditor from './NodeEditor';
import WorkflowGraph from './WorkflowGraph';

interface WorkflowManagerProps {
  analysisId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ analysisId, isOpen, onClose }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeResults, setNodeResults] = useState<NodeResult[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch nodes when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchNodes();
    }
  }, [isOpen]);

  // Fetch node results when analysisId changes
  useEffect(() => {
    if (analysisId && isOpen) {
      fetchNodeResults(analysisId);
    }
  }, [analysisId, isOpen]);

  const fetchNodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await workflowService.getNodes();
      
      // Ensure we always have an array, even if the API returns null or undefined
      const safeData = Array.isArray(data) ? data : [];
      setNodes(safeData);
      
      if (!Array.isArray(data)) {
        console.warn('API returned non-array data for nodes:', data);
      }
    } catch (err) {
      setError('Failed to fetch workflow nodes');
      console.error(err);
      // Ensure nodes is always an array
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNodeResults = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await workflowService.getNodeResults(id);
      
      // Ensure we always have an array, even if the API returns null or undefined
      const safeData = Array.isArray(data) ? data : [];
      setNodeResults(safeData);
      
      if (!Array.isArray(data)) {
        console.warn('API returned non-array data for node results:', data);
      }
    } catch (err) {
      setError('Failed to fetch node results');
      console.error(err);
      // Ensure nodeResults is always an array
      setNodeResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setIsEditorOpen(true);
  };

  const handleNodeUpdate = async (nodeId: string, enabled: boolean, prompt_template?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await workflowService.updateNode({
        nodeId,
        enabled,
        prompt_template,
        save_version: false // Not saving as a version by default
      });
      
      if (response.success) {
        // Update the nodes list with the updated node
        setNodes(prev => {
          // Ensure prev is an array
          const safeNodes = Array.isArray(prev) ? prev : [];
          return safeNodes.map(node => 
            node.id === nodeId ? response.node : node
          );
        });
        
        // Close the editor
        setIsEditorOpen(false);
        setSelectedNode(null);
      } else {
        setError(response.error || 'Failed to update node');
      }
    } catch (err) {
      setError('Failed to update node configuration');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNodeToggle = async (nodeId: string, enabled: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await workflowService.toggleNode(nodeId, enabled);
      
      if (response.success) {
        // Update the nodes list with the updated node
        setNodes(prev => {
          // Ensure prev is an array
          const safeNodes = Array.isArray(prev) ? prev : [];
          return safeNodes.map(node => 
            node.id === nodeId ? response.node : node
          );
        });
      } else {
        setError(response.error || 'Failed to toggle node');
      }
    } catch (err) {
      setError('Failed to toggle node');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedNode(null);
  };

  // If not open, don't render anything
  if (!isOpen) return null;

  // Ensure nodes is always an array for rendering
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeNodeResults = Array.isArray(nodeResults) ? nodeResults : [];

  return (
    <div className="workflow-manager">
      <div className="workflow-header">
        <h2>Workflow Manager</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="workflow-content">
        <div className="workflow-sidebar">
          <h3>Workflow Nodes</h3>
          {isLoading && <div className="loading-message">Loading...</div>}
          
          <ul className="node-list">
            {safeNodes.map(node => (
              <li 
                key={node.id} 
                className={`node-item ${!node.enabled ? 'node-disabled' : ''}`}
              >
                <div 
                  className="node-info"
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="node-title">{node.name}</div>
                  <div className="node-type">{node.type}</div>
                </div>
                <div className="node-actions">
                  <button 
                    className={`toggle-button ${node.enabled ? 'enabled' : 'disabled'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeToggle(node.id, !node.enabled);
                    }}
                    title={node.enabled ? 'Disable Node' : 'Enable Node'}
                  >
                    {node.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button 
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(node);
                    }}
                    title="Edit Node"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="workflow-main">
          {isEditorOpen && selectedNode ? (
            <NodeEditor
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onClose={handleCloseEditor}
            />
          ) : (
            <WorkflowGraph 
              nodes={safeNodes}
              nodeResults={safeNodeResults}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;
