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
# node_modules folder at the chosen path.
default_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_root=""
while :; do
  echo
  echo "This script needs to know where your cloned 'free-cluie' repo lives."
  echo "A 'node_modules' folder must exist at that location."
  echo
  read -r -p "Project root [${default_root}]: " project_root
  project_root="${project_root:-$default_root}"
  if [[ "${project_root:0:1}" == '"' && "${project_root: -1}" == '"' ]]; then
    project_root="${project_root:1:-1}"
  fi
  project_root="${project_root%/}"
  if [[ ! -d "$project_root/node_modules" ]]; then
    echo
    echo "[X] No 'node_modules' folder found at: $project_root"
    echo "    Please provide the full path to your cloned 'free-cluie' folder,"
    echo "    or run '02-create-env-and-install.sh' first."
    project_root=""
    continue
  fi
  break
done
echo "[+] Using project root: $project_root"
echo

echo "Starting development server..."
echo
cd "$project_root"
exec npm run app:dev
