#!/bin/bash
# ============================================================
# setup_vm.sh  —  Run ONCE on your Google Cloud VM via SSH
# ============================================================
# What it does:
#   1. Installs system deps (Python, pip, git, nginx)
#   2. Clones/updates the BirdID repo
#   3. Creates a Python virtualenv and installs requirements
#   4. Installs the Flask backend as a systemd service
#      so it auto-starts on reboot and restarts on crash
#   5. Optionally configures nginx as a reverse proxy
#
# Usage:
#   ssh YOUR_VM_IP "bash -s" < setup_vm.sh
#   OR copy it to the VM and run:  chmod +x setup_vm.sh && ./setup_vm.sh
# ============================================================

set -euo pipefail

# ── CONFIG — edit these ──────────────────────────────────────
REPO_URL="https://github.com/f75/BirdID.git"
APP_DIR="$HOME/BirdID"
VENV_DIR="$HOME/birdid_venv"
SERVER_PORT=5000
SERVICE_NAME="birdid"
# ────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   BirdID VM Setup — SpeciesNet Backend   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 1. System packages
echo "▶ Installing system packages…"
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip python3-venv git curl nginx

# 2. Clone or pull repo
if [ -d "$APP_DIR/.git" ]; then
    echo "▶ Repo already cloned — pulling latest…"
    cd "$APP_DIR"
    git pull
else
    echo "▶ Cloning BirdID repo…"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. Copy the backend server file into the repo (already there if you committed it)
echo "▶ Checking backend server file…"
if [ ! -f "$APP_DIR/backend/birdid_server.py" ]; then
    echo "   WARNING: backend/birdid_server.py not found in repo."
    echo "   Please commit birdid_server.py to your repo first."
fi

# 4. Python virtual environment
echo "▶ Creating Python virtualenv at $VENV_DIR…"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo "▶ Installing Python dependencies…"
pip install --upgrade pip -q
pip install flask flask-cors pillow speciesnet gunicorn -q

# Install repo requirements if they exist
if [ -f "$APP_DIR/backend/requirements.txt" ]; then
    pip install -r "$APP_DIR/backend/requirements.txt" -q
fi

deactivate

# 5. Create systemd service
echo "▶ Creating systemd service: $SERVICE_NAME…"
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=BirdID SpeciesNet API Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$VENV_DIR/bin
ExecStart=$VENV_DIR/bin/gunicorn \
    --bind 0.0.0.0:${SERVER_PORT} \
    --workers 1 \
    --timeout 120 \
    --log-level info \
    birdid_server:app
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# 6. Nginx reverse proxy (optional but recommended — serves on port 80)
echo "▶ Configuring nginx reverse proxy on port 80…"
sudo tee /etc/nginx/sites-available/birdid > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:${SERVER_PORT}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 120;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/birdid /etc/nginx/sites-enabled/birdid
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "✅  Setup complete!"
echo ""
echo "   Backend API:  http://$(curl -s ifconfig.me):${SERVER_PORT}/predict"
echo "   Via nginx:    http://$(curl -s ifconfig.me)/api/predict"
echo "   Health check: http://$(curl -s ifconfig.me):${SERVER_PORT}/health"
echo ""
echo "   View logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo "   Restart:      sudo systemctl restart ${SERVICE_NAME}"
echo ""
