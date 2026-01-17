#!/bin/bash

# Copywriting Master - Quick Setup Script
# This script helps set up the development environment

echo "╔═══════════════════════════════════════════════╗"
echo "║   Copywriting Master - Setup Script          ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    exit 1
fi
echo "✓ Node.js $NODE_VERSION detected"

# Check npm
echo "Checking npm..."
NPM_VERSION=$(npm -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✓ npm $NPM_VERSION detected"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"

# Check for .env file
echo ""
if [ -f .env ]; then
    echo "✓ .env file exists"
else
    echo "⚠ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠ IMPORTANT: Edit .env and add your API keys before running the server!"
    echo "   - PINECONE_API_KEY"
    echo "   - COHERE_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
fi

# Offer to generate JWT secret
echo ""
read -p "Generate a JWT_SECRET? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "Your JWT_SECRET: $JWT_SECRET"
    echo ""
    echo "Copy this to your .env file"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   Setup Complete!                             ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Set up Pinecone index (1024 dimensions, cosine metric)"
echo "3. Set up PostgreSQL database"
echo "4. Run: npm run migrate"
echo "5. Run: npm run dev"
echo ""
echo "See GETTING_STARTED.md for detailed instructions"
echo ""
