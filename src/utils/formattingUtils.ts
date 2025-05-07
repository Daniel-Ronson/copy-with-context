import * as vscode from 'vscode';


/**
 * Formats the file path and content into the specified code-fenced block.
 * ```[<relative/path/to/file>]
 * <file-content>
 * ```
 * @param relativePath The relative path of the file.
 * @param content The content of the file.
 * @returns The formatted string block or empty string if content is empty.
 */
export function formatFileContentBlock(relativePath: string, content: string): string {
    // Skip creating a block if content is empty
    if (!content || !content.trim()) {
        return '';
    }
    
    // Ensure the path doesn't contain characters that might break the fence or markdown
    const cleanPath = relativePath.replace(/`/g, ''); // Basic sanitization for backticks in path
    
    // Trim trailing newlines efficiently
    const trimmedContent = trimTrailingNewlines(content);
    
    return `\`\`\`[${cleanPath}]\n${trimmedContent}\n\`\`\``;
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
    
    // Skip if the selected text is empty
    if (!selectedText.trim()) {
        return '';
    }
        
    // Clean the path to avoid breaking markdown
    const cleanPath = relativePath.replace(/`/g, '');
    
    // Trim trailing newlines efficiently
    const trimmedText = trimTrailingNewlines(selectedText);
    
    return `\`\`\`[${cleanPath}]\n${trimmedText}\n\`\`\``;
}

/**
 * Efficiently trims trailing whitespace from a string by working from the end.
 * @param str The string to trim
 * @returns The string with trailing whitespace removed
 */
function trimTrailingNewlines(str: string): string {
    if (!str) {
        return '';
    }
    
    let endIndex = str.length - 1;
    // Work backwards until we find a non-whitespace character
    while (endIndex >= 0) {
        const char = str[endIndex];
        if (char !== '\n' && char !== '\r' && char !== '\t' && char !== ' ') {
            break;
        }
        endIndex--;
    }
    
    // If there was trailing whitespace, slice the string
    return endIndex < str.length - 1 ? str.slice(0, endIndex + 1) : str;
}