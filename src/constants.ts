// filename: src/constants.ts

// File size limit: 5MB (adjust as needed)
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Set of common binary file extensions (lowercase) for efficient lookup
export const BINARY_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico', // Images
    '.pdf',
    '.zip', '.tar', '.gz', '.7z', '.rar', // Archives
    '.exe', '.dll', '.so', '.a', '.o', // Executables/Libraries
    '.woff', '.woff2', '.ttf', '.otf', '.eot', // Fonts
    '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.webm', // Media
    '.class', // Java bytecode
    '.pyc', // Python bytecode
    '.DS_Store' // macOS metadata
]);

// Separator between formatted file blocks in the final output
export const OUTPUT_SEPARATOR = '\n\n';

// Command ID registered in package.json
export const COMMAND_ID = 'contextCopy.copySelection';

// User-facing extension name for messages
export const EXTENSION_NAME = 'Context Copy';