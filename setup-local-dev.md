# Local Development Setup

## When local dev APIs stop working

If your local development booking, favorites, or waitlist features stop working, it's likely because the local SQLite database doesn't have the required seed data.

## Quick Fix:

1. **Temporarily change schema to SQLite:**
   ```bash
   # In prisma/schema.prisma, change line 9:
   provider = "sqlite"  # Change from "postgresql"
   ```

2. **Push schema and seed database:**
   ```bash
   npx prisma db push
   npx tsx prisma/seed-local.ts
   ```

3. **Restart dev server:**
   ```bash
   # Kill current dev server (Ctrl+C), then:
   npm run dev
   ```

4. **Restore PostgreSQL schema (important for production):**
   ```bash
   # In prisma/schema.prisma, change line 9 back:
   provider = "postgresql"  # Change back from "sqlite"
   ```

## Why this happens:

- Production uses PostgreSQL with seeded data
- Local development uses SQLite which starts empty
- The schema needs to match the database type
- The frontend expects specific user IDs that must exist in the database

## Files created:
- `prisma/seed-local.ts` - Seeds local SQLite with required data
- Local database gets same parent ID as production: `cmfc5uege0000xt2sxukou174`