-- Add RBAC fields to users table

-- First, create the Role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'STAFF', 'PROVIDER_ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column (default to USER)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role "Role" DEFAULT 'USER';

-- Add isActive column (default to true)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add isSuperAdmin column (default to false)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "isSuperAdmin" BOOLEAN DEFAULT false;

-- Add permissions column (JSON string)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS permissions TEXT;

-- Add daycareId column for staff members
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "daycareId" TEXT;

-- Update existing users to have default values
UPDATE users
SET role = 'USER', "isActive" = true, "isSuperAdmin" = false
WHERE role IS NULL OR "isActive" IS NULL OR "isSuperAdmin" IS NULL;

-- Show all users to confirm
SELECT id, email, name, "userType", role, "isActive", "isSuperAdmin" FROM users;
