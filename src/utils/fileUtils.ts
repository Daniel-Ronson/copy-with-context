// src/utils/fileUtils.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util'; // Node.js built-in
import { BINARY_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../constants';
import { fileExtensionToMarkdown, specialFilenames } from '../types/extensionToMarkdownMapping';
/**
 * Checks if a file path likely points to a binary file based on its extension.
 * @param filePath The full file path.
 * @returns True if the extension is in the BINARY_FILE_EXTENSIONS set, false otherwise.
 */
export function isBinaryFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return BINARY_FILE_EXTENSIONS.has(extension);
}

/**
 * Checks if a file exceeds the maximum allowed size.
 * @param stats vscode.FileStat object containing file metadata.
 * @returns True if the file size exceeds MAX_FILE_SIZE_BYTES, false otherwise.
 */
export function isLargeFile(stats: vscode.FileStat): boolean {
    return stats.size > MAX_FILE_SIZE_BYTES;
}

/**
 * Reads the content of a file URI as UTF-8 text.
 * @param uri The vscode.Uri of the file to read.
 * @returns The file content as a string, or null if reading fails.
 */
export async function readFileContent(uri: vscode.Uri): Promise<string | null> {
    try {
        const uint8Array = await vscode.workspace.fs.readFile(uri);
        // Node's TextDecoder is readily available in the extension host environment
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
    } catch (error) {
        console.error(`Error reading file ${uri.fsPath}:`, error);
        return null; // Return null to indicate failure
    }
}

/**
 * Gets the relative path of a URI with respect to the workspace folder.
 * Handles multi-root workspaces by choosing the most relevant workspace folder.
 * @param uri The vscode.Uri of the file.
 * @returns The relative path string.
 */
export function getRelativePath(uri: vscode.Uri): string {
    // workspace.asRelativePath handles finding the correct workspace folder.
    // The second argument `false` prevents adding './' for files in the root.
    const relativePath = vscode.workspace.asRelativePath(uri, false);

    // Normalize path separators for consistency (e.g., convert Windows '\' to '/')
    return relativePath.split(path.sep).join(path.posix.sep);
}

export function getMarkdownLanguage(filePath: string): string {
    const extension = path.extname(filePath);
    if (extension && fileExtensionToMarkdown[extension]) {
        return fileExtensionToMarkdown[extension];
    }

    // If there's no extension match, check if it's a special filename
    const fileName = path.basename(filePath);
    if (specialFilenames[fileName]) {
        return specialFilenames[fileName];
    }

    return "text";
}