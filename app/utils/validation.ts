// Validation utility functions

/**
 * Validates email format using a standard regex pattern
 * @param email - The email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns object with isValid boolean and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  return { isValid: true };
}

/**
 * Validates phone number format (basic validation)
 * @param phone - The phone number to validate
 * @returns true if phone is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validates name format (no numbers, special characters)
 * @param name - The name to validate
 * @returns true if name is valid, false otherwise
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) {
    return false;
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name.trim());
}