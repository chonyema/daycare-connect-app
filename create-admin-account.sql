-- Create or update Super Admin account
INSERT INTO users (id, email, name, password, "userType", role, "isActive", "isSuperAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@prod.com',
  'Super Admin',
  '$2b$10$7FpCFM22AYo8wU30HSRp0ezqT0CnzZlcg7UG4ta5FyGuEWYb6q.16',
  'ADMIN',
  'SUPER_ADMIN',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  password = '$2b$10$7FpCFM22AYo8wU30HSRp0ezqT0CnzZlcg7UG4ta5FyGuEWYb6q.16',
  role = 'SUPER_ADMIN',
  "isActive" = true,
  "isSuperAdmin" = true,
  "updatedAt" = NOW();
