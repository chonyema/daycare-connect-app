-- Debug: Check if all required columns exist in daycares table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daycares'
ORDER BY column_name;