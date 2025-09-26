-- Complete Daycare Connect Schema for Supabase PostgreSQL
-- Run this in your Supabase SQL Editor

-- Create enums
CREATE TYPE "UserType" AS ENUM ('PARENT', 'PROVIDER', 'ADMIN');
CREATE TYPE "DaycareType" AS ENUM ('LICENSED_DAYCARE_CENTER', 'LICENSED_HOME_DAYCARE', 'UNLICENSED_HOME_DAYCARE', 'NANNY_SERVICE');
CREATE TYPE "CareType" AS ENUM ('FULL_TIME', 'PART_TIME', 'DROP_IN', 'EMERGENCY');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'WAITLIST');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');
CREATE TYPE "ActivityType" AS ENUM ('MEAL', 'NAP', 'ACTIVITY', 'DIAPER_CHANGE', 'MILESTONE', 'INCIDENT', 'PHOTO', 'OTHER');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE "NapQuality" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "userType" "UserType" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create daycares table
CREATE TABLE "daycares" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DaycareType" NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "ageGroups" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "operatingDays" TEXT NOT NULL,
    "features" TEXT,
    "images" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daycares_pkey" PRIMARY KEY ("id")
);

-- Create bookings table
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "careType" "CareType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION,
    "notes" TEXT,
    "specialNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- Create reviews table
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Create saved_daycares table
CREATE TABLE "saved_daycares" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_daycares_pkey" PRIMARY KEY ("id")
);

-- Create conversations table
CREATE TABLE "conversations" (
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

-- Create messages table
CREATE TABLE "messages" (
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

-- Create daily_reports table
CREATE TABLE "daily_reports" (
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

-- Create daily_report_activities table
CREATE TABLE "daily_report_activities" (
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

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "saved_daycares_parentId_daycareId_key" ON "saved_daycares"("parentId", "daycareId");
CREATE UNIQUE INDEX "conversations_parentId_providerId_daycareId_key" ON "conversations"("parentId", "providerId", "daycareId");
CREATE UNIQUE INDEX "daily_reports_bookingId_reportDate_key" ON "daily_reports"("bookingId", "reportDate");

-- Add foreign key constraints
ALTER TABLE "daycares" ADD CONSTRAINT "daycares_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_daycares" ADD CONSTRAINT "saved_daycares_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_daycares" ADD CONSTRAINT "saved_daycares_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_report_activities" ADD CONSTRAINT "daily_report_activities_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;