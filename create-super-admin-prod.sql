-- Update user to Super Admin
UPDATE users
SET
  role = 'SUPER_ADMIN',
  "isActive" = true,
  "isSuperAdmin" = true
WHERE email = 'admin@prod.com';
