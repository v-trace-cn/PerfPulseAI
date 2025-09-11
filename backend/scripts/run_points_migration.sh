#!/usr/bin/env bash
# Cross-platform (Git Bash/WSL/macOS/Linux) runner for points data migration
# Usage:
#   ./run_points_migration.sh [migrate|verify|rollback]
# Default action: migrate

set -euo pipefail

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ACTION="${1:-migrate}"

echo "[points-migration] Using backend dir: ${BACKEND_DIR}"

# 1) Alembic upgrade
if command -v alembic >/dev/null 2>&1; then
  echo "[points-migration] Running alembic upgrade head..."
  alembic -c "${BACKEND_DIR}/alembic.ini" upgrade head
else
  echo "[points-migration] 'alembic' not found in PATH. Trying python -m alembic..."
  if command -v python3 >/dev/null 2>&1; then
    python3 -m alembic -c "${BACKEND_DIR}/alembic.ini" upgrade head
  elif command -v python >/dev/null 2>&1; then
    python -m alembic -c "${BACKEND_DIR}/alembic.ini" upgrade head
  else
    echo "[points-migration] Error: Neither 'alembic' nor 'python' found in PATH." >&2
    exit 1
  fi
fi

# 2) Run data migration (migrate/verify/rollback)
# Pick a python
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY="python3"
elif command -v python >/dev/null 2>&1; then
  PY="python"
elif command -v py >/dev/null 2>&1; then
  PY="py -3"
else
  echo "[migration] Error: No python interpreter found (python3/python/py)." >&2
  exit 1
fi

echo "[migration] Running data action: ${ACTION}"
${PY} "${BACKEND_DIR}/scripts/migrate_points_data.py" "${ACTION}"

echo "[migration] Done."
