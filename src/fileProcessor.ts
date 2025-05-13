// Contains the logic to handle a single file URI.

import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util'; // Node.js built-in
import { MAX_FILE_SIZE_BYTES, BINARY_FILE_EXTENSIONS } from './constants';
import { FileProcessResult } from './types/types';
import { getMarkdownLanguage } from './utils/fileUtils';

/**
 * Formats the file content with the specified code fence and relative path header.
 * @param relativePath - The relative path of the file.
 * @param content - The text content of the file.
 * @returns The formatted string block.
 */
function formatFileContent(relativePath: string, content: string): string {
    // Normalize path separators for display consistency (e.g., always use '/')
    const displayPath = relativePath.split(path.sep).join('/');
    const lang = getMarkdownLanguage(relativePath);
    return `#### ${displayPath}\n\`\`\`${lang}\n${content}\n\`\`\``;
}

/**
 * Processes a single file URI: checks type, size, reads content, and formats it.
 * @param uri - The vscode.Uri of the file to process.
 * @returns A Promise resolving to a FileProcessResult.
 */
export async function processFile(uri: vscode.Uri): Promise<FileProcessResult> {
    let relativePath: string;
    try {
        // Use workspace.asRelativePath to handle multi-root workspaces correctly
        relativePath = vscode.workspace.asRelativePath(uri, false); // `false` prevents adding workspace folder name if single root

        const stats = await vscode.workspace.fs.stat(uri);

        // 1. Check if it's a directory
        if (stats.type === vscode.FileType.Directory) {
            return {
                status: 'skipped_directory',
                uri,
                relativePath,
                reason: 'Item is a directory.',
            };
        }

        // 2. Check for binary file extensions
        const extension = path.extname(uri.fsPath).toLowerCase();
        if (BINARY_FILE_EXTENSIONS.has(extension)) {
            return {
                status: 'skipped_binary',
                uri,
                relativePath,
                reason: `Skipped binary file type (${extension}).`,
            };
        }

        // 3. Check file size
        if (stats.size > MAX_FILE_SIZE_BYTES) {
            return {
                status: 'skipped_large',
                uri,
                relativePath,
                reason: `File size (${(stats.size / (1024 * 1024)).toFixed(2)} MB) exceeds limit (${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(2)} MB).`,
            };
        }

        // 4. Read file content (asynchronously)
        const contentUint8Array = await vscode.workspace.fs.readFile(uri);
        const content = new TextDecoder('utf-8').decode(contentUint8Array); // Specify encoding

        // 5. Format the content
        const formattedContent = formatFileContent(relativePath, content);

        return {
            status: 'success',
            uri,
            relativePath,
            formattedContent,
        };

    } catch (error: any) {
        // Try to get a relative path even on error, if possible (might fail if URI is invalid)
        try {
            relativePath = vscode.workspace.asRelativePath(uri, false);
        } catch {
            relativePath = uri.fsPath; // Fallback to full path if relative fails
        }
        console.error(`Error processing file ${relativePath}:`, error);
        return {
            status: 'error_reading',
            uri,
            relativePath,
            reason: `Error reading file: ${error.message || 'Unknown error'}`,
        };
    }
}