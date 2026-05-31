#!/bin/bash
# ============================================================
# Our Empire — GitHub Push Script
# Run from the project root: bash scripts/push-to-github.sh
# ============================================================
set -e

GITHUB_USER="Buntyarora97"
REPO_NAME="our-empoiore"   # Your GitHub repo name
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "🚀 Our Empire — GitHub Push"
echo "================================"
echo "Repository: $REPO_URL"
echo ""

# Ask for PAT securely (hidden input)
echo "Enter your GitHub Personal Access Token (PAT):"
echo "(To create one: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → New token)"
echo "(Required permission: Contents → Read and write)"
echo ""
read -s -p "PAT: " GITHUB_PAT
echo ""

if [ -z "$GITHUB_PAT" ]; then
  echo "❌ No PAT entered. Exiting."
  exit 1
fi

# Build authenticated URL
AUTH_URL="https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Configure git user
git config user.name "$GITHUB_USER"
git config user.email "${GITHUB_USER}@users.noreply.github.com"

# Set up remotes
git remote remove origin 2>/dev/null || true
git remote remove github 2>/dev/null || true
git remote add origin "$AUTH_URL"

echo "📦 Staging all changes..."
git add -A

echo "💾 Committing..."
git commit -m "chore: sync Our Empire platform to GitHub" 2>/dev/null || echo "  (nothing new to commit, pushing existing commits)"

echo ""
echo "📤 Force-pushing to GitHub (this overwrites the remote with Replit's version)..."
git push origin main --force

echo ""
echo "✅ Done! Your code is live on GitHub."
echo "🔗 https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""

# Clean up PAT from URL — replace with token-free URL for future reads
git remote set-url origin "$REPO_URL"
echo "🔒 PAT removed from git config (replaced with public URL)."
