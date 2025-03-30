// src/utils/formattingUtils.ts

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