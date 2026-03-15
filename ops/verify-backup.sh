#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_FILE:?BACKUP_FILE must be set to a .dump file}"

pg_restore --list "$BACKUP_FILE" >/dev/null
echo "Backup integrity check passed for $BACKUP_FILE"
