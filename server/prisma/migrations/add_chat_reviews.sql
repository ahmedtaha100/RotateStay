-- Migration: add_chat_reviews
-- Purpose: introduce conversation, message, review, and notification system updates

-- Drop legacy messaging and review tables if they exist
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "_ConversationParticipants" CASCADE;

-- Create notification enum if it does not already exist
DO $$
BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'MESSAGE',
    'BOOKING_REQUEST',
    'BOOKING_APPROVED',
    'BOOKING_REJECTED',
    'REVIEW_RECEIVED',
    'REVIEW_REMINDER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Conversations table
CREATE TABLE "Conversation" (
  "id" TEXT PRIMARY KEY,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- Conversation participants join table
CREATE TABLE "_ConversationParticipants" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ConversationParticipants_AB_unique" ON "_ConversationParticipants"("A", "B");
CREATE INDEX "_ConversationParticipants_B_index" ON "_ConversationParticipants"("B");

-- Messages table
CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "fileUrl" TEXT,
  "fileType" TEXT,
  "fileName" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt" TIMESTAMP(3),
  "editedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- Reviews table
CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL UNIQUE,
  "reviewerId" TEXT NOT NULL,
  "reviewedId" TEXT NOT NULL,
  "cleanlinessRating" INTEGER NOT NULL,
  "communicationRating" INTEGER NOT NULL,
  "checkInRating" INTEGER NOT NULL,
  "accuracyRating" INTEGER NOT NULL,
  "locationRating" INTEGER NOT NULL,
  "valueRating" INTEGER NOT NULL,
  "overallRating" DOUBLE PRECISION NOT NULL,
  "comment" TEXT NOT NULL,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "responseText" TEXT,
  "responseDate" TIMESTAMP(3),
  "isPublic" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Review_reviewedId_createdAt_idx" ON "Review"("reviewedId", "createdAt");
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- Notifications table
CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "link" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- Foreign keys
ALTER TABLE "_ConversationParticipants"
  ADD CONSTRAINT "_ConversationParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_ConversationParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
