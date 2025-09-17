#!/bin/bash

# 🎯 OCMUI Team Dashboard - Quick Setup Script
# This script handles the installation and first run of the dashboard

set -e  # Exit on any error

echo "🚀 Setting up OCMUI Team Dashboard..."
echo ""

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is required but not installed."
    echo "Please install yarn first: https://yarnpkg.com/getting-started/install"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the ocmui-team-dashboard directory"
    echo "Make sure you're in the root of the project (where package.json exists)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Kill any existing process on port 3017
echo "🧹 Cleaning up any existing processes..."
lsof -ti:3017 | xargs kill -9 2>/dev/null || true

# Build the project
echo "🔨 Building the dashboard..."
yarn build

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Starting the dashboard..."
echo "📂 Opening http://localhost:3017 in your browser..."
echo ""
echo "💡 Don't forget to:"
echo "   1. Click the ⚙️ Settings button (red alert icon)"
echo "   2. Add your GitHub and JIRA tokens"
echo "   3. Click Test to verify each token"
echo "   4. Click Save"
echo ""
echo "🛑 To stop the dashboard, press Ctrl+C"
echo ""

# Start the server and open browser
yarn start
