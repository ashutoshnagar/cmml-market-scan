"""
Prompt Manager for CMML Market Scan
Manages loading, caching, and templating of prompts from YAML configuration
"""

import os
import yaml
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
from loguru import logger


class PromptManager:
    """Manages prompt templates from YAML configuration."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the PromptManager with a configuration file.
        
        Args:
            config_path: Path to the YAML configuration file.
                        Defaults to 'src/prompts_config.yaml'
        """
        if config_path is None:
            # Default to prompts_config.yaml in the same directory as this file
            config_path = Path(__file__).parent / 'prompts_config.yaml'
        
        self.config_path = Path(config_path)
        self.prompts_data = None
        self.prompts_cache = {}
        
        # Setup version storage directory
        self.versions_dir = Path(__file__).parent.parent / 'prompts_versions'
        self.versions_dir.mkdir(exist_ok=True)
        
        self._load_configuration()
    
    def _load_configuration(self) -> None:
        """Load the YAML configuration file."""
        try:
            if not self.config_path.exists():
                raise FileNotFoundError(f"Prompts configuration file not found: {self.config_path}")
            
            with open(self.config_path, 'r', encoding='utf-8') as file:
                self.prompts_data = yaml.safe_load(file)
            
            logger.info(f"Loaded prompts configuration from {self.config_path}")
            logger.info(f"Configuration version: {self.prompts_data.get('version', 'unknown')}")
            
            # Validate configuration structure
            self._validate_configuration()
            
            # Cache prompts if enabled
            if self.prompts_data.get('settings', {}).get('cache_prompts', True):
                self._cache_all_prompts()
                
        except Exception as e:
            logger.error(f"Failed to load prompts configuration: {str(e)}")
            raise
    
    def _validate_configuration(self) -> None:
        """Validate the configuration structure."""
        if not self.prompts_data:
            raise ValueError("Empty configuration file")
        
        if 'nodes' not in self.prompts_data:
            raise ValueError("Missing 'nodes' section in configuration")
        
        # Validate each node has required fields
        for node_id, node_config in self.prompts_data['nodes'].items():
            required_fields = ['name', 'type', 'prompt_template']
            for field in required_fields:
                if field not in node_config:
                    raise ValueError(f"Node '{node_id}' missing required field: {field}")
        
        # Ensure each node has an 'enabled' property (default to True if not present)
        for node_id, node_config in self.prompts_data['nodes'].items():
            if 'enabled' not in node_config:
                self.prompts_data['nodes'][node_id]['enabled'] = True
        
        logger.info(f"Configuration validated: {len(self.prompts_data['nodes'])} nodes found")
    
    def _cache_all_prompts(self) -> None:
        """Cache all prompts in memory."""
        for node_id in self.prompts_data['nodes']:
            self.prompts_cache[node_id] = self.prompts_data['nodes'][node_id]['prompt_template']
        logger.info(f"Cached {len(self.prompts_cache)} prompts")
    
    def get_prompt(self, node_id: str, **variables) -> str:
        """
        Get a prompt template for a specific node and substitute variables.
        
        Args:
            node_id: The ID of the node (e.g., 'company_overview')
            **variables: Variables to substitute in the template (e.g., company_name='Apple Inc.')
        
        Returns:
            The formatted prompt with variables substituted
        
        Raises:
            KeyError: If the node_id doesn't exist
            ValueError: If required variables are missing
        """
        # Check if node exists
        if node_id not in self.prompts_data['nodes']:
            available_nodes = list(self.prompts_data['nodes'].keys())
            raise KeyError(f"Node '{node_id}' not found. Available nodes: {available_nodes}")
        
        # Get the prompt template (from cache if available)
        if self.prompts_cache and node_id in self.prompts_cache:
            prompt_template = self.prompts_cache[node_id]
        else:
            prompt_template = self.prompts_data['nodes'][node_id]['prompt_template']
        
        # Validate required variables if configured
        if self.prompts_data.get('settings', {}).get('validate_variables', True):
            self._validate_variables(prompt_template, variables)
        
        # Format the template with variables
        try:
            formatted_prompt = prompt_template.format(**variables)
            logger.debug(f"Generated prompt for node '{node_id}' with variables: {list(variables.keys())}")
            return formatted_prompt
        except KeyError as e:
            raise ValueError(f"Missing required variable for node '{node_id}': {e}")
    
    def _validate_variables(self, template: str, variables: Dict[str, Any]) -> None:
        """
        Validate that all required variables are provided.
        
        Args:
            template: The prompt template string
            variables: Dictionary of variables provided
        
        Raises:
            ValueError: If required variables are missing
        """
        # Extract variable names from template
        import re
        pattern = r'\{(\w+)\}'
        required_vars = set(re.findall(pattern, template))
        provided_vars = set(variables.keys())
        
        missing_vars = required_vars - provided_vars
        if missing_vars:
            raise ValueError(f"Missing required variables: {missing_vars}")
    
    def get_node_info(self, node_id: str) -> Dict[str, Any]:
        """
        Get complete information about a node.
        
        Args:
            node_id: The ID of the node
        
        Returns:
            Dictionary containing node configuration
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
        
        return self.prompts_data['nodes'][node_id]
    
    def get_all_nodes(self) -> Dict[str, Any]:
        """
        Get information about all nodes.
        
        Returns:
            Dictionary of all node configurations
        """
        return self.prompts_data['nodes']
    
    def get_node_by_type(self, node_type: str) -> Dict[str, Any]:
        """
        Get all nodes of a specific type.
        
        Args:
            node_type: The type of nodes to retrieve (e.g., 'google_search', 'pdf_analysis')
        
        Returns:
            Dictionary of nodes matching the specified type
        """
        filtered_nodes = {
            node_id: node_config
            for node_id, node_config in self.prompts_data['nodes'].items()
            if node_config.get('type') == node_type
        }
        return filtered_nodes
    
    def reload_configuration(self) -> None:
        """
        Reload the configuration from file.
        Useful for hot-reloading during development.
        """
        logger.info("Reloading prompts configuration...")
        self.prompts_cache.clear()
        self._load_configuration()
    
    def update_prompt(self, node_id: str, new_prompt: str, persist: bool = False) -> None:
        """
        Update a prompt template at runtime.
        
        Args:
            node_id: The ID of the node to update
            new_prompt: The new prompt template
            persist: Whether to save the change to the YAML file
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
        
        # Update in memory
        self.prompts_data['nodes'][node_id]['prompt_template'] = new_prompt
        
        # Update cache if caching is enabled
        if self.prompts_cache and node_id in self.prompts_cache:
            self.prompts_cache[node_id] = new_prompt
        
        logger.info(f"Updated prompt for node '{node_id}'")
        
        # Persist to file if requested
        if persist:
            self._save_configuration()
    
    def _save_configuration(self) -> None:
        """Save the current configuration back to the YAML file."""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as file:
                yaml.dump(self.prompts_data, file, 
                         default_flow_style=False, 
                         allow_unicode=True,
                         sort_keys=False)
            logger.info(f"Saved configuration to {self.config_path}")
        except Exception as e:
            logger.error(f"Failed to save configuration: {str(e)}")
            raise
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the loaded prompts.
        
        Returns:
            Dictionary containing prompt statistics
        """
        stats = {
            'total_nodes': len(self.prompts_data['nodes']),
            'nodes_by_type': {},
            'cached_prompts': len(self.prompts_cache),
            'configuration_version': self.prompts_data.get('version', 'unknown'),
            'last_modified': self.prompts_data.get('metadata', {}).get('last_modified', 'unknown')
        }
        
        # Count nodes by type
        for node_config in self.prompts_data['nodes'].values():
            node_type = node_config.get('type', 'unknown')
            stats['nodes_by_type'][node_type] = stats['nodes_by_type'].get(node_type, 0) + 1
        
        return stats
    
    # New versioning methods
    
    def save_prompt_version(self, node_id: str, prompt_template: str, version_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Save a new version of a prompt template.
        
        Args:
            node_id: The ID of the node
            prompt_template: The prompt template to save
            version_name: Optional name for this version (defaults to timestamp)
            
        Returns:
            Dictionary with version information
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
            
        # Create node directory if it doesn't exist
        node_dir = self.versions_dir / node_id
        node_dir.mkdir(exist_ok=True)
        
        # Generate timestamp for version ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate version name if not provided
        if not version_name:
            version_name = f"Version {timestamp}"
        
        # Create version object
        version_data = {
            'version_id': timestamp,
            'version_name': version_name,
            'prompt_template': prompt_template,
            'created_at': datetime.now().isoformat(),
            'node_id': node_id,
            'node_name': self.prompts_data['nodes'][node_id].get('name', node_id)
        }
        
        # Save version to file
        version_file = node_dir / f"{timestamp}.json"
        with open(version_file, 'w', encoding='utf-8') as f:
            json.dump(version_data, f, indent=2)
            
        # Also update the current prompt if auto-apply is true
        self.update_prompt(node_id, prompt_template, persist=True)
        
        logger.info(f"Saved version {timestamp} for node '{node_id}'")
        return version_data
    
    def get_version_history(self, node_id: str) -> List[Dict[str, Any]]:
        """
        Get version history for a node.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            List of version information dictionaries, sorted by date (newest first)
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
            
        # Check if node directory exists
        node_dir = self.versions_dir / node_id
        if not node_dir.exists():
            return []
            
        # Get all version files
        version_files = list(node_dir.glob("*.json"))
        if not version_files:
            return []
            
        # Load version data
        versions = []
        for file in version_files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    version_data = json.load(f)
                    versions.append(version_data)
            except Exception as e:
                logger.error(f"Failed to load version from {file}: {str(e)}")
                
        # Sort versions by timestamp (newest first)
        versions.sort(key=lambda v: v.get('created_at', ''), reverse=True)
        return versions
    
    def get_version(self, node_id: str, version_id: str) -> Dict[str, Any]:
        """
        Get a specific version of a prompt.
        
        Args:
            node_id: The ID of the node
            version_id: The version ID
            
        Returns:
            Version information dictionary
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
            
        # Check if version file exists
        version_file = self.versions_dir / node_id / f"{version_id}.json"
        if not version_file.exists():
            raise KeyError(f"Version '{version_id}' not found for node '{node_id}'")
            
        # Load version data
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load version {version_id}: {str(e)}")
            raise
    
    def set_active_version(self, node_id: str, version_id: str) -> Dict[str, Any]:
        """
        Set a specific version as the active prompt.
        
        Args:
            node_id: The ID of the node
            version_id: The version ID
            
        Returns:
            Dictionary with active version information
        """
        # Get the version data
        version_data = self.get_version(node_id, version_id)
        
        # Extract the prompt template
        prompt_template = version_data.get('prompt_template')
        if not prompt_template:
            raise ValueError(f"Invalid version data: missing prompt_template")
            
        # Update the prompt
        self.update_prompt(node_id, prompt_template, persist=True)
        
        logger.info(f"Set version {version_id} as active for node '{node_id}'")
        return version_data
    
    def is_node_enabled(self, node_id: str) -> bool:
        """
        Check if a node is enabled.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            True if the node is enabled, False otherwise
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
            
        # Get the enabled status (default to True if not present)
        return self.prompts_data['nodes'][node_id].get('enabled', True)
    
    def set_node_enabled(self, node_id: str, enabled: bool) -> Dict[str, Any]:
        """
        Enable or disable a node.
        
        Args:
            node_id: The ID of the node
            enabled: True to enable, False to disable
            
        Returns:
            Dictionary with updated node information
        """
        if node_id not in self.prompts_data['nodes']:
            raise KeyError(f"Node '{node_id}' not found")
            
        # Update the enabled status
        self.prompts_data['nodes'][node_id]['enabled'] = enabled
        
        # Save the configuration
        self._save_configuration()
        
        logger.info(f"{'Enabled' if enabled else 'Disabled'} node '{node_id}'")
        return self.prompts_data['nodes'][node_id]


# Example usage and testing
if __name__ == "__main__":
    # Initialize the prompt manager
    manager = PromptManager()
    
    # Get statistics
    stats = manager.get_statistics()
    print(f"Prompt Manager Statistics:")
    print(f"  Total nodes: {stats['total_nodes']}")
    print(f"  Nodes by type: {stats['nodes_by_type']}")
    print(f"  Configuration version: {stats['configuration_version']}")
    
    # Example: Get a prompt for company overview
    try:
        prompt = manager.get_prompt('company_overview', company_name='Apple Inc.')
        print(f"\nSample prompt generated for 'company_overview':")
        print(prompt[:200] + "...")  # Print first 200 characters
    except Exception as e:
        print(f"Error: {e}")
    
    # List all available nodes
    print(f"\nAvailable nodes:")
    for node_id, node_info in manager.get_all_nodes().items():
        print(f"  - {node_id}: {node_info['name']} ({node_info['type']})")
