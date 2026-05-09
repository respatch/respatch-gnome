#!/bin/bash

# Zastavenie skriptu pri akejkoľvek chybe
set -e

# Presun do koreňového adresára projektu (podľa umiestnenia skriptu)
cd "$(dirname "$0")/.."

echo "⚙️  Building the daemon..."
if npm run build:daemon; then
    echo "✅ Build successful."
else
    echo "❌ Build failed!"
    exit 1
fi

SERVICE_NAME="respatch-daemon.service"
SYSTEMD_DIR="$HOME/.config/systemd/user"
TARGET_SERVICE="$SYSTEMD_DIR/$SERVICE_NAME"

echo "📦 Installing/Updating daemon service..."
mkdir -p "$SYSTEMD_DIR"

# Dynamicky nahradíme WorkingDirectory a Environment aktuálnou cestou projektu, 
# aby to fungovalo nech je projekt naklonovaný kdekoľvek
PROJECT_DIR="$(pwd)"
sed -e "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_DIR|" \
    -e "s|Environment=\"GSETTINGS_SCHEMA_DIR=.*|Environment=\"GSETTINGS_SCHEMA_DIR=$PROJECT_DIR/data\"|" \
    systemd/$SERVICE_NAME > "$TARGET_SERVICE"

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
echo "✅ Daemon installed/updated successfully."

DESKTOP_DIR="$HOME/.local/share/applications"
echo "🗂️ Installing desktop file for notifications..."
mkdir -p "$DESKTOP_DIR"
cp data/sk.tito10047.respatch.Daemon.desktop "$DESKTOP_DIR/"
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo "🔄 Restarting the daemon..."
systemctl --user daemon-reload
systemctl --user restart "$SERVICE_NAME"
echo "🚀 Daemon restarted successfully."
