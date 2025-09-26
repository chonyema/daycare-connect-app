-- Safe Daycare Connect Schema for Supabase PostgreSQL
-- This script checks for existing objects before creating them

-- Create enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE "UserType" AS ENUM ('PARENT', 'PROVIDER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DaycareType" AS ENUM ('LICENSED_DAYCARE_CENTER', 'LICENSED_HOME_DAYCARE', 'UNLICENSED_HOME_DAYCARE', 'NANNY_SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CareType" AS ENUM ('FULL_TIME', 'PART_TIME', 'DROP_IN', 'EMERGENCY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'WAITLIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActivityType" AS ENUM ('MEAL', 'NAP', 'ACTIVITY', 'DIAPER_CHANGE', 'MILESTONE', 'INCIDENT', 'PHOTO', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NapQuality" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "daycareId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Create daily_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS "daily_reports" (
    "id" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallMood" TEXT,
    "generalNotes" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "parentViewed" BOOLEAN NOT NULL DEFAULT false,
    "parentViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- Create daily_report_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS "daily_report_activities" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "mealType" "MealType",
    "foodItems" TEXT,
    "amountEaten" TEXT,
    "napQuality" "NapQuality",
    "photos" TEXT,
    "documents" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_activities_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to existing tables if they don't exist
DO $$ BEGIN
    -- Add messaging relations to users table
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sentMessages" TEXT[];
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "receivedMessages" TEXT[];
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "parentConversations" TEXT[];
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "providerConversations" TEXT[];
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dailyReports" TEXT[];
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    -- Add missing columns to daycares table
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "province" TEXT;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "hourlyRate" DOUBLE PRECISION;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "openTime" TEXT;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "closeTime" TEXT;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "operatingDays" TEXT;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER DEFAULT 0;
    ALTER TABLE "daycares" ADD COLUMN IF NOT EXISTS "waitlistCount" INTEGER DEFAULT 0;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    -- Add missing columns to bookings table
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "specialNeeds" TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create unique indexes if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "conversations_parentId_providerId_daycareId_key" ON "conversations"("parentId", "providerId", "daycareId");
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "daily_reports_bookingId_reportDate_key" ON "daily_reports"("bookingId", "reportDate");
EXCEPTION
    WHEN others THEN null;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "daily_report_activities" ADD CONSTRAINT "daily_report_activities_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;