import * as vscode from 'vscode';

/**
 * Represents the outcome of attempting to process a single file.
 */
export type FileProcessResult =
    | {
        status: 'success';
        uri: vscode.Uri;
        relativePath: string;
        formattedContent: string; // Content ready to be concatenated
    }
    | {
        status: 'skipped_binary' | 'skipped_large' | 'skipped_directory' | 'error_reading';
        uri: vscode.Uri;
        relativePath: string; // Still useful for reporting
        reason: string; // Specific reason for skipping/error
    };

/**
 * Represents a file that was skipped during processing.
 */
export interface SkippedFile {
    relativePath: string;
    reason: 'binary' | 'too large' | 'directory' | 'read error';
}