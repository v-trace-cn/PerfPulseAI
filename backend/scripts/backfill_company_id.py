import asyncio
import os
import sys
# Ensure 'backend' is on sys.path so that 'app' package can be imported
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from typing import Optional
from sqlalchemy import select, update, func
from app.core.database import AsyncSessionLocal
from app.models.scoring import PointTransaction
from app.models.user import User

"""
Backfill script: set point_transactions.company_id where NULL, using users.company_id.

What will be updated:
- Table: point_transactions
- Column updated: company_id (from NULL -> users.company_id)
- Join key: point_transactions.user_id == users.id
- Selection: WHERE point_transactions.company_id IS NULL
- Skip rule: if users.company_id IS NULL (user not in any company)

Usage (from repo root):
    python -m backend.scripts.backfill_company_id [--dry-run] [--batch-size N] [--verbose] [--sample N]

Notes:
- Safe, batch-based, dialect-agnostic (no UPDATE JOIN).
- Rows where the user has no company_id are skipped.
- Recommend DB backup or snapshot before executing.
"""

BATCH_SIZE = 500

async def _print_summary(db, *, batch_size: int):
    # Count candidates and distribution
    total_candidates = (await db.execute(
        select(func.count()).select_from(PointTransaction).filter(PointTransaction.company_id.is_(None))
    )).scalar() or 0

    users_res = await db.execute(
        select(User.company_id, func.count()).join(
            PointTransaction, PointTransaction.user_id == User.id
        ).filter(PointTransaction.company_id.is_(None)).group_by(User.company_id)
    )
    by_company = users_res.all()

    # Exact counts for updatable/skippable
    total_updatable = (await db.execute(
        select(func.count()).select_from(PointTransaction)
        .join(User, PointTransaction.user_id == User.id)
        .filter(PointTransaction.company_id.is_(None), User.company_id.is_not(None))
    )).scalar() or 0
    total_skippable = (await db.execute(
        select(func.count()).select_from(PointTransaction)
        .join(User, PointTransaction.user_id == User.id)
        .filter(PointTransaction.company_id.is_(None), User.company_id.is_(None))
    )).scalar() or 0

    print("=== Backfill Summary ===")
    print("Target table: point_transactions")
    print("Target column: company_id (NULL -> users.company_id)")
    print("Join: point_transactions.user_id = users.id")
    print("Selection: point_transactions.company_id IS NULL")
    print(f"Batch size: {batch_size}")
    print(f"Total candidate rows: {total_candidates}")
    # Breakdown: show NULL and top non-NULL buckets
    null_bucket = sum(c for cid, c in by_company if cid is None)
    non_null = [(cid, c) for cid, c in by_company if cid is not None]
    non_null.sort(key=lambda x: x[1], reverse=True)
    print(f"Users without company (skippable rows count via join bucket): {null_bucket}")
    top = non_null[:10]
    if top:
        print("Top company buckets (company_id -> candidate rows):")
        for cid, c in top:
            print(f"  {cid}: {c}")
    print("========================")

    return {
        "total_candidates": total_candidates,
        "total_updatable": total_updatable,
        "total_skippable": total_skippable,
    }

async def backfill_company_id(dry_run: bool = False, *, batch_size: int = BATCH_SIZE, sample: int = 0) -> None:
    async with AsyncSessionLocal() as db:
        # Print pre-execution summary and get totals
        totals = await _print_summary(db, batch_size=batch_size)
        total_updatable = totals.get("total_updatable", 0)
        total_skippable = totals.get("total_skippable", 0)

        # DRY RUN: do not loop; compute preview and exit with summarized numbers
        if dry_run:
            if sample:
                sample_rows = (await db.execute(
                    select(PointTransaction.id, PointTransaction.user_id)
                    .filter(PointTransaction.company_id.is_(None))
                    .limit(sample)
                )).all()
                user_ids = {row.user_id for row in sample_rows}
                users_res = await db.execute(
                    select(User.id, User.company_id).filter(User.id.in_(user_ids))
                )
                user_company = {uid: cid for uid, cid in users_res.all()}
                print("Sample preview (tx_id, user_id, company_id):")
                for tx_id, user_id in sample_rows:
                    print(f"  {tx_id}, {user_id}, {user_company.get(user_id)}")
            print("--- DRY RUN SUMMARY ---")
            print(f"Would update: {total_updatable}")
            print(f"Would skip (user without company): {total_skippable}")
            return

        total_updated = 0
        total_skipped = 0
        while True:
            # Fetch a batch of transactions with NULL company_id
            result = await db.execute(
                select(PointTransaction.id, PointTransaction.user_id)
                .filter(PointTransaction.company_id.is_(None))
                .limit(batch_size)
            )
            rows = result.all()
            if not rows:
                break

            # Collect unique user_ids
            user_ids = {row.user_id for row in rows}
            users_res = await db.execute(
                select(User.id, User.company_id).filter(User.id.in_(user_ids))
            )
            user_company = {uid: cid for uid, cid in users_res.all()}

            # Update each transaction in the batch
            batch_updated = 0
            batch_skipped = 0
            for tx_id, user_id in rows:
                company_id: Optional[int] = user_company.get(user_id)
                if not company_id:
                    batch_skipped += 1
                    continue
                await db.execute(
                    update(PointTransaction)
                    .where(PointTransaction.id == tx_id)
                    .values(company_id=company_id)
                )
                batch_updated += 1

            await db.commit()

            total_updated += batch_updated
            total_skipped += batch_skipped

            if total_updatable:
                percent = (total_updated / total_updatable) * 100
                print(f"Processed batch: updated={batch_updated}, skipped={batch_skipped}, total={total_updated}/{total_updatable} ({percent:.2f}%)")
            else:
                print(f"Processed batch: updated={batch_updated}, skipped={batch_skipped}, total_updated={total_updated}")

        print("Backfill complete.")
        print(f"Total updated: {total_updated}")
        print(f"Total skipped (user without company): {total_skipped}")

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Backfill point_transactions.company_id from users.company_id")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without committing")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Batch size for processing")
    parser.add_argument("--sample", type=int, default=0, help="Print a preview of first N mappings in the first batch")
    args = parser.parse_args()

    if args.dry_run:
        print("[DRY RUN] No changes will be committed.")

    await backfill_company_id(
        dry_run=args.dry_run,
        batch_size=args.batch_size,
        sample=args.sample,
    )

if __name__ == "__main__":
    asyncio.run(main())

