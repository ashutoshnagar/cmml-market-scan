#!/bin/bash

# Simple script to test Node.js backend logging by making a direct API request

echo "===== CMML Market Scan - Testing Node.js Backend Logging ====="
echo ""

# Define server URL
SERVER_URL="http://localhost:3001/api"

echo "Making request to the Node.js backend at: $SERVER_URL/workflow/nodes"
echo "This should trigger logging in the Node.js backend terminal"
echo ""
echo "Response from API:"
curl -s $SERVER_URL/workflow/nodes | head -n 20

echo ""
echo "===== IMPORTANT ====="
echo "Check the Node.js backend terminal window for logging output"
echo "You should see log messages with timestamps like:"
echo "[2025-08-17T13:29:19.123Z] [INFO] API: /workflow/nodes - Request received"
echo "[2025-08-17T13:29:19.124Z] [INFO] Loading workflow nodes from configuration"
echo "..."
