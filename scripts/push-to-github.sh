#!/bin/bash
# ============================================================
# Our Empire — GitHub Push Script
# Run this from the project root directory
# ============================================================
set -e

REPO_URL="https://github.com/Buntyarora97/our-empoiore.git"

echo "🚀 Our Empire — GitHub Push"
echo "================================"
echo "Repository: $REPO_URL"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
  echo "❌ git not found. Please install git first."
  exit 1
fi

# Configure git user (change these if needed)
git config user.name "Buntyarora97"
git config user.email "buntyarora97@users.noreply.github.com"

# Add GitHub remote (replace existing if any)
git remote remove github 2>/dev/null || true
git remote add github "$REPO_URL"

echo "📦 Staging all files..."
git add -A

echo "💾 Creating commit..."
git commit -m "feat: complete Our Empire Satta Matka platform

- Admin Panel (React + Vite + Tailwind + shadcn/ui)
  - Login, Dashboard, Users, Markets, Results
  - Deposits, Withdrawals, Bets, Analytics
  - Settings, Notifications pages
  - Production build in artifacts/admin-panel/dist/public/

- API Server (Node.js + Express 5 + Drizzle ORM)
  - Full REST API with JWT auth
  - PostgreSQL schema (users, markets, bets, transactions, etc.)
  - Ready for Render.com deployment

- Player App (Expo React Native)
  - Login/Register, Markets, Bet Placement
  - Wallet (Deposit/Withdraw), Profile
  - Dark theme with green brand palette

- Deployment configs:
  - render.yaml for API server on Render
  - Admin dist for Hostinger upload
  - Neon DB migration script
  - Full DEPLOYMENT.md guide" || echo "Nothing new to commit"

echo ""
echo "📤 Pushing to GitHub..."
echo "You will be asked for your GitHub username and Personal Access Token (PAT)"
echo ""
echo "To create a PAT: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token"
echo "Required permissions: repo (full control)"
echo ""

git push github main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "🔗 View at: https://github.com/Buntyarora97/our-empoiore"
