#!/bin/bash

# Simple script to test Node.js backend logging
# This will run the server directly in the current terminal

echo "===== CMML Market Scan - Testing Node.js Backend Logging ====="
echo ""

# Change to the Node.js backend directory
cd nodejs-backend

# Run the backend in the foreground 
echo "Starting Node.js backend directly in this terminal..."
echo "This will let us see the logs directly"
echo "Press Ctrl+C to stop when finished testing"
echo ""

# Start the server
echo "Running: npm run dev"
npm run dev

# Note: The script will not reach here until the server is stopped with Ctrl+C
echo ""
echo "Node.js backend stopped."
