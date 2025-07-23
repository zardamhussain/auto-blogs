#!/usr/bin/env bash
# --------------------------------------------------------------------------------------
# Cosmi Auto-Blogs – Developer Convenience Launcher
# --------------------------------------------------------------------------------------
# This helper spins up *all* local services required for full-stack development in one
# command so you don't have to keep four terminals open:
#   1. FastAPI backend  (http://localhost:8000)
#   2. React workflow-builder frontend (Vite) (http://localhost:5173)
#   3. Next.js marketing / blog-consumer site (http://localhost:3000)
#   4. Sanity Studio  (http://localhost:3333)
#
# Prerequisites
#   • Python 3.10+, Node 18+ & npm, Docker + docker-compose
#   • `requirements.txt` installed or use the script to do a best-effort install.
#
# Usage
#   chmod +x setup_run.sh
#   ./setup_run.sh
#
# Hit Ctrl-C to stop everything cleanly.
# --------------------------------------------------------------------------------------

set -Eeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

color() { # Usage: color 32 "text" – prints in green, etc.
  printf "\e[%sm%s\e[0m" "$1" "$2"
}

# --------------------------------------------------------------------------------------
# Helper to bootstrap a Node workspace if node_modules is missing.
# --------------------------------------------------------------------------------------
bootstrap_node() {
  local DIR=$1
  if [ ! -d "$DIR/node_modules" ]; then
    color 34 "Installing npm dependencies for $DIR …\n"
    ( cd "$DIR" && npm install --silent )
  fi
}

# --------------------------------------------------------------------------------------
# BACKEND – FastAPI inside Docker Compose
# --------------------------------------------------------------------------------------
color 32 "[1/4] Building & starting backend (Docker Compose) …\n"

# Build and start the backend service in detached mode
docker compose up --build -d backend

# Capture container ID for shutdown
BACKEND_CONTAINER_ID=$(docker compose ps -q backend)

# --------------------------------------------------------------------------------------
# FRONTEND – React workflow builder (Vite)
# --------------------------------------------------------------------------------------
color 32 "[2/4] Starting React workflow builder (Vite) …\n"
bootstrap_node "$ROOT_DIR/frontend"
(
  cd "$ROOT_DIR/frontend"
  npm run dev  &
  echo $! > /tmp/auto_blogs_frontend.pid
) &
FRONTEND_PID=$!

# --------------------------------------------------------------------------------------
# BLOG-SITE – Public Next.js app
# --------------------------------------------------------------------------------------
color 32 "[3/4] Starting Next.js blog-site …\n"
bootstrap_node "$ROOT_DIR/blog-site"
(
  cd "$ROOT_DIR/blog-site"
  npm run dev -- -p 3000 &
  echo $! > /tmp/auto_blogs_blog.pid
) &
BLOG_PID=$!

# --------------------------------------------------------------------------------------
# SANITY STUDIO – Local dev server (no Docker)
# --------------------------------------------------------------------------------------
color 32 "[4/4] Starting Sanity Studio dev server …\n"

STUDIO_DIR="$ROOT_DIR/sanity/cogen"
bootstrap_node "$STUDIO_DIR"
(
  cd "$STUDIO_DIR"
  npm run dev &
  echo $! > /tmp/auto_blogs_studio.pid
) &
STUDIO_PID=$!

# --------------------------------------------------------------------------------------
# Graceful shutdown
# --------------------------------------------------------------------------------------
trap shutdown SIGINT SIGTERM
shutdown() {
  color 31 "\nStopping services …\n"
  # Stop host-spawned processes
  kill "$FRONTEND_PID" "$BLOG_PID" "$STUDIO_PID" 2>/dev/null || true

  # Tear down backend container
  if [ -n "$BACKEND_CONTAINER_ID" ]; then
    docker compose stop backend >/dev/null 2>&1 || true
  fi

  color 32 "All services stopped. Bye!\n"
  exit 0
}

wait 