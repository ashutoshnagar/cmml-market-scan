#!/bin/bash

# API Test Script for CMML Market Scan Node.js Backend
# This script tests the API endpoints by making requests to the local server

# Configuration
API_BASE="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "===== CMML Market Scan - Node.js Backend API Test ====="
echo "Testing API endpoints at $API_BASE"
echo ""

# Test workflow/nodes endpoint
echo "Testing GET /workflow/nodes"
echo "--------------------------"
nodes_response=$(curl -s "$API_BASE/workflow/nodes")
if [[ $nodes_response == *"company_overview"* ]]; then
  echo -e "${GREEN}✓ Success: Got workflow nodes${NC}"
  echo "Sample nodes: $(echo $nodes_response | grep -o '"id":"[^"]*"' | head -3)"
else
  echo -e "${RED}✗ Error: Failed to get workflow nodes${NC}"
  echo "Response: $nodes_response"
fi
echo ""

# Test a node update
echo "Testing PUT /workflow/nodes/{id}"
echo "------------------------------"
update_response=$(curl -s -X PUT "$API_BASE/workflow/nodes/company_overview" \
  -H "Content-Type: application/json" \
  -d '{"prompt_template":"Updated prompt for {{company_name}}"}')
if [[ $update_response == *"success"*"true"* ]]; then
  echo -e "${GREEN}✓ Success: Updated node prompt${NC}"
else
  echo -e "${RED}✗ Error: Failed to update node${NC}"
  echo "Response: $update_response"
fi
echo ""

# Test analyze endpoint (mock test, no actual file upload)
echo "Testing POST /analyze (mock test)"
echo "------------------------------"
echo -e "${YELLOW}ℹ This is a mock test as file upload requires a form submission${NC}"
analyze_response=$(curl -s -X POST "$API_BASE/analyze" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Company"}')
if [[ $analyze_response == *"PDF file is required"* ]]; then
  echo -e "${GREEN}✓ Expected validation error: PDF file is required${NC}"
else
  echo -e "${YELLOW}ℹ Unexpected response from /analyze endpoint${NC}"
  echo "Response: $analyze_response"
fi
echo ""

# Test result endpoint with invalid ID
echo "Testing GET /result/{id}"
echo "------------------------"
result_response=$(curl -s "$API_BASE/result/invalid-id")
if [[ $result_response == *"Analysis ID not found"* ]]; then
  echo -e "${GREEN}✓ Expected validation error: Analysis ID not found${NC}"
else
  echo -e "${YELLOW}ℹ Unexpected response from /result endpoint${NC}"
  echo "Response: $result_response"
fi
echo ""

echo "API Test Complete"
echo "================="
