#!/usr/bin/env bash
set -euo pipefail

echo "Post-create: installing workspace tooling"

# Node & Python versions are provided by features; ensure local caches
cd /workspaces/eagleguide

# Copy example envs if present
[ -f .env.example ] && cp -n .env.example .env || true
[ -f app/.env.example ] && cp -n app/.env.example app/.env || true
[ -f api/.env.example ] && cp -n api/.env.example api/.env || true
[ -f ml/.env.example ] && cp -n ml/.env.example ml/.env || true

# Install deps (skip if folders missing)
[ -d api ] && (cd api && corepack enable && pnpm install || yarn install || npm install)
[ -d app ] && (cd app && corepack enable && pnpm install || yarn install || npm install)
[ -d ml ]  && (cd ml  && python -m venv .venv && source .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt || true)

echo "Post-create done"
