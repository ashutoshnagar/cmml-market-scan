#!/bin/bash

# Start script for running the Node.js backend locally
# This script installs dependencies and starts the server

echo "===== CMML Market Scan - Node.js Backend Local Development ====="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm before running this script."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env file to add your API keys."
fi

# Start the server
echo "Starting Node.js backend on http://localhost:3001..."
npm run dev

# This line will execute when the server is stopped
echo "Server stopped."
