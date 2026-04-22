/**
 * Folder Name Sanitizer Utility
 *
 * Ensures folder names comply with OneDrive and Windows naming conventions.
 *
 * OneDrive/Windows Invalid Characters:
 * - \ / : * ? " < > |
 * - Leading or trailing spaces
 * - Leading or trailing periods
 * - Reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 */

/**
 * Sanitize folder name for OneDrive and Windows compatibility
 *
 * @param name - Original folder name
 * @returns Sanitized folder name
 */
export function sanitizeFolderName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Unnamed';
  }

  let sanitized = name;

  // 1. Replace invalid characters with underscores
  // Invalid chars: \ / : * ? " < > |
  sanitized = sanitized.replace(/[\\/:*?"<>|]/g, '_');

  // 2. Remove leading/trailing spaces
  sanitized = sanitized.trim();

  // 3. Remove leading/trailing periods
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');

  // 4. Replace multiple consecutive spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // 5. Replace multiple consecutive underscores with single underscore
  sanitized = sanitized.replace(/_+/g, '_');

  // 6. Check for Windows reserved names
  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  const upperName = sanitized.toUpperCase();
  if (reserved.includes(upperName)) {
    sanitized = `${sanitized}_Folder`;
  }

  // 7. Ensure name is not empty after sanitization
  if (!sanitized || sanitized.trim() === '') {
    sanitized = 'Unnamed_Folder';
  }

  // 8. Limit length to 255 characters (Windows/OneDrive limit)
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
    // Remove trailing underscore if truncation created one
    sanitized = sanitized.replace(/_+$/, '');
  }

  return sanitized;
}

/**
 * Sanitize task folder name (includes task code prefix)
 *
 * Format: {taskCode} {taskTitle}
 * Example: AT0001 Magnetic Separation Trial
 *
 * @param taskCode - Task code (e.g., AT0001)
 * @param taskTitle - Task title
 * @returns Sanitized task folder name
 */
export function sanitizeTaskFolderName(taskCode: string, taskTitle: string): string {
  const sanitizedTitle = sanitizeFolderName(taskTitle);
  return `${taskCode} ${sanitizedTitle}`;
}

/**
 * Validate if folder name is valid for OneDrive/Windows
 *
 * @param name - Folder name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateFolderName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Folder name is required' };
  }

  // Check for invalid characters
  if (/[\\/:*?"<>|]/.test(name)) {
    return {
      isValid: false,
      error: 'Folder name contains invalid characters: \\ / : * ? " < > |'
    };
  }

  // Check for leading/trailing spaces or periods
  if (name !== name.trim()) {
    return {
      isValid: false,
      error: 'Folder name cannot have leading or trailing spaces'
    };
  }

  if (/^\.+|\.+$/.test(name)) {
    return {
      isValid: false,
      error: 'Folder name cannot have leading or trailing periods'
    };
  }

  // Check for reserved names
  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  if (reserved.includes(name.toUpperCase())) {
    return {
      isValid: false,
      error: `Folder name "${name}" is a Windows reserved name`
    };
  }

  // Check length
  if (name.length > 255) {
    return {
      isValid: false,
      error: 'Folder name exceeds 255 characters limit'
    };
  }

  return { isValid: true };
}

/**
 * Examples of usage:
 *
 * sanitizeFolderName("Test*Project?Name")    → "Test_Project_Name"
 * sanitizeFolderName("My:Folder/Path")       → "My_Folder_Path"
 * sanitizeFolderName("  Leading Spaces  ")   → "Leading Spaces"
 * sanitizeFolderName(".hidden.folder.")      → "hidden.folder"
 * sanitizeFolderName("CON")                  → "CON_Folder"
 * sanitizeFolderName("Multi   Spaces")       → "Multi Spaces"
 *
 * sanitizeTaskFolderName("AT0001", "Test*Work?") → "AT0001 Test_Work_"
 *
 * validateFolderName("Valid Folder")         → { isValid: true }
 * validateFolderName("Invalid:Folder")       → { isValid: false, error: "..." }
 */
