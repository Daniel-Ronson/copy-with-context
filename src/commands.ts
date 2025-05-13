import * as vscode from 'vscode';
import {
    MAX_FILE_SIZE_BYTES,
    FILE_SEPARATOR,
    WARNING_PREFIX,
    SUCCESS_PREFIX,
    INFO_PREFIX,
    MAX_SKIPPED_FILES_TO_LIST,
    getExcludedFilesPatternGlob,
    getExcludedFilenames,
    MAX_FILES_TO_RECURSIVELY_GET
} from './constants';
import { isBinaryFile, isLargeFile, readFileContent, getRelativePath } from './utils/fileUtils';
import { formatFileContentBlock, formatSelectedCodeBlock } from './utils/formattingUtils';
import * as path from 'path'; // Ensure path is imported if needed elsewhere, though not strictly for this change
import { showTemporaryStatusBarMessage } from './utils/statusBarUtils';
import { processFile } from './fileprocessor';

interface ProcessedFile {
    uri: vscode.Uri;
    relativePath: string;
    status: 'ok' | 'skipped_binary' | 'skipped_large' | 'skipped_read_error' | 'skipped_directory' | 'skipped_ignored';
    content?: string; // Only present if status is 'ok'
}

/**
 * Processes a single URI: checks type, size, reads content if applicable.
 * @param uri The URI to process.
 * @returns A Promise resolving to a ProcessedFile object.
 */
async function processUri(uri: vscode.Uri): Promise<ProcessedFile> {
    try {
        const stats = await vscode.workspace.fs.stat(uri);
        const relativePath = getRelativePath(uri); // Get relative path early for reporting

        // if its directory, skipped_directory
        if (stats.type === vscode.FileType.Directory) {
            return { uri, relativePath, status: 'skipped_directory' };
        }

        // Check if the file is in the excluded list
        if (getExcludedFilenames().has(path.basename(uri.fsPath))) {
            return { uri, relativePath, status: 'skipped_ignored' };
        }

        if (isBinaryFile(uri.fsPath)) {
            return { uri, relativePath, status: 'skipped_binary' };
        }

        if (isLargeFile(stats)) {
            return { uri, relativePath, status: 'skipped_large' };
        }

        const content = await readFileContent(uri);
        if (content === null) {
            // readFileContent handles logging the specific error
            return { uri, relativePath, status: 'skipped_read_error' };
        }

        // Handle empty files correctly - they should be included
        return { uri, relativePath, status: 'ok', content };

    } catch (error) {
        // Catch errors during stat (e.g., file deleted after selection)
        console.error(`Error processing URI ${uri.fsPath}:`, error);
        // Attempt to get relative path even on error, might fail if workspace info is gone
        let relativePath = uri.fsPath;
        try { relativePath = getRelativePath(uri); } catch (_) {}
        return { uri, relativePath, status: 'skipped_read_error' };
    }
}

/**
 * Takes an array of selected URIs (files and folders) and returns a deduplicated
 * list of only the file URIs, expanding any selected folders.
 * @param selections Array of URIs from the explorer selection.
 * @returns A Promise resolving to an array of unique file URIs.
 */
async function getUniqueFileUrisFromSelection(selections: vscode.Uri[]): Promise<vscode.Uri[]> {
    const uniqueFileUrisMap = new Map<string, vscode.Uri>();
    const folderExpansionPromises: Promise<void>[] = [];
    const excludedFilenames = getExcludedFilenames();

    for (const uri of selections) {
        try {
            const stats = await vscode.workspace.fs.stat(uri);
            if (stats.type === vscode.FileType.Directory) {
                // If directory is in the excluded filenames, skip it
                if (excludedFilenames.has(path.basename(uri.fsPath))) {
                    continue;
                }
                // If it's a directory, find files within it
                const promise = vscode.workspace.findFiles(
                    new vscode.RelativePattern(uri, '**/*'),
                    getExcludedFilesPatternGlob(),
                    MAX_FILES_TO_RECURSIVELY_GET
                ).then(filesInDir => {
                    // Add files found in the directory to the map
                    filesInDir.forEach(fileUri => {
                        uniqueFileUrisMap.set(fileUri.fsPath, fileUri);
                    });
                });
                // Wrap the PromiseLike in Promise.resolve() to fix type mismatch
                folderExpansionPromises.push(Promise.resolve(promise));
            } else if (stats.type === vscode.FileType.File) {
                // If it's a file and not excluded, add it directly
                if (!excludedFilenames.has(path.basename(uri.fsPath))) {
                    uniqueFileUrisMap.set(uri.fsPath, uri);
                }
            }
            // Ignore other types like SymbolicLink, Unknown
        } catch (error) {
            console.warn(`Could not process ${uri.fsPath} during selection expansion:`, error);
        }
    }

    // Wait for all folder expansions to complete
    await Promise.all(folderExpansionPromises);

    // Return the unique file URIs as an array
    return Array.from(uniqueFileUrisMap.values());
}

/**
 * The command handler for "Context Copy: Copy Selection with Context".
 * Gathers selected files/folders, expands folders, filters, reads, formats, and copies to clipboard.
 * Shows appropriate notifications.
 *
 * @param _contextSelection The URI of the item right-clicked (often undefined for multi-select).
 * @param allSelections An array of all selected URIs in the explorer.
 * @param statusBarItem The status bar item to use for showing success messages.
 */
