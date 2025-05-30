# Database Migration Guide - Local to Live Database

## Overview
This guide walks you through migrating your local PostgreSQL database table structure to a live database using pgAdmin Desktop Application.

## Prerequisites
- pgAdmin Desktop Application installed
- Access to both local and live PostgreSQL databases
- Backup of live database (recommended)

---

## Method 1: Schema-Only Export/Import (Recommended)

### Step 1: Export Schema from Local Database

1. **Open pgAdmin Desktop**
2. **Connect to your local database**
   - Expand `Servers` → `PostgreSQL` → Your local server
   - Right-click on your database name

3. **Export Schema Only**
   - Right-click on your database → `Backup...`
   - **Backup Options:**
     - **Format:** `Custom`
     - **Filename:** `local_schema_backup.backup`
     - **Encoding:** `UTF8`
   
4. **Configure Dump Options (IMPORTANT):**
   - **Data/Objects tab:**
     - ✅ **Schema Only** (uncheck "Data")
     - ✅ **Pre-data** (tables, constraints, indexes)
     - ✅ **Post-data** (triggers, rules)
     - ❌ **Data** (we only want structure)
   
   - **Objects tab:**
     - ✅ **Tables**
     - ✅ **Indexes**
     - ✅ **Constraints** 
     - ✅ **Foreign Keys**
     - ✅ **Sequences**
     - ❌ **Data** (ensure this is unchecked)

5. **Click "Backup"**

### Step 2: Prepare Live Database

1. **Connect to Live Database**
   - Add new server connection in pgAdmin
   - Enter your live database credentials

2. **Backup Live Database First (CRITICAL)**
   ```sql
   -- Create a full backup before migration
   -- Right-click live database → Backup...
   -- Save as: live_database_backup_YYYY-MM-DD.backup
   ```

3. **Check Current Schema (Optional)**
   ```sql
   -- View existing tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### Step 3: Import Schema to Live Database

1. **Restore to Live Database**
   - Right-click on live database → `Restore...`
   - **Filename:** Select your `local_schema_backup.backup`
   
2. **Restore Options:**
   - **Format:** `Custom or tar`
   - **Role name:** Your database user
   
3. **Restore Options Tab:**
   - ✅ **Schema only**
   - ✅ **Clean before restore** (if you want to replace existing tables)
   - ✅ **Create the database** (uncheck if database already exists)
   - ✅ **Only data** (uncheck this - we want schema only)

4. **Click "Restore"**

---

## Method 2: SQL Script Export/Import

### Step 1: Generate SQL Script from Local Database

1. **Using pgAdmin:**
   - Right-click local database → `Backup...`
   - **Format:** `Plain` (this creates SQL script)
   - **Filename:** `schema_export.sql`
   - **Dump Options:** Schema only (as above)

2. **Or using command line:**
   ```bash
   pg_dump -h localhost -p 5432 -U your_username -d your_database_name --schema-only --file=schema_export.sql
   ```

### Step 2: Clean Up SQL Script (if needed)

Open `schema_export.sql` in a text editor and:

1. **Remove/Modify problematic lines:**
   ```sql
   -- Remove these lines if they cause issues:
   -- SET statement_timeout = 0;
   -- SET lock_timeout = 0;
   -- SET client_encoding = 'UTF8';
   -- SET standard_conforming_strings = on;
   ```

2. **Handle ownership issues:**
   ```sql
   -- Replace local username with live database username
   -- Find and replace: OWNER TO local_user;
   -- Replace with: OWNER TO live_user;
   ```

### Step 3: Execute SQL Script on Live Database

1. **Using pgAdmin Query Tool:**
   - Connect to live database
   - Open Query Tool (`Tools` → `Query Tool`)
   - Open your `schema_export.sql` file
   - Execute the script

2. **Or using command line:**
   ```bash
   psql -h your_live_host -p 5432 -U your_live_username -d your_live_database -f schema_export.sql
   ```

---

## Method 3: Table-by-Table Migration (For Specific Tables)

### Step 1: Export Specific Table Schemas

```sql
-- In local database, get CREATE TABLE statements:
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    array_to_string(
        array_agg(
            column_name || ' ' || data_type ||
            CASE 
                WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')'
                ELSE ''
            END ||
            CASE 
                WHEN is_nullable = 'NO' 
                THEN ' NOT NULL'
                ELSE ''
            END
        ), ', '
    ) || ');'
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('songs', 'split_sheets', 'split_sheet_entries', 'users')
GROUP BY schemaname, tablename;
```

### Step 2: Get Constraints and Indexes

```sql
-- Get all constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class WHERE relname IN ('songs', 'split_sheets', 'split_sheet_entries')
);

-- Get all indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('songs', 'split_sheets', 'split_sheet_entries');
```

---

## Troubleshooting Common Issues

### Issue 1: Permission Errors
```sql
-- Grant necessary permissions on live database
GRANT ALL PRIVILEGES ON DATABASE your_live_database TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Issue 2: Table Already Exists
```sql
-- Drop existing tables (CAREFUL!)
DROP TABLE IF EXISTS split_sheet_entries CASCADE;
DROP TABLE IF EXISTS split_sheets CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
-- Then re-import
```

### Issue 3: Foreign Key Constraint Errors
```sql
-- Disable foreign key checks temporarily
SET session_replication_role = replica;
-- Run your import
-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;
```

### Issue 4: Sequence Issues
```sql
-- Reset sequences after import
SELECT setval('songs_id_seq', (SELECT MAX(id) FROM songs));
SELECT setval('split_sheets_id_seq', (SELECT MAX(id) FROM split_sheets));
-- Repeat for all sequences
```

---

## Validation After Migration

### 1. Verify All Tables Exist
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Check Table Structures
```sql
-- For each important table
\d songs
\d split_sheets  
\d split_sheet_entries
\d users
```

### 3. Verify Relationships
```sql
-- Check foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### 4. Test Basic Operations
```sql
-- Test insertions work
INSERT INTO songs (title, artist, duration) VALUES ('Test Song', 'Test Artist', 180);
-- Test that constraints work
-- Then delete test data
DELETE FROM songs WHERE title = 'Test Song';
```

---

## Important Notes

### Before Migration:
1. ✅ **Always backup your live database**
2. ✅ **Test the migration on a staging environment first**
3. ✅ **Document any custom configurations**
4. ✅ **Plan for downtime if needed**

### During Migration:
1. ⚠️ **Monitor for errors in pgAdmin's messages tab**
2. ⚠️ **Don't ignore warnings - they might be important**
3. ⚠️ **Keep track of what gets created successfully**

### After Migration:
1. ✅ **Validate all table structures**
2. ✅ **Test critical application functions**
3. ✅ **Update any environment variables**
4. ✅ **Monitor application logs for database errors**

---

## Quick Commands Cheat Sheet

```bash
# Export schema only
pg_dump -h localhost -U username -d dbname --schema-only -f schema.sql

# Import to live database  
psql -h livehost -U liveuser -d livedb -f schema.sql

# Check if table exists
psql -c "\dt tablename" dbname

# List all tables
psql -c "\dt" dbname

# Check table structure
psql -c "\d tablename" dbname
```

This guide should help you successfully migrate your database structure. Let me know if you encounter any specific errors during the process! 