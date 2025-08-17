"""
CMML Market Scan API Server
Flask web server for the CMML Market Scan application.
Provides HTTP endpoints for workflow execution and management.
"""

import os
import uuid
import json
from pathlib import Path
from typing import Dict, List, Optional
from threading import Thread
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from loguru import logger

from .config import Config
from .market_scan_workflow import MarketScanWorkflow
from .prompt_manager import PromptManager

# Initialize configuration
config = Config()

# Configure logging
logger.remove()
logger.add(
    lambda msg: print(msg, end=""),
    level=config.log_level,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set upload folder for PDF files
UPLOAD_FOLDER = Path('uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Create a session store for tracking analyses
analysis_sessions: Dict[str, Dict] = {}


def run_workflow(company_name: str, pdf_path: Optional[str] = None, analysis_id: Optional[str] = None):
    """
    Run the market scan workflow.
    
    Args:
        company_name: Name of the company to analyze
        pdf_path: Optional path to company PDF document
        analysis_id: Optional analysis ID for status updates
        
    Returns:
        Dictionary with final report and processing details
    """
    try:
        logger.info(f"Starting LangGraph workflow for: {company_name}")
        
        # Initialize and run workflow
        workflow = MarketScanWorkflow(config)
        result = workflow.run(company_name, pdf_path)
        
        logger.success("Workflow completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        return {
            'success': False,
            'report': None,
            'company': company_name,
            'errors': [str(e)]
        }


def run_analysis_async(analysis_id: str, company_name: str, pdf_path: str):
    """Run analysis in a background thread and update the session store."""
    try:
        # Update session status to processing
        analysis_sessions[analysis_id]['status'] = 'processing'
        
        # Run the workflow
        result = run_workflow(company_name, pdf_path, analysis_id)
        
        # Check for errors
        errors = result.get('errors', [])
        
        # Determine overall status
        if not result['success']:
            overall_status = 'failed'
            logger.warning(f"Analysis {analysis_id} marked as failed")
        else:
            overall_status = 'completed'
            logger.success(f"Analysis {analysis_id} completed successfully")
        
        # Update session with results
        analysis_sessions[analysis_id].update({
            'result': result,
            'status': overall_status,
            'errors': errors
        })
        
        logger.info(f"Analysis {analysis_id} completed with status: {overall_status}")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Analysis {analysis_id} failed: {error_msg}")
        
        # Update session with error
        if analysis_id in analysis_sessions:
            analysis_sessions[analysis_id].update({
                'status': 'failed',
                'errors': [error_msg],
                'result': None
            })


@app.route('/api/analyze', methods=['POST'])
def analyze_company():
    """API endpoint to start company analysis."""
    try:
        # Check if company name was provided
        if 'company_name' not in request.form:
            return jsonify({
                'success': False,
                'errors': ['Company name is required']
            }), 400
        
        company_name = request.form['company_name']
        
        # Check if PDF file was uploaded
        if 'pdf_file' not in request.files:
            return jsonify({
                'success': False,
                'errors': ['PDF file is required']
            }), 400
        
        pdf_file = request.files['pdf_file']
        
        # Check if file is valid
        if pdf_file.filename == '':
            return jsonify({
                'success': False,
                'errors': ['No file selected']
            }), 400
        
        if not pdf_file.filename.lower().endswith('.pdf'):
            return jsonify({
                'success': False,
                'errors': ['Only PDF files are supported']
            }), 400
        
        # Save the file
        filename = secure_filename(pdf_file.filename)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        pdf_file.save(pdf_path)
        
        # Generate a unique ID for this analysis
        analysis_id = str(uuid.uuid4())
        
        # Create a new analysis session
        analysis_sessions[analysis_id] = {
            'company_name': company_name,
            'pdf_path': pdf_path,
            'status': 'uploading',
            'errors': [],
            'result': None
        }
        
        # Start analysis in a background thread
        thread = Thread(target=run_analysis_async, args=(analysis_id, company_name, pdf_path))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'company': company_name,
            'analysis_id': analysis_id,
            'message': 'Analysis started successfully'
        })
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in /analyze: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/result/<analysis_id>', methods=['GET'])
def get_result(analysis_id):
    """Get the final result of an analysis by ID."""
    if analysis_id not in analysis_sessions:
        return jsonify({
            'success': False,
            'errors': ['Analysis ID not found']
        }), 404
    
    session = analysis_sessions[analysis_id]
    
    # If analysis is still processing, return an appropriate response
    if session['status'] == 'processing' or session['status'] == 'uploading':
        return jsonify({
            'success': False,
            'errors': ['Analysis is not yet complete']
        }), 202  # 202 Accepted means the request is being processed
    
    if not session['result']:
        return jsonify({
            'success': False,
            'errors': ['No result available']
        }), 500
    
    # Get the report from result
    report = session['result'].get('report')
    
    return jsonify({
        'success': True,
        'company': session['company_name'],
        'report': report,
        'errors': session['errors']
    })


