@echo off
echo Switching to production schema...
ren prisma\schema.prisma schema-local.prisma
ren prisma\schema-production.prisma schema.prisma

echo Committing production schema...
git add .
git commit -m "Deploy: Switch to PostgreSQL schema for production"
git push

echo Production deployment initiated!
echo Visit your Vercel dashboard to monitor the deployment.

pause