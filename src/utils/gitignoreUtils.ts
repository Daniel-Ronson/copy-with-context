import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Reads the .gitignore file and returns an array of glob patterns
 * @returns Array of glob patterns from .gitignore, or empty array if no .gitignore found
 */
export async function getGitignorePatterns(): Promise<string[]> {
    try {
        // Try to find .gitignore in the first workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const gitignorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');
        const gitignoreUri = vscode.Uri.file(gitignorePath);

        // Read the .gitignore file
        const content = await vscode.workspace.fs.readFile(gitignoreUri);
        const text = Buffer.from(content).toString('utf8');

        // Parse the patterns
        return text
            .split('\n')
            .map(line => line.trim())
            // Remove comments and empty lines
            .filter(line => line && !line.startsWith('#'))
            // Convert .gitignore patterns to glob patterns
            .map(pattern => {
                // Remove any leading ./
                pattern = pattern.replace(/^\.\//, '');
                
                // If pattern starts with /, it matches from the root
                if (pattern.startsWith('/')) {
                    pattern = pattern.slice(1);
                }

                // If pattern ends with /, it's a directory
                if (pattern.endsWith('/')) {
                    pattern = pattern + '**';
                }

                // If pattern doesn't include a slash, match it anywhere
                if (!pattern.includes('/')) {
                    pattern = `**/${pattern}`;
                }

                // Add ** suffix for directories if not already present
                if (!pattern.endsWith('**')) {
                    pattern = `${pattern}/**`;
                }

                return pattern;
            });
    } catch (error) {
        // If .gitignore doesn't exist or can't be read, return empty array
        console.log('No .gitignore found or error reading it:', error);
        return [];
    }
} 