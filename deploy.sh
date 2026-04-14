#!/bin/bash
# ================================================================
# deploy.sh — Deploy latest code to cilyouth.org
# Run this from your local machine: ./deploy.sh
# ================================================================

set -euo pipefail

echo "==> Pushing latest code to GitHub..."
git push origin main

echo "==> Pulling on server..."
ssh cil-server "cd /opt/cil-platform && git pull origin main"

echo "==> Rebuilding and restarting containers..."
ssh cil-server "cd /opt/cil-platform && docker compose -f docker-compose.prod.yml up -d --build"

echo ""
echo "✓ Deployed successfully! https://cilyouth.org is live."
