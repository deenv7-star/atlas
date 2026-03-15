#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"

BACKUP_DIR="${BACKUP_DIR:-./ops/backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/atlas_${STAMP}.dump"

pg_dump --format=custom --file="$OUT" "$DATABASE_URL"
echo "Backup written to $OUT"
