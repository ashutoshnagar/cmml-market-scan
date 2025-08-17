#!/bin/bash

# Test script for Node.js backend logging
# This script makes a series of API calls to test the logging implementation

echo "===== CMML Market Scan - Node.js Backend Logging Test ====="

# Define server URL
SERVER_URL="http://localhost:3001/api"

# Test 1: Get workflow nodes
echo -e "\n\n===== TEST 1: Get Workflow Nodes ====="
echo "Making request to: $SERVER_URL/workflow/nodes"
curl -s $SERVER_URL/workflow/nodes | jq .

# Test 2: Start an analysis
echo -e "\n\n===== TEST 2: Start Analysis ====="
echo "Making request to: $SERVER_URL/analyze"
# This is a mock request - in a real test, you'd include a file upload
COMPANY_NAME="Test Company"
ANALYSIS_ID=$(curl -s -X POST -H "Content-Type: multipart/form-data" -F "company_name=$COMPANY_NAME" $SERVER_URL/analyze | jq -r '.analysis_id')

echo "Analysis ID: $ANALYSIS_ID"

# Test 3: Get analysis result
echo -e "\n\n===== TEST 3: Get Analysis Result ====="
# Wait a bit for the analysis to complete
echo "Waiting for analysis to complete..."
sleep 1

echo "Making request to: $SERVER_URL/result/$ANALYSIS_ID"
curl -s $SERVER_URL/result/$ANALYSIS_ID | jq .

echo -e "\n\n===== Logging Test Complete ====="
echo "Check your terminal for the backend logs to see the logging output."
