#!/bin/bash
# ============================================================
# deploy.sh  —  Run from YOUR LOCAL MACHINE
# ============================================================
# What it does:
#   1. Commits and pushes any local changes to GitHub
#   2. SSHs into your GCP VM
#   3. Pulls the latest code on the VM
#   4. Restarts the backend service
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh "your commit message"
#   ./deploy.sh   (uses a default commit message)
# ============================================================

set -euo pipefail

# ── CONFIG — edit these ──────────────────────────────────────
VM_IP="YOUR_VM_EXTERNAL_IP"          # e.g. 34.123.45.67
VM_USER="YOUR_VM_USERNAME"           # usually your Google account username
SSH_KEY="~/.ssh/google_compute_engine"  # GCP default key path
SERVICE_NAME="birdid"
APP_DIR="\$HOME/BirdID"
VENV_DIR="\$HOME/birdid_venv"
# ────────────────────────────────────────────────────────────

COMMIT_MSG="${1:-Auto-deploy $(date '+%Y-%m-%d %H:%M')}"

echo ""
echo "╔═══════════════════════════════╗"
echo "║   BirdID Deploy Script        ║"
echo "╚═══════════════════════════════╝"
echo ""

# ── Step 1: Push to GitHub ───────────────────────────────────
echo "▶ Pushing to GitHub…"
git add -A
git diff --cached --quiet && echo "   No local changes to commit." || git commit -m "$COMMIT_MSG"
git push
echo "   ✓ GitHub up to date"

# ── Step 2: Deploy to VM ─────────────────────────────────────
echo ""
echo "▶ Connecting to VM ($VM_USER@$VM_IP)…"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" bash <<REMOTE
set -e
echo "  → Pulling latest code…"
cd $APP_DIR
git pull

echo "  → Installing any new Python dependencies…"
source $VENV_DIR/bin/activate
if [ -f backend/requirements.txt ]; then
    pip install -r backend/requirements.txt -q
fi
pip install flask flask-cors pillow speciesnet gunicorn -q
deactivate

echo "  → Restarting $SERVICE_NAME service…"
sudo systemctl restart $SERVICE_NAME

echo "  → Service status:"
sudo systemctl is-active $SERVICE_NAME && echo "     Running ✓" || echo "     FAILED ✗"
REMOTE

echo ""
echo "✅  Deployed successfully!"
echo "   API: http://${VM_IP}:5000/health"
echo ""
