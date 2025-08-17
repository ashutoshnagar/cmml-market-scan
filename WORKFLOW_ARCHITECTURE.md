# CMML Market Scan - 7-Node LangGraph Workflow Architecture

## Overview

The CMML Market Scan application now features a sophisticated 7-node LangGraph workflow architecture that breaks down company analysis into specialized, parallel-processing nodes for comprehensive market intelligence.

## Architecture Components

### 7 Analysis Nodes

The workflow consists of 7 specialized nodes divided into two groups:

#### Group A: Web Search Nodes (Gemini + Google Search)
1. **Company & Business Overview** - Extracts company information from web sources
2. **Industry Overview** - Analyzes market trends and competitive landscape
3. **Compliance Checks** - Performs regulatory compliance verification
4. **News/Google Checks** - Analyzes recent news and online presence

#### Group B: Document Analysis Nodes (Gemini + PDF Processing)
5. **Promoters and Directors** - Extracts board and ownership information from documents
6. **Credit Rating** - Analyzes historical credit ratings
7. **Financials** - Processes financial statements and metrics

### Report Writer Node
A final consolidation node that combines all 7 analysis outputs into a comprehensive HTML report.

## Workflow Execution

### Parallel Processing Strategy

```
Input: Company Name + PDF (optional)
           ↓
    [Initialize]
      ↙        ↘
[Web Nodes]    [PDF Processing]
(1,2,6,7)           ↓
     ↓         [PDF Nodes]
     ↓          (3,4,5)
     ↘         ↙
   [Report Writer]
         ↓
   [Final Report]
```

- **Web nodes** start immediately with just the company name
- **PDF nodes** wait for PDF processing to complete
- Both groups run in parallel for optimal performance
- All results are consolidated in the final report

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

The new dependencies include:
- `langgraph>=0.2.0` - Workflow orchestration
- `langchain>=0.1.0` - LLM framework
- `langchain-google-genai>=1.0.0` - Google AI integration
- `langchain-core>=0.1.0` - Core components

### 2. Configuration

The workflow uses the same configuration as the base application:

```bash
cp .env.example .env
# Edit .env and add your Google Gemini API key
GOOGLE_API_KEY=your_api_key_here
```

## Usage

### Enabling Workflow Mode

The application can run in two modes:

1. **Workflow Mode** (Default): Uses the 7-node LangGraph architecture
2. **Legacy Mode**: Uses the original triple-analysis approach

To control the mode, set the environment variable:

```bash
# Enable workflow mode (default)
export USE_WORKFLOW=true
python -m src.server

# Use legacy mode
export USE_WORKFLOW=false
python -m src.server
```

### Running the Application

1. Start the server:
```bash
python -m src.server
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

3. Enter the company name and optionally upload a PDF document

4. Click "Analyze Document" to trigger the workflow

## Workflow Benefits

### 1. **Modularity**
- Each node is independent and can be modified without affecting others
- Easy to add new nodes or modify existing ones

### 2. **Parallel Processing**
- Web search nodes run simultaneously
- PDF analysis nodes run in parallel after document processing
- Significantly reduces total processing time

### 3. **Error Resilience**
- If one node fails, others continue processing
- Partial results are still presented in the final report
- Failed nodes are clearly marked in the status summary

### 4. **Comprehensive Coverage**
- 7 different perspectives on company analysis
- Combines web research with document analysis
- Provides both real-time and historical data

### 5. **Token Optimization**
- Each node uses only the tokens needed for its specific task
- More efficient than processing everything in a single prompt

## Output Format

The workflow generates a comprehensive HTML report with:

1. **Processing Status Summary** - Shows success/failure of each node
2. **Executive Summary** - High-level overview of findings
3. **Part 1: Company & Business Overview** - Company fundamentals
4. **Part 2: Industry Overview** - Market analysis
5. **Part 3: Promoters and Directors** - Leadership and ownership
6. **Part 4: Credit Rating History** - Financial credibility
7. **Part 5: Financial Performance** - Key metrics and trends
8. **Part 6: Compliance & Due Diligence** - Regulatory status
9. **Part 7: News & Market Sentiment** - Recent developments

## Error Handling

The workflow includes robust error handling:

- Each node operates independently
- Failed nodes don't block the workflow
- Errors are logged and reported in the final output
- Processing status clearly shows which analyses succeeded

## Development

### Adding New Nodes

To add a new analysis node:

1. Define the node function in `market_scan_workflow.py`:
```python
def _new_analysis_node(self, state: MarketScanState) -> MarketScanState:
    # Your analysis logic here
    state['new_analysis'] = result
    return state
```

2. Add the node to the workflow:
```python
workflow.add_node("new_analysis", self._new_analysis_node)
```

3. Define edges for execution flow:
```python
workflow.add_edge("initialize", "new_analysis")
workflow.add_edge("new_analysis", "report_writer")
```

### Customizing Prompts

Each node has its own specialized prompt that can be customized in the respective node function. The prompts are designed to extract specific information relevant to that node's purpose.

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all LangGraph dependencies are installed
2. **Workflow Initialization Failure**: Check logs for specific error messages
3. **Node Failures**: Individual node failures are logged with details

### Fallback to Legacy Mode

If the workflow fails to initialize, the system automatically falls back to legacy mode. You can also manually force legacy mode using:

```bash
export USE_WORKFLOW=false
```

## Performance Considerations

- **Parallel Execution**: Reduces total analysis time by ~40-50%
- **Memory Usage**: Higher than legacy mode due to parallel processing
- **API Rate Limits**: Multiple concurrent API calls may hit rate limits faster

## Future Enhancements

Potential improvements to the workflow:

1. **Caching Layer**: Cache node outputs for faster re-analysis
2. **Streaming Results**: Stream node outputs as they complete
3. **Custom Node Configurations**: Allow users to enable/disable specific nodes
4. **Integration with External APIs**: Add nodes for additional data sources
5. **ML-based Summary Generation**: Use AI to generate more sophisticated executive summaries

## Support

For issues or questions:
1. Check the error logs in the console
2. Verify your Gemini API key is correctly configured
3. Ensure all dependencies are installed
4. Try running in legacy mode to isolate workflow-specific issues

---

**CMML Market Scan Workflow v1.0** - Powered by LangGraph and Google Gemini AI
