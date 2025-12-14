#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root so script can be invoked from anywhere.
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

patterns=(
  ".pytest_cache"
  ".ruff_cache"
  ".mypy_cache"
  "__pycache__"
)

cd "$root"

for pattern in "${patterns[@]}"; do
  while IFS= read -r dir; do
    rm -rf "$dir"
    echo "Removed $dir"
  done < <(find "$root" -type d -name "$pattern")
done

echo "cache cleanup complete"

uv cache clean
ruff clean