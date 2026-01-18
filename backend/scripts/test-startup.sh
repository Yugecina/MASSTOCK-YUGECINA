#!/bin/bash

# Test backend startup with Vertex AI
echo "Testing backend startup with Vertex AI..."

# Start server in background
node -r ts-node/register src/server.ts > /tmp/masstock-startup.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"

    # Show relevant logs
    echo ""
    echo "📋 Startup logs:"
    cat /tmp/masstock-startup.log

    # Kill server
    kill $SERVER_PID 2>/dev/null
    echo ""
    echo "✅ Test completed"
else
    echo "❌ Server failed to start"
    cat /tmp/masstock-startup.log
    exit 1
fi
