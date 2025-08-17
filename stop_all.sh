#!/bin/bash

# Script to stop all running servers (Python backend, Node.js backend, and React frontend)

echo "===== CMML Market Scan - Stopping All Components ====="
echo ""

# Function to kill process running on a specific port
kill_process_on_port() {
  local port=$1
  local name=$2
  
  # Find PID of process running on the specified port
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    pid=$(lsof -i tcp:${port} -t)
  else
    # Linux
    pid=$(netstat -tulpn 2>/dev/null | grep ":${port}" | awk '{print $7}' | cut -d'/' -f1)
  fi
  
  if [ -n "$pid" ]; then
    echo "Stopping $name on port $port (PID: $pid)..."
    kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    echo "$name stopped."
  else
    echo "No $name found running on port $port."
  fi
}

# Stop Python backend (port 8000)
echo "Checking for Python backend on port 8000..."
kill_process_on_port 8000 "Python backend"

# Stop Node.js backend (port 3001)
echo "Checking for Node.js backend on port 3001..."
kill_process_on_port 3001 "Node.js backend"

# Stop React frontend (port 3000)
echo "Checking for React frontend on port 3000..."
kill_process_on_port 3000 "React frontend"

echo ""
echo "All servers have been stopped."
