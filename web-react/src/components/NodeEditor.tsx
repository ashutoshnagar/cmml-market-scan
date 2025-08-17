import React, { useState, useEffect } from 'react';
import { Node, PromptVersion } from '../services/workflowService';
import workflowService from '../services/workflowService';

interface NodeEditorProps {
  node: Node;
  onUpdate: (nodeId: string, enabled: boolean, prompt_template?: string) => Promise<void>;
  onClose: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, onClose }) => {
  const [isEnabled, setIsEnabled] = useState(node.enabled);
  const [promptTemplate, setPromptTemplate] = useState(node.prompt_template);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Load versions when component mounts
  useEffect(() => {
    loadVersions();
  }, [node.id]);
  
  const loadVersions = async () => {
    try {
      setIsLoadingVersions(true);
      const response = await workflowService.getNodeVersions(node.id);
      if (response.success && response.versions) {
        setVersions(response.versions);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      if (saveAsNewVersion) {
        const response = await workflowService.saveNodeVersion(
          node.id, 
          promptTemplate, 
          versionName || undefined
        );
        
        if (response.success) {
          setSuccessMessage(`Version "${response.version?.version_name}" saved successfully`);
          await loadVersions(); // Refresh versions list
        }
      }
      
      await onUpdate(node.id, isEnabled, promptTemplate);
      
      if (!saveAsNewVersion) {
        setSuccessMessage('Node updated successfully');
      }
    } catch (err) {
      setError('Failed to update node configuration');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVersionSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const versionId = e.target.value;
    if (versionId === '') {
      return;
    }
    
    setSelectedVersionId(versionId);
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Find the version in the already loaded versions
      const version = versions.find(v => v.version_id === versionId);
      
      if (version) {
        setPromptTemplate(version.prompt_template);
        setSuccessMessage(`Loaded version "${version.version_name}"`);
      } else {
        // If not found, try to load it from the API
        const response = await workflowService.activateNodeVersion(node.id, versionId);
        if (response.success && response.version) {
          setPromptTemplate(response.version.prompt_template);
          setSuccessMessage(`Loaded version "${response.version.version_name}"`);
        }
      }
    } catch (err) {
      setError('Failed to load version');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="node-editor">
      <div className="node-editor-header">
        <div className="header-title-status">
          <h3>Edit Node: {node.name}</h3>
          <div className="header-status-toggle">
            <label className="toggle-label">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
              <span className={isEnabled ? 'enabled-text' : 'disabled-text'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="node-info-row">
        <div className="node-type-info">
          <span className="info-label">Type:</span>
          <span className="node-type-badge">{node.type}</span>
        </div>
        <div className="node-description-info">
          <span className="info-label">Description:</span>
          <span className="node-description">{node.description}</span>
        </div>
      </div>
      
      <div className="node-editor-content">
        <div className="node-editor-main">
          <form onSubmit={handleSubmit}>
            <div className="form-group prompt-template-group">
              <label htmlFor="promptTemplate" className="template-label">Custom Prompt Template:</label>
              <textarea
                id="promptTemplate"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={16}
                placeholder="Enter custom prompt template..."
                className="prompt-textarea"
              />
              <p className="help-text">
                Use {'{company_name}'} as a placeholder for the company name.
              </p>
            </div>
            
            <div className="form-actions">
              <div className="version-actions">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={saveAsNewVersion}
                      onChange={(e) => setSaveAsNewVersion(e.target.checked)}
                    />
                    Save as new version
                  </label>
                </div>
                
                {saveAsNewVersion && (
                  <div className="version-name-group">
                    <input
                      id="versionName"
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="Enter version name"
                      className="version-name-input"
                    />
                  </div>
                )}
              </div>
              
              <div className="button-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (saveAsNewVersion ? 'Save New Version' : 'Save Changes')}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="node-editor-sidebar">
          <div className="versions-panel">
            <h4>Prompt Versions</h4>
            <select
              id="versionSelect"
              onChange={handleVersionSelect}
              value={selectedVersionId || ''}
              disabled={isLoadingVersions || isSubmitting}
              className="version-select"
            >
              <option value="">-- Select a version --</option>
              {versions.map(version => (
                <option key={version.version_id} value={version.version_id}>
                  {version.version_name} ({new Date(version.created_at).toLocaleString()})
                </option>
              ))}
            </select>
            {isLoadingVersions && <span className="loading-indicator">Loading versions...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
