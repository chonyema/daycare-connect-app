-- Check if admin account exists and has correct fields
SELECT
  id,
  email,
  name,
  "userType",
  role,
  "isActive",
  "isSuperAdmin",
  password IS NOT NULL as has_password
FROM users
WHERE email = 'admin@prod.com';
