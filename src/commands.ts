import * as vscode from 'vscode';
import {
    MAX_FILE_SIZE_BYTES,
    FILE_SEPARATOR,
    WARNING_PREFIX,
    SUCCESS_PREFIX,
    INFO_PREFIX,
    MAX_SKIPPED_FILES_TO_LIST
} from './constants';
import { isBinaryFile, isLargeFile, readFileContent, getRelativePath } from './utils/fileUtils';
import { formatFileContentBlock } from './utils/formattingUtils';

interface ProcessedFile {
    uri: vscode.Uri;
    relativePath: string;
    status: 'ok' | 'skipped_binary' | 'skipped_large' | 'skipped_read_error' | 'skipped_directory';
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

        if (stats.type === vscode.FileType.Directory) {
            return { uri, relativePath, status: 'skipped_directory' };
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
 * The command handler for "Context Copy: Copy Selection with Context".
 * Gathers selected files, filters, reads, formats, and copies to clipboard.
 * Shows appropriate notifications.
 *
 * @param _contextSelection The URI of the item right-clicked (often undefined for multi-select).
 * @param allSelections An array of all selected URIs in the explorer.
 */
export async function copySelectionWithContextCommand(
    _contextSelection: vscode.Uri | undefined,
    allSelections: vscode.Uri[] | undefined
): Promise<void> {

    if (!allSelections || allSelections.length === 0) {
        vscode.window.showInformationMessage(`${INFO_PREFIX}No files or folders selected.`);
        return;
    }

    // Process all selected URIs concurrently
    const processingPromises = allSelections.map(uri => processUri(uri));
    const results = await Promise.all(processingPromises);

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
        let message = `${INFO_PREFIX}No valid text files found in selection to copy.`;
        if (skippedFiles.length > 0) {
             message += ` Skipped ${skippedFiles.length} file(s) due to size, type, or errors.`;
        }
        vscode.window.showWarningMessage(message);
        return;
    }

    // Format the content blocks for successful files
    const formattedBlocks = successfulFiles.map(file =>
        formatFileContentBlock(file.relativePath, file.content!) // content is guaranteed if status is 'ok'
    );

    // Join blocks and copy to clipboard
    const finalContent = formattedBlocks.join(FILE_SEPARATOR);
    await vscode.env.clipboard.writeText(finalContent);

    // Show success message
    const successMsg = `${SUCCESS_PREFIX}Copied content of ${successfulFiles.length} file(s) to clipboard.`;
    vscode.window.showInformationMessage(successMsg); // Use info for success

    // Show warning message if any files were skipped
    if (skippedFiles.length > 0) {
        const skippedPaths = skippedFiles.map(f => f.relativePath);
        const listedPaths = skippedPaths.slice(0, MAX_SKIPPED_FILES_TO_LIST).join(', ');
        const ellipsis = skippedPaths.length > MAX_SKIPPED_FILES_TO_LIST ? '...' : '';

        const reasonCounts: Record<string, number> = { large: 0, binary: 0, error: 0 };
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
        });

        const reasonSummary = [
            reasonCounts.large > 0 ? `${reasonCounts.large} large` : '',
            reasonCounts.binary > 0 ? `${reasonCounts.binary} binary` : '',
            reasonCounts.error > 0 ? `${reasonCounts.error} unreadable/error` : ''
        ].filter(Boolean).join(', ');


        const warningMsg = `${WARNING_PREFIX}Skipped ${skippedFiles.length} file(s) (${reasonSummary}). Examples: ${listedPaths}${ellipsis}`;
        vscode.window.showWarningMessage(warningMsg);
    }
}