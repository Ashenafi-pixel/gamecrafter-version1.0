#!/bin/bash
# Start both the log server and the development server

# Start the log server
echo "Starting log server on http://localhost:3501..."
node log-server.cjs &
LOG_SERVER_PID=$!

# Wait a moment to ensure log server is ready
sleep 2

# Start the development server (Vite)
echo "Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Print instructions
echo ""
echo "===== SlotAI with MEGA-LOGGER (DEV MODE) ====="
echo "Development app: http://localhost:5173"
echo "Log viewer:      http://localhost:3501/get-logs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=============================================="

# Handle Ctrl+C to cleanly shut down both servers
function cleanup {
  echo ""
  echo "Stopping servers..."
  kill $LOG_SERVER_PID
  kill $DEV_SERVER_PID
  echo "Done!"
  exit 0
}

trap cleanup INT

# Wait for both processes
wait