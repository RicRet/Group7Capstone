#!/usr/bin/env bash
# Ensure strict mode without breaking in shells that lack pipefail
set -euo pipefail 2>/dev/null || set -eu


echo "Post-start: bringing up local infra (db, redis) if docker-compose exists"

# If you store infra compose in /infra, bring it up
if [ -f "/workspaces/eagleguide/infra/docker-compose.yml" ]; then
  (cd /workspaces/eagleguide/infra && docker compose up -d)
fi

echo "ℹ If ports are busy, run: (cd infra && docker compose down) then up again."
echo "Post-start done"
