#!/usr/bin/env bash

set -euo pipefail

# 1. Ensure we’re at the root of the parent repository
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd "$SCRIPT_DIR"

# 2. Check that the submodule directory exists
SUBMOD="cosmi-blogs"
if [[ ! -d "$SUBMOD" ]]; then
  echo "Error: Submodule directory '$SUBMOD' not found." >&2
  exit 1
fi

ARGS=("$@")
COMMIT_MSG="${ARGS[0]}"
# 3. Commit & push inside the submodule
cd "$SUBMOD"
echo "==> Committing in submodule '$SUBMOD'..."
git add .
git diff-index --quiet HEAD || git commit -m $COMMIT_MSG
echo "==> Pushing submodule to its origin..."
git push
# 4. Go back to the parent repo and update the submodule pointer
cd ..
echo "==> Staging updated submodule pointer in parent repo..."
git add "$SUBMOD"
git diff-index --quiet HEAD || git commit -m $COMMIT_MSG
echo "==> Pushing parent repo to its origin..."
git push
#5 Update the main repo
git subtree push --prefix="cosmi-blogs" https://github.com/taicdev/cosmi-blogs.git main

echo "✓ Done!"
