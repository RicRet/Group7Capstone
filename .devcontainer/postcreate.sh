# .devcontainer/postcreate.sh
#!/usr/bin/env bash
#!/usr/bin/env bash
# Ensure strict mode without breaking in shells that lack pipefail
set -euo pipefail 2>/dev/null || set -eu


echo " Post-create: installing workspace tooling"

# Ensure corepack/pnpm/yarn after Node feature is available
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
fi

# Yarn (optional global)
if command -v npm >/dev/null 2>&1; then
  npm i -g yarn@latest || true
fi

# Optional: fast Python installer (uv)
if command -v curl >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh || true
fi

# Copy example envs if present
cd /workspaces/eagleguide
[ -f .env.example ] && cp -n .env.example .env || true
[ -f app/.env.example ] && cp -n app/.env.example app/.env || true
[ -f api/.env.example ] && cp -n api/.env.example api/.env || true
[ -f ml/.env.example ] && cp -n ml/.env.example ml/.env || true

# Install deps (skip if folders missing)
[ -d api ] && (cd api && (command -v pnpm >/dev/null && pnpm install) || yarn install || npm install || true)
[ -d app ] && (cd app && (command -v pnpm >/dev/null && pnpm install) || yarn install || npm install || true)
[ -d ml ]  && (cd ml  && python -m venv .venv && source .venv/bin/activate && pip install --upgrade pip && [ -f requirements.txt ] && pip install -r requirements.txt || true)

echo " Post-create done"
