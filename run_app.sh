#!/bin/bash
# Script to run both Flask backend and React frontend

# Function to handle script termination
cleanup() {
  echo "Shutting down servers..."
  # Kill all background processes in this script's process group
  kill $(jobs -p) 2>/dev/null
  exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check for dependencies
echo "Checking dependencies..."

# Check for Python dependencies
if ! command -v pip3 &> /dev/null; then
  echo "Error: pip is not installed. Please install Python and pip."
  exit 1
fi

# Check for Node.js dependencies
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed. Please install Node.js and npm."
  exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd web-react
npm install
cd ..

# Start Flask server
echo "Starting Flask backend server on port 8000..."
python3 -m src.server &
FLASK_PID=$!

# Wait for Flask to start
echo "Waiting for Flask server to start..."
sleep 3

# Start React frontend
echo "Starting React frontend on port 3000..."
cd web-react
npm run dev &
REACT_PID=$!

echo ""
echo "=============================================="
echo "CMML Research Platform is running!"
echo "=============================================="
echo "- Flask API: http://localhost:8000"
echo "- React UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers."
echo "=============================================="

# Wait for both processes to finish
wait $FLASK_PID $REACT_PID
