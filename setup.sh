#!/bin/bash

# Automated setup script for OCMUI Team Dashboard

echo "🚀 Starting OCMUI Team Dashboard setup..."

# Check for yarn
if ! command -v yarn &> /dev/null
then
    echo "❌ Yarn is not installed. Please install Yarn (https://classic.yarnpkg.com/en/docs/install) and try again."
    exit 1
fi

# Navigate to the ocmui-team-dashboard directory
# Assuming this script is run from the ocmui-devtools root
if [ ! -d "ocmui-team-dashboard" ]; then
    echo "❌ 'ocmui-team-dashboard' directory not found. Please ensure you are in the 'ocmui-devtools' root directory."
    exit 1
fi
cd ocmui-team-dashboard

echo "📦 Installing dependencies with Yarn..."
yarn install

if [ $? -ne 0 ]; then
    echo "❌ Yarn install failed. Please check your internet connection and try again."
    exit 1
fi

echo "🏗️ Building the project..."
yarn build

if [ $? -ne 0 ]; then
    echo "❌ Project build failed. Please check for compilation errors."
    exit 1
fi

echo "Starting the dashboard server..."
# Kill any process running on port 3017
lsof -ti:3017 | xargs kill -9 2>/dev/null || true
node server/index.js &

SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

echo "Waiting for server to start..."
sleep 3 # Give the server a few seconds to spin up

echo "Opening dashboard in your browser at http://localhost:3017"
open http://localhost:3017

echo "✅ Setup complete! The dashboard should now be open in your browser."
echo "Remember to configure your GitHub and JIRA API tokens in the dashboard's Settings."

# Keep the script running to keep the server alive
wait $SERVER_PID
