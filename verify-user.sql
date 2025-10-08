-- Verify the user has all RBAC fields and correct values
SELECT
  id,
  email,
  name,
  "userType",
  role,
  "isActive",
  "isSuperAdmin",
  permissions,
  "daycareId"
FROM users
WHERE email = 'admin@test.com';
