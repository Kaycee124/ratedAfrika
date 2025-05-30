# Database Migration Checklist - Splitsheet Schema

## Pre-Migration Checklist ⚠️

- [ ] **Backup live database completely**
- [ ] **Test migration on staging environment first**
- [ ] **Verify you have the correct live database credentials**
- [ ] **Ensure pgAdmin is connected to both local and live databases**
- [ ] **Plan for application downtime (if needed)**

---

## Migration Option 1: Using pgAdmin GUI (Recommended)

### Step 1: Export from Local Database
- [ ] Open pgAdmin Desktop
- [ ] Connect to your local database
- [ ] Right-click on your local database → **"Backup..."**
- [ ] Configure backup:
  - **Format:** `Custom`
  - **Filename:** `splitsheet-schema-backup.backup`
  - **Encoding:** `UTF8`
- [ ] In **Data/Objects** tab:
  - ✅ Check **"Schema only"**
  - ❌ Uncheck **"Data"**
  - ✅ Check **"Pre-data"** (tables, constraints, indexes)
  - ✅ Check **"Post-data"** (triggers, rules)
- [ ] In **Objects** tab:
  - ✅ Check **"Tables"**
  - ✅ Check **"Indexes"**
  - ✅ Check **"Constraints"**
  - ✅ Check **"Foreign Keys"**
  - ✅ Check **"Sequences"**
  - ❌ Uncheck **"Data"**
- [ ] Click **"Backup"** and wait for completion

### Step 2: Backup Live Database
- [ ] Connect to live database in pgAdmin
- [ ] Right-click live database → **"Backup..."**
- [ ] Save full backup as: `live-backup-YYYY-MM-DD.backup`
- [ ] Wait for backup completion

### Step 3: Import to Live Database
- [ ] Right-click on live database → **"Restore..."**
- [ ] Select your `splitsheet-schema-backup.backup` file
- [ ] Configure restore options:
  - **Format:** `Custom or tar`
  - **Role name:** Your live database user
- [ ] In **Restore Options** tab:
  - ✅ Check **"Schema only"**
  - ✅ Check **"Clean before restore"** (if replacing existing tables)
  - ❌ Uncheck **"Create the database"** (if database already exists)
  - ❌ Uncheck **"Only data"**
- [ ] Click **"Restore"**
- [ ] Check pgAdmin's **Messages** tab for any errors

---

## Migration Option 2: Using SQL Script (Alternative)

### Step 1: Use Provided SQL Script
- [ ] Use the `migrations/splitsheet-schema-export.sql` file created above
- [ ] Open the file and review the contents
- [ ] Modify any user/role names if needed

### Step 2: Execute on Live Database
- [ ] Connect to live database in pgAdmin
- [ ] Open **Query Tool** (`Tools` → `Query Tool`)
- [ ] Open the `splitsheet-schema-export.sql` file
- [ ] Execute the script
- [ ] Check for any error messages

---

## Post-Migration Validation ✅

### Step 1: Verify Tables Created
Run this query in live database:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('split_sheets', 'split_sheet_entries')
ORDER BY table_name;
```
- [ ] Confirm both tables exist

### Step 2: Check Table Structures
Run these commands in Query Tool:
```sql
\d split_sheets
\d split_sheet_entries
```
- [ ] Verify column types match your local database
- [ ] Check that all columns exist

### Step 3: Verify Foreign Key Relationships
Run this query:
```sql
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
  AND tc.table_name IN ('split_sheets', 'split_sheet_entries', 'songs')
ORDER BY tc.table_name;
```
- [ ] Verify all expected foreign keys exist
- [ ] Check that songs table has `currentSplitSheetId` column

### Step 4: Test Basic Operations
Run these test queries:
```sql
-- Test enum types work
SELECT unnest(enum_range(NULL::"SplitSheetStatus"));
SELECT unnest(enum_range(NULL::"SplitEntryStatus"));

-- Test constraints work (this should fail)
-- INSERT INTO split_sheet_entries (recipientEmail, percentage, splitSheetId) 
-- VALUES ('invalid-email', 150, gen_random_uuid());
```
- [ ] Enum types display correctly
- [ ] Constraint violations are caught

### Step 5: Application Integration Test
- [ ] Update your application's database connection to point to live database
- [ ] Start your application
- [ ] Check application logs for database errors
- [ ] Test basic splitsheet operations (if possible)

---

## Common Issues & Solutions

### Issue: "relation does not exist" errors
**Solution:** Tables weren't created properly
- [ ] Check if backup included the correct tables
- [ ] Verify you selected "Schema only" during backup
- [ ] Try running the SQL script manually

### Issue: "permission denied" errors
**Solution:** Database permissions issue
- [ ] Run: `GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;`
- [ ] Run: `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;`

### Issue: "constraint already exists" errors
**Solution:** Tables partially exist
- [ ] Either drop existing tables first, or
- [ ] Use the SQL script which includes `IF NOT EXISTS` clauses

### Issue: Foreign key constraint failures
**Solution:** Referenced tables don't exist
- [ ] Ensure `songs` and `users` tables exist in live database
- [ ] Import those tables first if needed

---

## Emergency Rollback Plan 🚨

If migration fails:
1. [ ] **Stop your application immediately**
2. [ ] **Restore from the backup you created in Step 2:**
   - Right-click live database → "Restore..."
   - Select `live-backup-YYYY-MM-DD.backup`
   - Check "Clean before restore"
   - Click "Restore"
3. [ ] **Verify application works with restored database**
4. [ ] **Debug the migration issue before trying again**

---

## Final Deployment Checklist

After successful migration:
- [ ] **Update environment variables** to point to live database
- [ ] **Deploy application code** with new splitsheet features
- [ ] **Test key workflows** in production
- [ ] **Monitor application logs** for any database-related errors
- [ ] **Verify splitsheet creation/update works**
- [ ] **Test claim token functionality**
- [ ] **Monitor email notifications**

---

## GitHub Migration Notes

Don't forget to:
- [ ] **Commit all migration files** to your repository
- [ ] **Update README.md** with new splitsheet features
- [ ] **Document the new API endpoints**
- [ ] **Tag the release** with versioning information
- [ ] **Update deployment documentation**

---

**⚠️ IMPORTANT: Always test on a staging environment first!**
**⚠️ IMPORTANT: Always backup before migrating!**
**⚠️ IMPORTANT: Plan for application downtime during migration!** 