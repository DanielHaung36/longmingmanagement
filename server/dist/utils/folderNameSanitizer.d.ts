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
export declare function sanitizeFolderName(name: string): string;
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
export declare function sanitizeTaskFolderName(taskCode: string, taskTitle: string): string;
/**
 * Validate if folder name is valid for OneDrive/Windows
 *
 * @param name - Folder name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export declare function validateFolderName(name: string): {
    isValid: boolean;
    error?: string;
};
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
//# sourceMappingURL=folderNameSanitizer.d.ts.map