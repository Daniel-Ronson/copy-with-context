import * as vscode from 'vscode';
import { copySelectionWithContextCommand, copySelectedCodeWithContextCommand } from './commands';
import { COMMAND_ID, SELECTED_CODE_COMMAND_ID } from './constants';

// Status bar item for showing temporary messages
let statusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100 // Priority (higher number = more to the left)
    );
    context.subscriptions.push(statusBarItem);

    console.log('"context-copy" extension is now active!');

    // Register the file selection copy command
    const copyCommandDisposable = vscode.commands.registerCommand(
        COMMAND_ID,
        (uri: vscode.Uri, allUris: vscode.Uri[]) => copySelectionWithContextCommand(uri, allUris, statusBarItem)
    );
    context.subscriptions.push(copyCommandDisposable);

    // Register the selected code copy command
    const selectedCodeCommandDisposable = vscode.commands.registerCommand(
        SELECTED_CODE_COMMAND_ID,
        () => copySelectedCodeWithContextCommand(statusBarItem)
    );
    context.subscriptions.push(selectedCodeCommandDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('"context-copy" extension is now deactivated.');
    // Perform any cleanup if necessary
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}