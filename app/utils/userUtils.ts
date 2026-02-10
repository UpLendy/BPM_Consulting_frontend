/**
 * Utility functions for user data formatting
 */

/**
 * Formats a user's full name, hiding the last name if it's a year (2024, 2025, 2026, etc.)
 * This handles cases where the last name was left empty and the backend stored the current year
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name (may be a year like "2026")
 * @returns Formatted full name without year if applicable
 */
export function formatUserFullName(firstName: string, lastName: string): string {
  if (!firstName) return '';
  
  // Check if lastName is a 4-digit year (2020-2099)
  const isYear = /^20\d{2}$/.test(lastName?.trim());
  
  if (isYear || !lastName) {
    return firstName.trim();
  }
  
  return `${firstName.trim()} ${lastName.trim()}`;
}

/**
 * Gets the display name for a user (first name only if last name is a year)
 * 
 * @param user - User object with first_name and last_name properties
 * @returns Formatted display name
 */
export function getUserDisplayName(user: { first_name?: string; last_name?: string; firstName?: string; lastName?: string }): string {
  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  
  return formatUserFullName(firstName, lastName);
}