@app.route('/api/workflow/nodes', methods=['GET'])
def get_workflow_nodes():
    """Get all available workflow nodes and their configurations."""
    try:
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Get all nodes
        nodes = prompt_manager.get_all_nodes()
        
        # Convert to list of node objects
        node_list = []
        for node_id, node_config in nodes.items():
            node_list.append({
                'id': node_id,
                'name': node_config.get('name', node_id),
                'type': node_config.get('type', 'unknown'),
                'description': node_config.get('description', ''),
                'prompt_template': node_config.get('prompt_template', ''),
                'enabled': node_config.get('enabled', True)  # Use the actual enabled status from config
            })
        
        return jsonify(node_list)
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in /workflow/nodes: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/nodes/<node_id>', methods=['PUT'])
def update_node(node_id):
    """Update a workflow node configuration."""
    try:
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'errors': ['No data provided']
            }), 400
        
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Check if node exists
        try:
            node_info = prompt_manager.get_node_info(node_id)
        except KeyError:
            return jsonify({
                'success': False,
                'errors': [f'Node {node_id} not found']
            }), 404
        
        # Update prompt template if provided
        if 'prompt_template' in data:
            # Check if we should save a version
            if data.get('save_version', False):
                version_name = data.get('version_name', None)
                prompt_manager.save_prompt_version(node_id, data['prompt_template'], version_name)
            else:
                prompt_manager.update_prompt(node_id, data['prompt_template'], persist=True)
        
        # Update enabled status if provided
        if 'enabled' in data:
            prompt_manager.set_node_enabled(node_id, data['enabled'])
        
        # Get updated node info
        updated_node = prompt_manager.get_node_info(node_id)
        
        # Construct response
        response = {
            'id': node_id,
            'name': updated_node.get('name', node_id),
            'type': updated_node.get('type', 'unknown'),
            'description': updated_node.get('description', ''),
            'prompt_template': updated_node.get('prompt_template', ''),
            'enabled': updated_node.get('enabled', True)
        }
        
        return jsonify({
            'success': True,
            'node': response
        })
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in /workflow/nodes/{node_id}: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/node_outputs/<analysis_id>', methods=['GET'])
def get_node_outputs(analysis_id):
    """Get node outputs for an analysis."""
    if analysis_id not in analysis_sessions:
        return jsonify({
            'success': False,
            'errors': ['Analysis ID not found']
        }), 404
    
    session = analysis_sessions[analysis_id]
    result = session.get('result', {})
    
    # Extract node outputs from the result object
    node_output_keys = [
        'company_overview', 
        'industry_overview', 
        'promoters_directors', 
        'credit_rating', 
        'financials', 
        'compliance_checks', 
        'news_checks'
    ]
    
    outputs = {}
    for key in node_output_keys:
        if key in result:
            outputs[key] = result[key]
    
    return jsonify(outputs)


# New endpoints for prompt version management

@app.route('/api/workflow/nodes/<node_id>/versions', methods=['GET'])
def get_node_versions(node_id):
    """Get version history for a node."""
    try:
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Get version history
        versions = prompt_manager.get_version_history(node_id)
        
        return jsonify({
            'success': True,
            'node_id': node_id,
            'versions': versions
        })
        
    except KeyError:
        return jsonify({
            'success': False,
            'errors': [f'Node {node_id} not found']
        }), 404
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in /workflow/nodes/{node_id}/versions: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/nodes/<node_id>/versions', methods=['POST'])
def save_node_version(node_id):
    """Save a new version of a node prompt."""
    try:
        data = request.json
        if not data or 'prompt_template' not in data:
            return jsonify({
                'success': False,
                'errors': ['Prompt template is required']
            }), 400
        
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Save new version
        version_name = data.get('version_name')
        version_data = prompt_manager.save_prompt_version(
            node_id, 
            data['prompt_template'], 
            version_name
        )
        
        return jsonify({
            'success': True,
            'version': version_data
        })
        
    except KeyError:
        return jsonify({
            'success': False,
            'errors': [f'Node {node_id} not found']
        }), 404
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in saving version for {node_id}: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/nodes/<node_id>/versions/<version_id>', methods=['GET'])
def get_node_version(node_id, version_id):
    """Get a specific version of a node prompt."""
    try:
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Get version
        version_data = prompt_manager.get_version(node_id, version_id)
        
        return jsonify({
            'success': True,
            'version': version_data
        })
        
    except KeyError as e:
        return jsonify({
            'success': False,
            'errors': [str(e)]
        }), 404
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in getting version {version_id} for {node_id}: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/nodes/<node_id>/versions/<version_id>/activate', methods=['PUT'])
def activate_node_version(node_id, version_id):
    """Set a specific version as the active prompt for a node."""
    try:
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Activate version
        version_data = prompt_manager.set_active_version(node_id, version_id)
        
        return jsonify({
            'success': True,
            'version': version_data,
            'message': f'Version {version_id} set as active for node {node_id}'
        })
        
    except KeyError as e:
        return jsonify({
            'success': False,
            'errors': [str(e)]
        }), 404
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in activating version {version_id} for {node_id}: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


@app.route('/api/workflow/nodes/<node_id>/toggle', methods=['PUT'])
def toggle_node(node_id):
    """Enable or disable a node."""
    try:
        data = request.json
        if not data or 'enabled' not in data:
            return jsonify({
                'success': False,
                'errors': ['Enabled status is required']
            }), 400
        
        # Initialize PromptManager
        prompt_manager = PromptManager()
        
        # Toggle node
        node_data = prompt_manager.set_node_enabled(node_id, data['enabled'])
        
        # Construct response
        response = {
            'id': node_id,
            'name': node_data.get('name', node_id),
            'type': node_data.get('type', 'unknown'),
            'description': node_data.get('description', ''),
            'prompt_template': node_data.get('prompt_template', ''),
            'enabled': node_data.get('enabled', True)
        }
        
        return jsonify({
            'success': True,
            'node': response,
            'message': f'Node {node_id} {"enabled" if data["enabled"] else "disabled"}'
        })
        
    except KeyError:
        return jsonify({
            'success': False,
            'errors': [f'Node {node_id} not found']
        }), 404
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API error in toggling node {node_id}: {error_msg}")
        return jsonify({
            'success': False,
            'errors': [error_msg]
        }), 500


if __name__ == "__main__":
    # Run the Flask app in development mode
    logger.info("Starting CMML Market Scan API Server")
    app.run(host='0.0.0.0', port=8000, debug=True)
