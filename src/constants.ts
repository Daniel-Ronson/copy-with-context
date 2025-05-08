import * as path from 'path';
import * as vscode from 'vscode';

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
 * Default list of files and directories to exclude when searching
 * This is used as a fallback if settings cannot be accessed
 */
export const DEFAULT_EXCLUDED_ITEMS: ReadonlyArray<string> = [
    '.git',
    'node_modules',
    'out',
    'dist',
    '.env',
    '.vercel',
    '.next',
    '.vscode-test'
] as const;

// Cache storage for expensive operations
interface ExclusionCache {
    excludedItems: ReadonlyArray<string> | null;
    excludedFilesPatternGlob: string | null;
    excludedFilenames: ReadonlySet<string> | null;
}

// Initialize cache with null values
const cache: ExclusionCache = {
    excludedItems: null,
    excludedFilesPatternGlob: null,
    excludedFilenames: null
};

/**
 * Initialize configuration watcher to invalidate cache when settings change
 * Should be called from the extension's activate function
 */
export function initConfigWatcher(context: vscode.ExtensionContext): void {
    // Add a listener for configuration changes
    const configListener = vscode.workspace.onDidChangeConfiguration(event => {
        // If the excluded paths setting changed, invalidate the cache
        if (event.affectsConfiguration('copyWithContext.excludedPaths')) {
            invalidateCache();
        }
    });
    
    // Register the listener for cleanup on deactivate
    context.subscriptions.push(configListener);
}

/**
 * Invalidate the cache when settings change
 */
export function invalidateCache(): void {
    cache.excludedItems = null;
    cache.excludedFilesPatternGlob = null;
    cache.excludedFilenames = null;
    }

/**
 * Get the current excluded items from user settings
 * Falls back to DEFAULT_EXCLUDED_ITEMS if settings can't be accessed
 * Uses cached value if available
 */
export function getExcludedItems(): ReadonlyArray<string> {
    // Return cached value if available
    if (cache.excludedItems !== null) {
        return cache.excludedItems;
    }

    try {
        const config = vscode.workspace.getConfiguration('copyWithContext');
        const excludedItems = config.get('excludedPaths', DEFAULT_EXCLUDED_ITEMS) as ReadonlyArray<string>;
        
        // Cache the result
        cache.excludedItems = excludedItems;
        return excludedItems;
    } catch (error) {
        // If we can't access the configuration (e.g., during tests or initialization)
        // fall back to the default excluded items
        cache.excludedItems = DEFAULT_EXCLUDED_ITEMS;
        return DEFAULT_EXCLUDED_ITEMS;
    }
}

/**
 * Builds a glob pattern for excluding files and directories
 * For items without slashes: excludes the item anywhere in the path
 * For items with slashes: excludes according to the specific path pattern
 */
function buildExcludeGlob(excludeList: ReadonlyArray<string>): string {
    const patterns = excludeList.map(item => `**/${item},**/${item}/**`);
    return `{${patterns.join(',')}}`;
}

/**
 * Get the excluded files pattern glob based on current settings
 * Uses cached value if available
 */
export function getExcludedFilesPatternGlob(): string {
    // Return cached value if available
    if (cache.excludedFilesPatternGlob !== null) {
        return cache.excludedFilesPatternGlob;
    }

    const glob = buildExcludeGlob(getExcludedItems());
    
    // Cache the result
    cache.excludedFilesPatternGlob = glob;
    return glob;
}

/**
 * Get the excluded filenames set based on current settings
 * Uses cached value if available
 */
export function getExcludedFilenames(): ReadonlySet<string> {
    // Return cached value if available
    if (cache.excludedFilenames !== null) {
        return cache.excludedFilenames;
    }

    const filenames = new Set(
        getExcludedItems().map(item => path.basename(item)) // Extract only the filename from each path
    );
    
    // Cache the result
    cache.excludedFilenames = filenames;
    return filenames;
}

export const MAX_FILES_TO_RECURSIVELY_GET = 5000;