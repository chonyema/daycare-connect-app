# 🔐 Daycare Connect App - Credentials Backup

**Date Created:** September 14, 2025
**Project:** Daycare Connect App
**Backup Purpose:** Restore environment variables after system crash/reinstall

## 📁 Files in This Backup:

### `.env-local-development`
- **Purpose:** Local development environment
- **Database:** SQLite (file:./prisma/dev.db)
- **Contains:** JWT secrets, SMTP settings, app URLs

### `.env-production`
- **Purpose:** Production deployment environment
- **Database:** PostgreSQL (production)
- **Contains:** Production database URLs, production secrets

### `.env-local-backup`
- **Purpose:** Extended local development with additional settings
- **Contains:** Full local development configuration

## 🚀 How to Restore After Crash:

1. Clone your GitHub repository: `git clone https://github.com/chonyema/daycare-connect-app.git`
2. Navigate to project: `cd daycare-connect-app`
3. Download this backup folder from your cloud storage
4. Copy the appropriate .env file to your project root:
   - For local development: `cp credentials-backup/.env-local-development .env`
   - For production: `cp credentials-backup/.env-production .env`
5. Install dependencies: `npm install`
6. Set up database: `npx prisma db push`
7. Start development: `npm run dev`

## 🔒 Security Notes:

- **NEVER** commit this folder to git
- **ALWAYS** store in private cloud storage only
- **UPDATE** this backup when you change credentials
- **ENCRYPT** the backup folder before uploading to cloud

## 🎯 Project Features:

- Unified parent/provider portal
- Real-time booking system
- Database-driven daycare listings
- Authentication system with JWT
- Email notifications
- Role-based access control

---

**⚠️ IMPORTANT:** Keep this backup secure and update it whenever you modify environment variables!