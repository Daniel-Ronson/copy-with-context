import * as vscode from 'vscode';

let currentTimeout: NodeJS.Timeout | undefined;

/**
 * Shows a message in the status bar that automatically hides after a specified duration.
 * If called while a previous message is showing, the previous message is cleared.
 * @param statusBarItem The status bar item to use for displaying the message
 * @param message The message to display (without icon prefix)
 * @param durationMs How long to show the message (in milliseconds), defaults to 2500
 * @returns void
 */
export function showTemporaryStatusBarMessage(
    statusBarItem: vscode.StatusBarItem | undefined,
    message: string,
    durationMs: number = 5000
): void {
    try {
        // If no status bar item provided, fall back to window notification
        if (!statusBarItem) {
            vscode.window.showInformationMessage(message);
            return;
        }

        // Clear any existing timeout
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }

        // Set the text with a checkmark icon
        statusBarItem.text = `$(check) ${message}`;
        statusBarItem.show();

        // Schedule hiding
        currentTimeout = setTimeout(() => {
            try {
                if (statusBarItem) {
                    statusBarItem.hide();
                }
            } catch (error) {
                console.warn('Error hiding status bar item:', error);
            }
            currentTimeout = undefined;
        }, durationMs);
    } catch (error) {
        // If status bar operations fail, fall back to window notification do nothing
        // log to dev debug console
        console.debug('Error showing copy-contextstatus bar message:', error);
    }
} 