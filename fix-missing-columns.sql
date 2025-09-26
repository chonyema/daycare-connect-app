-- Fix missing required columns in daycares table
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "province" TEXT DEFAULT 'ON';
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "postalCode" TEXT DEFAULT '';
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "hourlyRate" DOUBLE PRECISION;
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "openTime" TEXT DEFAULT '7:00 AM';
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "closeTime" TEXT DEFAULT '6:00 PM';
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "operatingDays" TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]';
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false;
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER DEFAULT 0;
ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "waitlistCount" INTEGER DEFAULT 0;

-- Update existing data types if needed
ALTER TABLE "daycares" ALTER COLUMN "ageGroups" TYPE TEXT;
ALTER TABLE "daycares" ALTER COLUMN "features" TYPE TEXT;