#!/usr/bin/env bash
set -euo pipefail

os_name="$(uname -s)"
if [[ "$os_name" != "Darwin" && "$os_name" != "Linux" ]]; then
  echo "This installer is intended for macOS or Linux."
  exit 1
fi

# Preflight checks
for cmd in curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed. Please install it first."
    exit 1
  fi
done

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
NVM_SCRIPT="$NVM_DIR/nvm.sh"

echo "============================================"
echo "       Node.js 24 Installer"
echo "============================================"
echo

if [[ ! -s "$NVM_SCRIPT" ]]; then
  echo "[1/2] Installing nvm..."
  echo
  export NVM_DIR
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  echo
fi

echo "[2/2] Installing Node.js 24..."
echo
export NVM_DIR
. "$NVM_SCRIPT"
nvm install 24.0.0
nvm alias default 24.0.0
nvm use 24.0.0
echo
echo "============================================"
echo " [+] Node.js 24 installed successfully!"
echo " Restart your terminal if node or npm are"
echo " not yet available in this shell."
echo "============================================"
echo
