-- Update the admin@test.com user to be a Super Admin
UPDATE users
SET
  role = 'SUPER_ADMIN',
  "isActive" = true,
  "isSuperAdmin" = true
WHERE email = 'admin@test.com';

-- Show the updated user
SELECT id, email, name, "userType", role, "isActive", "isSuperAdmin"
FROM users
WHERE email = 'admin@test.com';
