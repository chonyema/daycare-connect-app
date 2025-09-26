-- Create database tables for Daycare Connect App
-- Run this SQL in your Supabase SQL Editor

-- Create enums
CREATE TYPE "UserType" AS ENUM ('PARENT', 'PROVIDER', 'ADMIN');
CREATE TYPE "DaycareType" AS ENUM ('DAYCARE', 'PRESCHOOL', 'NURSERY', 'HOME_DAYCARE');
CREATE TYPE "CareType" AS ENUM ('FULL_TIME', 'PART_TIME', 'DROP_IN', 'EMERGENCY');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

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
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "availableSpots" INTEGER NOT NULL DEFAULT 20,
    "dailyRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ageGroups" TEXT[],
    "features" TEXT[],
    "hours" TEXT,
    "established" TIMESTAMP(3),
    "images" TEXT[],
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daycares_pkey" PRIMARY KEY ("id")
);

-- Create bookings table
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" TEXT,
    "daycareId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "careType" "CareType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "dailyRate" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30),
    "notes" TEXT,
    "specialNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- Create reviews table
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Create saved_daycares table
CREATE TABLE "SavedDaycare" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "daycareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDaycare_pkey" PRIMARY KEY ("id")
);

-- Create conversations table
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Create messages table
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "SavedDaycare_parentId_daycareId_key" ON "SavedDaycare"("parentId", "daycareId");
CREATE UNIQUE INDEX "conversations_parentId_providerId_key" ON "conversations"("parentId", "providerId");

-- Add foreign key constraints
ALTER TABLE "daycares" ADD CONSTRAINT "daycares_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedDaycare" ADD CONSTRAINT "SavedDaycare_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedDaycare" ADD CONSTRAINT "SavedDaycare_daycareId_fkey" FOREIGN KEY ("daycareId") REFERENCES "daycares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;