export async function copySelectionWithContextCommand(
    _contextSelection: vscode.Uri | undefined,
    allSelections: vscode.Uri[] | undefined,
    statusBarItem: vscode.StatusBarItem
): Promise<void> {
        // Give the UI thread a chance to update before potentially intensive operations
    await new Promise(resolve => setTimeout(resolve, 10));

    if (!allSelections || allSelections.length === 0) {
        let tempMessage = `${INFO_PREFIX}No files or folders selected`;
        showTemporaryStatusBarMessage(statusBarItem, tempMessage);
        return;
    }

    // --- Step 1: Get unique file URIs from the selection ---    
    const uniqueFileUris = await getUniqueFileUrisFromSelection(allSelections);

    if (uniqueFileUris.length === 0) {
        let tempMessage = `${INFO_PREFIX}No valid files found`;
        showTemporaryStatusBarMessage(statusBarItem, tempMessage);
        return;
    }

    // --- Step 2: Process the unique file URIs --- 
    const processingPromises = uniqueFileUris.map(uri => processUri(uri));
    const results = await Promise.all(processingPromises);

    // --- Step 3: Separate successful and skipped files --- 
    const successfulFiles: ProcessedFile[] = [];
    const skippedFiles: ProcessedFile[] = [];

    results.forEach(result => {
        if (result.status === 'ok') {
            successfulFiles.push(result);
        } else if (result.status !== 'skipped_directory') {
            // We only report non-directory skips
            skippedFiles.push(result);
        }
        // Directories are silently ignored as per spec
    });

    if (successfulFiles.length === 0) {
        let tempMessage = `${INFO_PREFIX}No valid text files found in selection to copy.`;
        if (skippedFiles.length > 0) {
            tempMessage += ` Skipped ${skippedFiles.length} file(s) due to size, type, or errors.`;
        }
        showTemporaryStatusBarMessage(statusBarItem, tempMessage);
        return;
    }

    // Format the content blocks for successful files
    const formattedBlocks = successfulFiles
        .map(file => formatFileContentBlock(file.relativePath, file.content!))
        .filter(block => block.length > 0); // Remove any empty blocks

    // Only copy to clipboard if there are formatted blocks
    if (formattedBlocks.length > 0) {
        // Join blocks and copy to clipboard
        const finalContent = formattedBlocks.join(FILE_SEPARATOR);
        await vscode.env.clipboard.writeText(finalContent);

        // Show success message in status bar
        const successMsg = `Copied content of ${formattedBlocks.length} file(s) to clipboard`;
        showTemporaryStatusBarMessage(statusBarItem, successMsg);
    } else {
        // Show message that nothing was copied
        let tempMessage = `${INFO_PREFIX}No content was copied to clipboard.`;
        showTemporaryStatusBarMessage(statusBarItem, tempMessage);
    }

    // Show warning message if any files were skipped
    if (skippedFiles.length > 0) {
        const skippedPaths = skippedFiles.map(f => f.relativePath);
        const listedPaths = skippedPaths.slice(0, MAX_SKIPPED_FILES_TO_LIST).join(', ');
        const ellipsis = skippedPaths.length > MAX_SKIPPED_FILES_TO_LIST ? '...' : '';

        const reasonCounts: Record<string, number> = { large: 0, binary: 0, error: 0 , ignored: 0};
        skippedFiles.forEach(f => {
            if (f.status === 'skipped_large')
                {
                    reasonCounts.large++;
                } 
            else if (f.status === 'skipped_binary')
                {
                     reasonCounts.binary++;
                }
            else if (f.status === 'skipped_read_error')
                {
                     reasonCounts.error++;
                }
            else if (f.status === 'skipped_ignored')
                {
                    reasonCounts.ignored++;
                }
        });

        const reasonSummary = [
            reasonCounts.large > 0 ? `${reasonCounts.large} large` : '',
            reasonCounts.binary > 0 ? `${reasonCounts.binary} binary` : '',
            reasonCounts.error > 0 ? `${reasonCounts.error} unreadable/error` : ''
        ].filter(Boolean).join(', ');


        const warningMsg = `${WARNING_PREFIX}Skipped ${skippedFiles.length} file(s) (${reasonSummary}): ${listedPaths}${ellipsis}`;
    }
}

/**
 * The command handler for copying selected code with context.
 * Gets the active editor's selection, formats it with context, and copies to clipboard.
 * Shows appropriate notifications.
 *
 * @param statusBarItem The status bar item to use for showing success messages.
 */
export async function copySelectedCodeWithContextCommand(
    statusBarItem: vscode.StatusBarItem
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        showTemporaryStatusBarMessage(statusBarItem, `${INFO_PREFIX}No active editor`);
        return;
    }

    const selection = editor.selection;
    
    if (selection.isEmpty) {
        showTemporaryStatusBarMessage(statusBarItem, `${INFO_PREFIX}No text selected`);
        return;
    }

    // Capture line numbers at command time (1-based)
    const lineNumbers = {
        start: selection.start.line + 1,
        end: selection.end.line + 1,
    };

    // Use the updated formatSelectedCodeBlock
    const formatted = formatSelectedCodeBlock(editor, selection, lineNumbers);

    if (formatted) {
        await vscode.env.clipboard.writeText(formatted);
        showTemporaryStatusBarMessage(statusBarItem, `${SUCCESS_PREFIX}Copied selected code with context`);
    } else {
        showTemporaryStatusBarMessage(statusBarItem, `${INFO_PREFIX}No text selected`);
    }
}