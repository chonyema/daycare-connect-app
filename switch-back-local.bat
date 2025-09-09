@echo off
echo Switching back to local SQLite schema...
ren prisma\schema.prisma schema-production.prisma
ren prisma\schema-local.prisma schema.prisma

echo Regenerating Prisma client for local development...
npx prisma generate

echo Back to local development mode!
pause