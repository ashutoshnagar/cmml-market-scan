#!/bin/bash

# Start script for running all components of the application
# This script starts the Python backend, Node.js backend, and React frontend

echo "===== CMML Market Scan - Starting All Components ====="
echo ""

# Start Python backend in a new terminal
echo "Starting Python backend on http://localhost:8000..."
osascript -e 'tell app "Terminal" to do script "cd '$PWD' && ./run_app.sh"' || gnome-terminal -- bash -c "cd '$PWD' && ./run_app.sh" || xterm -e "cd '$PWD' && ./run_app.sh" || konsole -e "cd '$PWD' && ./run_app.sh" || echo "Could not open a new terminal. Please start the Python backend manually with ./run_app.sh"

# Start Node.js backend in a new terminal
echo "Starting Node.js backend on http://localhost:3001..."
osascript -e 'tell app "Terminal" to do script "cd '$PWD'/nodejs-backend && ./start_local.sh"' || gnome-terminal -- bash -c "cd '$PWD'/nodejs-backend && ./start_local.sh" || xterm -e "cd '$PWD'/nodejs-backend && ./start_local.sh" || konsole -e "cd '$PWD'/nodejs-backend && ./start_local.sh" || echo "Could not open a new terminal. Please start the Node.js backend manually with cd nodejs-backend && ./start_local.sh"

# Start React frontend
echo "Starting React frontend on http://localhost:3000..."
cd web-react && npm run dev

echo "All components stopped."
