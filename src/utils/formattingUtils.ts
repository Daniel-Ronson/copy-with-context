import * as vscode from 'vscode';

/**
 * Formats the file path and content into the specified code-fenced block.
 * ```[<relative/path/to/file>]
 * <file-content>
 * ```
 * @param relativePath The relative path of the file.
 * @param content The content of the file.
 * @returns The formatted string block.
 */
export function formatFileContentBlock(relativePath: string, content: string): string {
    // Ensure the path doesn't contain characters that might break the fence or markdown
    const cleanPath = relativePath.replace(/`/g, ''); // Basic sanitization for backticks in path

    return `\`\`\`[${cleanPath}]\n${content}\n\`\`\``;
}

/**
 * Formats selected code with context from the active editor.
 * @param editor The active text editor.
 * @param selection The selection to format.
 * @returns The formatted string block with file path and selected code.
 */
export function formatSelectedCodeBlock(editor: vscode.TextEditor, selection: vscode.Selection): string {
    const document = editor.document;
    const relativePath = vscode.workspace.asRelativePath(document.uri, false);
    const selectedText = document.getText(selection);
        
    // Clean the path to avoid breaking markdown
    const cleanPath = relativePath.replace(/`/g, '');    
    return `\`\`\`[${cleanPath}]\n${selectedText}\n\`\`\``;
}