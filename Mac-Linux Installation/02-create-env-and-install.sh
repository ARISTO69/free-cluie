#!/usr/bin/env bash
set -euo pipefail

# Preflight checks
for cmd in npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed. Please run '01-install-nodejs.sh' first."
    exit 1
  fi
done

# Locate the project root. Default guess: parent of this install folder
# (works if the user extracted the RAR into the repo). We require a
# package.json at the chosen path.
default_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_root=""
while :; do
  echo
  echo "This script needs to know where your cloned 'free-cluie' repo lives."
  echo "A package.json file must exist at that location."
  echo
  read -r -p "Project root [${default_root}]: " project_root
  project_root="${project_root:-$default_root}"
  # Strip a single pair of surrounding quotes
  if [[ "${project_root:0:1}" == '"' && "${project_root: -1}" == '"' ]]; then
    project_root="${project_root:1:-1}"
  fi
  # Strip a trailing slash
  project_root="${project_root%/}"
  if [[ ! -f "$project_root/package.json" ]]; then
    echo
    echo "[X] No package.json found at: $project_root"
    echo "    Please provide the full path to your cloned 'free-cluie' folder."
    project_root=""
    continue
  fi
  break
done
echo "[+] Using project root: $project_root"
echo

env_file="$project_root/.env"

echo "============================================"
echo "                 Installer"
echo "============================================"
echo

SKIP_ENV=0
echo "Creating .env file..."
if [[ -e "$env_file" ]]; then
  echo "[!] An existing .env file was found at: $env_file"
  read -r -p "    Overwrite it? Any existing API keys will be lost. [y/N] " overwrite_choice
  echo
  case "$overwrite_choice" in
    [yY]|[yY][eE][sS])
      echo "[*] Overwriting existing .env file..."
      ;;
    *)
      echo "[*] Keeping existing .env file. Skipping .env creation."
      SKIP_ENV=1
      ;;
  esac
fi

if [[ "$SKIP_ENV" != "1" ]]; then
  cat > "$env_file" <<'EOF'
MISTRAL_API_KEY=""
OPENROUTER_API_KEY=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
NVIDIA_NIM_API_KEY=""
EOF
  chmod 600 "$env_file" 2>/dev/null || true
  echo "[+] .env file created!"
fi
echo

echo "Running npm install..."
echo
cd "$project_root"
npm install
echo
echo "[+] Done!"
