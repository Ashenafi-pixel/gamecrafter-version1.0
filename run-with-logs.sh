#!/bin/bash
# Start both the log server and the main application

# Start the log server
echo "Starting log server on http://localhost:3501..."
node log-server.cjs &
LOG_SERVER_PID=$!

# Wait a moment to ensure log server is ready
sleep 2

# Start the main server
echo "Starting main application on http://localhost:3500..."
node simple-server.cjs &
MAIN_SERVER_PID=$!

# Print instructions
echo ""
echo "===== SlotAI with MEGA-LOGGER ====="
echo "Main application: http://localhost:3500"
echo "Log viewer:       http://localhost:3501/get-logs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "===================================="

# Handle Ctrl+C to cleanly shut down both servers
function cleanup {
  echo ""
  echo "Stopping servers..."
  kill $LOG_SERVER_PID
  kill $MAIN_SERVER_PID
  echo "Done!"
  exit 0
}

trap cleanup INT

# Wait for both processes
wait