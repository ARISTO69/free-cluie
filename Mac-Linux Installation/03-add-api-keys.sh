#!/usr/bin/env bash
set -euo pipefail

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
  if [[ "${project_root:0:1}" == '"' && "${project_root: -1}" == '"' ]]; then
    project_root="${project_root:1:-1}"
  fi
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
touch "$env_file"
chmod 600 "$env_file" 2>/dev/null || true

echo "============================================"
echo "            API Key Setup (5 Keys)"
echo "============================================"
echo
echo "You will be asked to enter the following API keys:"
echo "  [1] MISTRAL_API_KEY"
echo "  [2] OPENROUTER_API_KEY"
echo "  [3] GEMINI_API_KEY"
echo "  [4] OPENAI_API_KEY"
echo "  [5] NVIDIA_NIM_API_KEY"
echo
echo "Press ENTER to skip any key you don't have."
echo "============================================"
echo

read -r -p "MISTRAL_API_KEY= " MISTRAL_KEY
echo
read -r -p "OPENROUTER_API_KEY= " OPENROUTER_KEY
echo
read -r -p "GEMINI_API_KEY= " GEMINI_KEY
echo
read -r -p "OPENAI_API_KEY= " OPENAI_KEY
echo
read -r -p "NVIDIA_NIM_API_KEY= " NVIDIA_NIM_KEY
echo

echo "Writing to .env file..."
# Use a quoted heredoc so user-supplied values containing $, `, or \
# are written literally and never evaluated by the shell.
cat > "$env_file" <<'EOF'
MISTRAL_API_KEY=""
OPENROUTER_API_KEY=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
NVIDIA_NIM_API_KEY=""
EOF

# Safely write the captured values using printf with %s to avoid
# any shell interpretation of special characters in the input.
{
  printf 'MISTRAL_API_KEY=%s\n'      "$MISTRAL_KEY"
  printf 'OPENROUTER_API_KEY=%s\n'   "$OPENROUTER_KEY"
  printf 'GEMINI_API_KEY=%s\n'       "$GEMINI_KEY"
  printf 'OPENAI_API_KEY=%s\n'       "$OPENAI_KEY"
  printf 'NVIDIA_NIM_API_KEY=%s\n'   "$NVIDIA_NIM_KEY"
} >> "$env_file"
chmod 600 "$env_file" 2>/dev/null || true

echo
echo "============================================"
echo " [+] .env file created successfully!"
echo "============================================"
echo
