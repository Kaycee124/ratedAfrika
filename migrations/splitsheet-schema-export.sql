-- ===================================================================
-- SPLITSHEET SCHEMA MIGRATION SCRIPT
-- Version: 2.0 (Versioning Strategy)
-- Date: 2025-01-28
-- Description: Complete schema for splitsheet system with versioning
-- ===================================================================

-- Create enum types first
DO $$ BEGIN
    CREATE TYPE "SplitSheetStatus" AS ENUM ('Active', 'Archived', 'PaidOut');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SplitEntryStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAID', 'INVALIDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================================================
-- 1. SPLIT_SHEETS TABLE (Main splitsheet table with versioning)
-- ===================================================================
CREATE TABLE IF NOT EXISTS "split_sheets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "status" "SplitSheetStatus" NOT NULL DEFAULT 'Active',
    "version" integer NOT NULL DEFAULT 1,
    "lastModifiedBy" varchar,
    "previousVersionId" uuid,
    "replacedAt" timestamp,
    "replacedBy" varchar,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "songId" uuid NOT NULL
);

-- Add foreign key to songs table
ALTER TABLE "split_sheets" 
ADD CONSTRAINT "FK_split_sheets_songId" 
FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add self-referencing foreign key for versioning
ALTER TABLE "split_sheets" 
ADD CONSTRAINT "FK_split_sheets_previousVersionId" 
FOREIGN KEY ("previousVersionId") REFERENCES "split_sheets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IDX_split_sheets_songId" ON "split_sheets"("songId");
CREATE INDEX IF NOT EXISTS "IDX_split_sheets_status" ON "split_sheets"("status");
CREATE INDEX IF NOT EXISTS "IDX_split_sheets_version" ON "split_sheets"("version");
CREATE INDEX IF NOT EXISTS "IDX_split_sheets_previousVersionId" ON "split_sheets"("previousVersionId");

-- ===================================================================
-- 2. SPLIT_SHEET_ENTRIES TABLE (Individual collaborator entries)
-- ===================================================================
CREATE TABLE IF NOT EXISTS "split_sheet_entries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "recipientEmail" varchar NOT NULL,
    "recipientName" varchar,
    "percentage" decimal(5,2) NOT NULL,
    "status" "SplitEntryStatus" NOT NULL DEFAULT 'PENDING',
    "claimToken" uuid NOT NULL DEFAULT gen_random_uuid(),
    "userId" uuid,
    "splitSheetId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Add foreign keys
ALTER TABLE "split_sheet_entries" 
ADD CONSTRAINT "FK_split_sheet_entries_splitSheetId" 
FOREIGN KEY ("splitSheetId") REFERENCES "split_sheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "split_sheet_entries" 
ADD CONSTRAINT "FK_split_sheet_entries_userId" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IDX_split_sheet_entries_splitSheetId" ON "split_sheet_entries"("splitSheetId");
CREATE INDEX IF NOT EXISTS "IDX_split_sheet_entries_userId" ON "split_sheet_entries"("userId");
CREATE INDEX IF NOT EXISTS "IDX_split_sheet_entries_claimToken" ON "split_sheet_entries"("claimToken");
CREATE INDEX IF NOT EXISTS "IDX_split_sheet_entries_recipientEmail" ON "split_sheet_entries"("recipientEmail");
CREATE INDEX IF NOT EXISTS "IDX_split_sheet_entries_status" ON "split_sheet_entries"("status");

-- Ensure unique claim tokens
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_split_sheet_entries_claimToken" ON "split_sheet_entries"("claimToken");

-- ===================================================================
-- 3. UPDATE SONGS TABLE (Add current splitsheet reference)
-- ===================================================================
-- Add currentSplitSheetId column to songs table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "songs" ADD COLUMN "currentSplitSheetId" uuid;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add foreign key constraint for current splitsheet
DO $$ BEGIN
    ALTER TABLE "songs" 
    ADD CONSTRAINT "FK_songs_currentSplitSheetId" 
    FOREIGN KEY ("currentSplitSheetId") REFERENCES "split_sheets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index for current splitsheet lookup
CREATE INDEX IF NOT EXISTS "IDX_songs_currentSplitSheetId" ON "songs"("currentSplitSheetId");

-- ===================================================================
-- 4. CONSTRAINTS AND VALIDATION
-- ===================================================================

-- Percentage validation (between 0.01 and 100)
ALTER TABLE "split_sheet_entries" 
ADD CONSTRAINT "CHK_split_sheet_entries_percentage_range" 
CHECK ("percentage" > 0 AND "percentage" <= 100);

-- Email format validation (basic)
ALTER TABLE "split_sheet_entries" 
ADD CONSTRAINT "CHK_split_sheet_entries_email_format" 
CHECK ("recipientEmail" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Version must be positive
ALTER TABLE "split_sheets" 
ADD CONSTRAINT "CHK_split_sheets_version_positive" 
CHECK ("version" > 0);

-- ===================================================================
-- 5. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ===================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for split_sheets
DROP TRIGGER IF EXISTS trigger_split_sheets_updated_at ON "split_sheets";
CREATE TRIGGER trigger_split_sheets_updated_at
    BEFORE UPDATE ON "split_sheets"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for split_sheet_entries
DROP TRIGGER IF EXISTS trigger_split_sheet_entries_updated_at ON "split_sheet_entries";
CREATE TRIGGER trigger_split_sheet_entries_updated_at
    BEFORE UPDATE ON "split_sheet_entries"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 6. SAMPLE DATA VALIDATION QUERIES (Run after import)
-- ===================================================================

-- These queries can be run to validate the schema after migration:

-- Check if all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('split_sheets', 'split_sheet_entries');

-- Check foreign key relationships
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('split_sheets', 'split_sheet_entries', 'songs');

-- Check constraints
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid IN (SELECT oid FROM pg_class WHERE relname IN ('split_sheets', 'split_sheet_entries'));

-- ===================================================================
-- 7. MIGRATION COMPLETION LOG
-- ===================================================================

-- Insert migration log (optional - create migrations table if needed)
-- CREATE TABLE IF NOT EXISTS "migrations_log" (
--     "id" serial PRIMARY KEY,
--     "migration_name" varchar NOT NULL,
--     "executed_at" timestamp DEFAULT now(),
--     "version" varchar
-- );

-- INSERT INTO "migrations_log" ("migration_name", "version") 
-- VALUES ('splitsheet-schema-export.sql', '2.0-versioning');

-- ===================================================================
-- MIGRATION SCRIPT COMPLETE
-- ===================================================================

COMMIT; 