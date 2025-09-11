<#
Cross-platform Windows PowerShell runner for points data migration
Usage:
  ./run_points_migration.ps1 [migrate|verify|rollback]
Default action: migrate
#>
param(
  [ValidateSet('migrate','verify','rollback')]
  [string]$Action = 'migrate'
)

$ErrorActionPreference = 'Stop'

# Resolve directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
Write-Host "[points-migration] Using backend dir: $BackendDir"

# 1) Alembic upgrade
function Invoke-AlembicUpgrade {
  try {
    Push-Location $BackendDir
    try {
      if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "[points-migration] Running python -m alembic upgrade head..."
        python -m alembic -c "alembic.ini" upgrade head
      } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        Write-Host "[points-migration] Running py -3 -m alembic upgrade head..."
        py -3 -m alembic -c "alembic.ini" upgrade head
      } else {
        throw "No python interpreter found (python/py)."
      }
    } finally {
      Pop-Location
    }
  } catch {
    throw "Alembic upgrade failed: $($_.Exception.Message)"
  }
}

Invoke-AlembicUpgrade

# 2) Run data migration (migrate/verify/rollback)
function Get-PythonExe {
  if (Get-Command python -ErrorAction SilentlyContinue) { return 'python' }
  if (Get-Command py -ErrorAction SilentlyContinue) { return 'py -3' }
  throw "No python interpreter found (python/py)."
}

$py = Get-PythonExe
Write-Host "[points-migration] Running data action: $Action"

# Create a temporary Python script that contains the data migration logic
$tempPy = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "points_migrate_$([System.Guid]::NewGuid().ToString('N')).py")
$pyCode = @'
# -*- coding: utf-8 -*-
import asyncio
import sys
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models.scoring import ScoreEntry, PointTransaction, TransactionType
from datetime import datetime, timedelta
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_score_entries():
    async with AsyncSessionLocal() as db:
        try:
            logger.info("Backing up user points...")
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS user_points_backup AS
                SELECT id, points, level, level_id, created_at FROM users
            """))

            logger.info("Reading score entries...")
            result = await db.execute(select(ScoreEntry).order_by(ScoreEntry.user_id, ScoreEntry.created_at))
            score_entries = result.scalars().all()
            logger.info(f"Found {len(score_entries)} score entries")

            user_balances = {}
            migration_count = 0

            for entry in score_entries:
                user_id = entry.user_id
                user_balances[user_id] = user_balances.get(user_id, 0) + entry.score

                txn = PointTransaction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    transaction_type=TransactionType.EARN,
                    amount=entry.score,
                    balance_after=user_balances[user_id],
                    reference_id=entry.activity_id,
                    reference_type='activity',
                    description=(f"activity points: {entry.notes}" if entry.notes else "activity points"),
                    dispute_deadline=(entry.created_at or datetime.utcnow()) + timedelta(days=90),
                    created_at=entry.created_at or datetime.utcnow()
                )
                db.add(txn)
                migration_count += 1
                if migration_count % 100 == 0:
                    logger.info(f"Migrated {migration_count} entries...")

            logger.info("Updating user balances...")
            for user_id, balance in user_balances.items():
                await db.execute(text("UPDATE users SET points=:b WHERE id=:u"), {"b": balance, "u": user_id})

            logger.info("Updating user levels...")
            await db.execute(text("""
                UPDATE users SET level_id = (
                    SELECT ul.id FROM user_levels ul
                    WHERE users.points >= ul.min_points
                      AND (ul.max_points IS NULL OR users.points <= ul.max_points)
                    ORDER BY ul.min_points DESC LIMIT 1
                ) WHERE points > 0
            """))
            await db.execute(text("""
                UPDATE users SET level_id = 'level_1' WHERE points = 0 AND level_id IS NULL
            """))

            await db.commit()
            logger.info(f"Migration completed, {migration_count} entries")
        except Exception as e:
            await db.rollback()
            logger.error(f"Migration failed: {e}")
            raise

async def verify_migration():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("""
            SELECT u.id as user_id, u.name as user_name, u.points as user_points,
                   COALESCE(SUM(pt.amount), 0) as calculated_points,
                   u.points - COALESCE(SUM(pt.amount), 0) as difference
            FROM users u LEFT JOIN point_transactions pt ON u.id = pt.user_id
            GROUP BY u.id, u.name, u.points
            HAVING ABS(u.points - COALESCE(SUM(pt.amount), 0)) > 0
        """))
        rows = res.fetchall()
        if rows:
            logger.warning(f"Found {len(rows)} users with inconsistent points:")
            for r in rows:
                logger.warning(f"User {r.user_name} (ID: {r.user_id}) diff={r.difference}")
        else:
            logger.info("Consistency check passed")

async def rollback_migration():
    async with AsyncSessionLocal() as db:
        try:
            logger.info("Rolling back user points...")
            await db.execute(text("""
                UPDATE users SET points = (
                    SELECT points FROM user_points_backup WHERE user_points_backup.id = users.id
                ), level_id = (
                    SELECT level_id FROM user_points_backup WHERE user_points_backup.id = users.id
                ) WHERE EXISTS (
                    SELECT 1 FROM user_points_backup WHERE user_points_backup.id = users.id
                )
            """))
            logger.info("Cleaning migrated transactions...")
            await db.execute(text("""
                DELETE FROM point_transactions WHERE reference_type='activity' AND transaction_type='EARN'
            """))
            await db.commit()
            logger.info("Rollback completed")
        except Exception as e:
            await db.rollback()
            logger.error(f"Rollback failed: {e}")
            raise

async def main():
    if len(sys.argv) < 2:
        print("usage: [migrate|verify|rollback]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == 'migrate':
        await migrate_score_entries()
        await verify_migration()
    elif cmd == 'verify':
        await verify_migration()
    elif cmd == 'rollback':
        await rollback_migration()
    else:
        print('invalid command')
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
'@

Set-Content -Path $tempPy -Value $pyCode -Encoding UTF8

Push-Location $BackendDir
$oldPyPath = $env:PYTHONPATH
try {
  if ([string]::IsNullOrEmpty($oldPyPath)) {
    $env:PYTHONPATH = $BackendDir
  } else {
    $env:PYTHONPATH = "$BackendDir;$oldPyPath"
  }
  & $py $tempPy $Action
  if ($LASTEXITCODE -ne 0) { throw "Data migration exited with code $LASTEXITCODE" }
} finally {
  $env:PYTHONPATH = $oldPyPath
  Pop-Location
  Remove-Item -Force $tempPy
}

Write-Host "[points-migration] Done."

