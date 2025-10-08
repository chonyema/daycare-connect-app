-- Create Role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'STAFF', 'PROVIDER_ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add RBAC columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role "Role" DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isSuperAdmin" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "daycareId" TEXT;
