# CMML Research Platform

A comprehensive market research platform for CMML (Corporate & Mid-Market Lending) with ChatGPT-style interface, workflow management, and a 7-node analysis pipeline.

## Features

- ChatGPT-style UI with Piramal Finance branding
- Workflow management with configurable analysis nodes
- PDF document analysis with market scan capabilities
- Graph-like visualization of the 7-node workflow
- Custom prompt editing and node management
- Real-time status tracking of analysis progress

## System Architecture

The platform consists of two main components:

1. **React Frontend**
   - Modern React application with TypeScript
   - Responsive ChatGPT-style interface
   - Workflow visualization and management
   - File upload and company analysis

2. **Flask Backend API**
   - RESTful API for workflow management
   - PDF document processing
   - Google search and Gemini AI integration
   - Asynchronous analysis with session tracking

## Getting Started

### Prerequisites

- Python 3.9+ with pip
- Node.js 16+ with npm
- Google API Key for Gemini AI (set in `.env`)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cmml-market-scan
   ```

2. Copy the example environment file and add your API keys:
   ```
   cp .env.example .env
   ```
   Edit `.env` to add your Google API key.

3. Run the application using the provided script:
   ```
   ./run_app.sh
   ```
   This script installs dependencies and starts both the Flask backend and React frontend.

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Usage

1. **Analyze a Company**
   - Enter a company name in the chat input
   - Attach a PDF document with company information
   - Click the send button to start analysis
   - View real-time progress of the 7-node workflow

2. **Manage Workflow**
   - Click the workflow icon in the header
   - View the graph visualization of analysis nodes
   - Click on any node to edit its configuration
   - Enable/disable specific nodes
   - Customize prompt templates

3. **View Analysis Results**
   - Results appear in the chat interface as HTML reports
   - Each node's output contributes to the final report
   - Full analysis results include company overview, industry analysis, financials, and more

## Workflow Nodes

The platform includes seven specialized analysis nodes:

1. **Company Overview** - Core business information and company profile
2. **Industry Overview** - Market trends and competitive landscape
3. **Promoters & Directors** - Leadership information and board details
4. **Credit Rating** - Historical credit ratings and outlook
5. **Financials** - Key financial metrics and performance
6. **Compliance Checks** - Regulatory compliance and due diligence
7. **News Analysis** - Recent news and market sentiment

## Development

### Project Structure

```
cmml-market-scan/
├── src/                   # Python backend
│   ├── server.py          # Flask API server
│   ├── market_scan_workflow.py  # LangGraph workflow
│   ├── prompt_manager.py  # Prompt template management
│   └── ...
├── web-react/             # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── styles/        # CSS styles
│   └── ...
├── uploads/               # PDF upload directory
├── outputs/               # Analysis results
└── run_app.sh             # Start script
```

### Customizing the Workflow

Workflow nodes and prompts can be customized in:
- `src/prompts_config.yaml` - Prompt templates for each node
- Through the workflow management UI

## License

[Your License Information]

## Acknowledgments

- Piramal Finance for branding inspiration
- LangGraph for workflow orchestration
- Google Gemini AI for analysis capabilities
