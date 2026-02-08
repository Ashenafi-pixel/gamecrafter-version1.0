#\!/bin/bash
# Start the static server for SlotAI

# Check if node is installed
if \! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this server."
    exit 1
fi

# Make sure the file exists
if [ \! -f "static-server.cjs" ]; then
    echo "Error: static-server.cjs not found."
    exit 1
fi

# Run the server
echo "Starting SlotAI server..."
node static-server.cjs
