#!/bin/bash

# Installation script for AI-Enriched Photo Gallery
# Installs all required dependencies for full functionality

set -e

echo "🚀 Installing AI-Enriched Photo Gallery Dependencies..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "📦 Installing core dependencies..."
pnpm install

echo ""
echo "📦 Installing missing production dependencies..."

# Virtual scrolling for performance
pnpm add @tanstack/react-virtual

# PDF export for stories
pnpm add jspdf @types/jspdf

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure environment variables (cp .env.example .env.local)"
echo "   2. Run database migrations in Supabase"
echo "   3. Start development server (pnpm dev)"
echo ""
echo "📚 See docs/INSTALLATION_GUIDE.md for detailed setup instructions"