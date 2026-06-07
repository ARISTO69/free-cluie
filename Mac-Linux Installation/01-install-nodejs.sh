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

echo "Installing Node.js..."
echo

if [[ ! -s "$NVM_SCRIPT" ]]; then
  export NVM_DIR
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  echo
fi

export NVM_DIR
. "$NVM_SCRIPT"
nvm install 24.0.0
nvm alias default 24.0.0

echo
echo "Done! Restart your terminal if node or npm are not available yet."
