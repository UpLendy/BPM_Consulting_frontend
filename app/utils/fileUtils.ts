/**
 * Formats a file name by replacing underscores with spaces and capitalizing words
 * @param fileName - The file name to format
 * @returns Formatted file name
 */
export function formatFileName(fileName: string): string {
    if (!fileName) return '';

    // Remove file extension if present
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

    // Replace underscores and hyphens with spaces
    const withSpaces = nameWithoutExt.replace(/[_-]/g, ' ');

    // Capitalize first letter of each word
    const capitalized = withSpaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return capitalized;
}

/**
 * Gets the file extension from a file name
 * @param fileName - The file name
 * @returns File extension with dot (e.g., '.pdf') or empty string
 */
export function getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const match = fileName.match(/\.[^/.]+$/);
    return match ? match[0] : '';
}

/**
 * Formats a file name with extension
 * @param fileName - The file name to format
 * @returns Formatted file name with extension
 */
export function formatFileNameWithExtension(fileName: string): string {
    if (!fileName) return '';

    const formatted = formatFileName(fileName);
    const extension = getFileExtension(fileName);

    return formatted + extension;
}
