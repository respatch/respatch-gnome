#!/bin/bash

# Zastavenie skriptu pri akejkoľvek chybe
# set -e  # Zakomentované, aby sme pokračovali aj keď služba už neexistuje

SERVICE_NAME="respatch-daemon.service"
SYSTEMD_DIR="$HOME/.config/systemd/user"
TARGET_SERVICE="$SYSTEMD_DIR/$SERVICE_NAME"
DESKTOP_FILE="$HOME/.local/share/applications/sk.tito10047.respatch.Daemon.desktop"

echo "🛑 Stopping and disabling daemon service..."

# Ignorujeme chyby, ak služba neexistuje
systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
systemctl --user disable "$SERVICE_NAME" 2>/dev/null || true

echo "🗑️ Removing daemon service file..."
if [ -f "$TARGET_SERVICE" ]; then
    rm "$TARGET_SERVICE"
    echo "✅ Service file removed."
else
    echo "ℹ️ Service file not found, skipping."
fi

systemctl --user daemon-reload

echo "🗑️ Removing desktop file..."
if [ -f "$DESKTOP_FILE" ]; then
    rm "$DESKTOP_FILE"
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    echo "✅ Desktop file removed."
else
    echo "ℹ️ Desktop file not found, skipping."
fi

echo "✅ Daemon uninstalled successfully."
