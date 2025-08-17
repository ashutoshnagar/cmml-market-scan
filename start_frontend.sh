#!/bin/bash
# Start only the React frontend (assumes Flask backend is already running)

# Function to handle script termination
cleanup() {
  echo "Shutting down frontend..."
  # Kill all background processes in this script's process group
  kill $(jobs -p) 2>/dev/null
  exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check for Node.js dependencies
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed. Please install Node.js and npm."
  exit 1
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd web-react
npm install

# Start React frontend
echo "Starting React frontend on port 3000..."
npm run dev

echo ""
echo "=============================================="
echo "React frontend is running!"
echo "=============================================="
echo "- Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the frontend."
echo "=============================================="
