import * as path from 'path';

// File size limit: 5MB (adjust as needed)
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Set of common binary file extensions (lowercase) for efficient lookup
export const BINARY_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    // Images & Design Assets
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico',
    '.psd', '.ai', '.xd', '.sketch',

    // Archives & Packages
    '.zip', '.tar', '.gz', '.7z', '.rar', '.jar', '.apk', '.aab', '.nupkg',

    // Executables & Libraries
    '.exe', '.dll', '.so', '.a', '.o', '.obj', '.lib', '.node', '.out', '.msi', '.dmg', '.app',

    // Fonts
    '.woff', '.woff2', '.ttf', '.otf', '.eot', '.ttc',

    // Media (Audio/Video)
    '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.webm',

    // Bytecode / Compiled Files
    '.class', '.dex', '.pyc', '.pyo', '.pyd', '.rbc', '.beam', '.elc',

    // Databases & Binary Data
    '.db', '.sqlite', '.bin', '.pdb',

    // Temporary / System / Metadata
    '.log', '.bak', '.tmp', '.temp', '.swp', '.swo', '.DS_Store', '.thumbs', '.lock', '.crdownload', '.part',

    // Application Bundles / Installers
    '.vsix', '.msi', '.app', '.dmg', '.pkg', '.snap', '.flatpak',
    '.deb', '.rpm', '.apk', '.aab', '.appx', '.xapk',
    '.egg', '.whl', '.crate'
]);


// Separator between formatted file blocks in the final output
export const FILE_SEPARATOR = '\n\n';

// Command IDs registered in package.json
export const COMMAND_ID = 'contextCopy.copySelectionWithContextCommand';
export const SELECTED_CODE_COMMAND_ID = 'contextCopy.copySelectedCodeWithContextCommand';

// User-facing extension name for messages
export const EXTENSION_NAME = 'Context Copy';

/**
 * Prefix for the warning message shown when files are skipped.
 */
export const WARNING_PREFIX = 'Context Copy: ';

/**
 * Prefix for the success message shown after copying.
 */
export const SUCCESS_PREFIX = 'Context Copy: ';

/**
 * Prefix for the info message shown when no valid files are found.
 */
export const INFO_PREFIX = 'Context Copy: ';

/**
 * Maximum number of skipped filenames to list in the warning message.
 */
export const MAX_SKIPPED_FILES_TO_LIST = 5;

/**
 * List of files and directories to exclude when searching
 * Items without slashes are treated as file/directory names to exclude anywhere in the path
 * Items with slashes are treated as specific path patterns
 */
export const EXCLUDED_ITEMS: ReadonlyArray<string> = [
    '.git',
    'node_modules',
    'out',
    'dist',
    '.env',
    '.vercel',
    '.next',
    '.vscode-test'
] as const;

/**
 * Builds a glob pattern for excluding files and directories
 * For items without slashes: excludes the item anywhere in the path
 * For items with slashes: excludes according to the specific path pattern
 */
function buildExcludeGlob(excludeList: ReadonlyArray<string>): string {
    const patterns = excludeList.map(item => `**/${item},**/${item}/**`);
    return `{${patterns.join(',')}}`;
}

export const EXCLUDED_FILES_PATTERN_GLOB = buildExcludeGlob(EXCLUDED_ITEMS);

export const EXCLUDED_FILENAMES: ReadonlySet<string> = new Set(
    EXCLUDED_ITEMS.map(item => path.basename(item)) // Extract only the filename from each path
);

export const MAX_FILES_TO_RECURSIVELY_GET = 500;