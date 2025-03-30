import * as vscode from 'vscode';
import { copySelectionWithContextCommand } from './commands';
import { COMMAND_ID } from './constants';

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

    // Register the command specified in package.json
	const disposable = vscode.commands.registerCommand('copy-with-context.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('HI! Hello World from Copy With Context!');
	});

    const copyCommandDisposable = vscode.commands.registerCommand(
        COMMAND_ID,
        (uri: vscode.Uri, allUris: vscode.Uri[]) => copySelectionWithContextCommand(uri, allUris, statusBarItem)
    );
    // Add the command disposable to the context's subscriptions
    context.subscriptions.push(copyCommandDisposable);
    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('"context-copy" extension is now deactivated.');
    // Perform any cleanup if necessary
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}