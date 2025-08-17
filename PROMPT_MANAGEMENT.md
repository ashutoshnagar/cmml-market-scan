# Prompt Management Documentation

## Overview

The CMML Market Scan application uses a centralized prompt management system that allows you to modify all AI prompts without touching the codebase. This system is designed for flexibility, maintainability, and easy customization.

## Architecture

### Components

1. **`prompts_config.yaml`** - Central configuration file containing all prompt templates
2. **`PromptManager`** - Python class that loads, validates, and manages prompts
3. **Workflow Integration** - All nodes use PromptManager to retrieve prompts

## Configuration File Structure

The `prompts_config.yaml` file contains:

```yaml
version: "1.0"
metadata:
  description: "Prompt templates for CMML Market Scan workflow nodes"
  last_modified: "2025-01-16"
  author: "CMML System"

nodes:
  <node_id>:
    name: "Human-readable name"
    type: "google_search" or "pdf_analysis"
    description: "What this node does"
    prompt_template: |
      The actual prompt template with {variables}
```

## Available Nodes

### Web Search Nodes
- **`company_overview`** - Company and business overview
- **`industry_overview`** - Industry analysis and trends
- **`compliance_checks`** - Compliance and due diligence
- **`news_checks`** - Recent news and media coverage

### PDF Analysis Nodes
- **`promoters_directors`** - Board and shareholding information
- **`credit_rating`** - Credit rating history
- **`financials`** - Financial performance metrics

## How to Modify Prompts

### 1. Locate the Node
Open `src/prompts_config.yaml` and find the node you want to modify by its ID.

### 2. Edit the Prompt Template
Modify the `prompt_template` field for that node. Keep the formatting and structure:

```yaml
nodes:
  company_overview:
    prompt_template: |
      Your modified prompt here...
      Keep the {company_name} variable intact
```

### 3. Variables
Each prompt can use variables that are automatically substituted:
- `{company_name}` - The name of the company being analyzed

### 4. Save and Test
Save the file and run the application. Changes take effect immediately (no restart needed if hot-reload is enabled).

## PromptManager Features

### Core Functions

```python
# Initialize the manager
manager = PromptManager()

# Get a prompt with variable substitution
prompt = manager.get_prompt('company_overview', company_name='Apple Inc.')

# Get node information
node_info = manager.get_node_info('company_overview')

# Get all nodes of a type
web_nodes = manager.get_node_by_type('google_search')

# Reload configuration (for development)
manager.reload_configuration()
```

### Advanced Features

1. **Prompt Caching** - Prompts are cached in memory for performance
2. **Variable Validation** - Ensures all required variables are provided
3. **Runtime Updates** - Modify prompts programmatically if needed
4. **Statistics** - Get usage statistics and configuration info

## Best Practices

### 1. Prompt Structure
- Start with clear context about what you need
- Use numbered lists for structured outputs
- Specify the output format (HTML, tables, etc.)
- Include examples where helpful

### 2. HTML Formatting
Since outputs are rendered as HTML:
- Request HTML tables for structured data
- Ask for proper headings (`<h3>`, `<h4>`)
- Request highlighting of important information
- Use lists for multiple items

### 3. Variable Usage
- Always include `{company_name}` where needed
- Use consistent variable naming
- Document any new variables you add

### 4. Testing Changes
- Test with different company names
- Verify HTML output renders correctly
- Check both with and without PDF files
- Test edge cases (small companies, non-English names)

## Examples

### Adding a New Analysis Point
To add a new analysis point to an existing node:

```yaml
nodes:
  company_overview:
    prompt_template: |
      Please provide a comprehensive overview of **{company_name}**...
      
      # Existing points...
      
      9. **New Analysis Point:** What specific aspect to analyze?
      
      Format the response in HTML with proper headings and structure.
```

### Changing Output Format
To change from bullet points to a table:

```yaml
nodes:
  credit_rating:
    prompt_template: |
      Extract credit ratings for {company_name}.
      
      Create an HTML table with columns:
      - Date
      - Agency
      - Rating
      - Outlook
      
      Sort by date (newest first).
```

### Adding Emphasis
To emphasize certain findings:

```yaml
nodes:
  compliance_checks:
    prompt_template: |
      Check compliance for **{company_name}**.
      
      **IMPORTANT:** Highlight any RED FLAGS in bold red text.
      Use <span style="color: red; font-weight: bold;">RED FLAG</span>
      for critical issues.
```

## Troubleshooting

### Common Issues

1. **Missing Variable Error**
   - Error: `Missing required variable for node 'node_id': company_name`
   - Solution: Ensure you're not removing `{company_name}` from templates

2. **YAML Syntax Error**
   - Error: `Failed to load prompts configuration`
   - Solution: Check YAML indentation and use proper `|` for multiline strings

3. **Node Not Found**
   - Error: `Node 'node_id' not found`
   - Solution: Use exact node IDs from the configuration file

### Validation

Run this script to validate your configuration:

```python
from src.prompt_manager import PromptManager

try:
    manager = PromptManager()
    stats = manager.get_statistics()
    print(f"✓ Configuration valid")
    print(f"  Total nodes: {stats['total_nodes']}")
    print(f"  Nodes by type: {stats['nodes_by_type']}")
except Exception as e:
    print(f"✗ Configuration error: {e}")
```

## Environment Settings

The `prompts_config.yaml` includes settings that control behavior:

```yaml
settings:
  allow_override: true      # Allow runtime prompt overrides
  validate_variables: true  # Validate all required variables
  cache_prompts: true      # Cache prompts in memory
  hot_reload: false        # Auto-reload on file changes (dev only)
```

## Version Control

### Tracking Changes
- Always update the `last_modified` date when making changes
- Consider incrementing the version for major changes
- Use git to track prompt evolution

### Backup Strategy
- Keep backups of working prompt configurations
- Test changes in development before production
- Document why changes were made in commit messages

## Integration with Workflow

The workflow automatically uses prompts from configuration:

```python
# In each node method:
prompt = self.prompt_manager.get_prompt('node_id', company_name=company_name)
```

No code changes needed when modifying prompts!

## Future Enhancements

Potential improvements to the prompt management system:

1. **Multi-language Support** - Different prompts for different languages
2. **A/B Testing** - Test different prompt versions
3. **Prompt Templates Library** - Reusable prompt components
4. **Dynamic Prompts** - Adjust based on company type/industry
5. **Prompt Analytics** - Track which prompts perform best

## Support

For issues or questions about prompt management:
1. Check this documentation
2. Review the `prompts_config.yaml` file
3. Test with the validation script
4. Check application logs for detailed error messages

---

*Last Updated: January 16, 2025*
