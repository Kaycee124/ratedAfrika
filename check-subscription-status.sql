-- Check what enum values exist in the database
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'users_subscription_enum'
ORDER BY e.enumsortorder;

-- Check current subscription values in users table
SELECT 
    subscription,
    COUNT(*) as count
FROM users
GROUP BY subscription
ORDER BY count DESC;

-- Check if migrations table is tracking migrations
SELECT * FROM migrations ORDER BY timestamp DESC;

-- Show total migration count
SELECT COUNT(*) as total_migrations FROM migrations;

