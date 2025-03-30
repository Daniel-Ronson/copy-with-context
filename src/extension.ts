// filename: src/extension.ts
import * as vscode from 'vscode';
import { copySelectionWithContextCommand } from './commands';
import { COMMAND_ID } from './constants';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('"context-copy" extension is now active!');

    // Register the command specified in package.json
    const copyCommandDisposable = vscode.commands.registerCommand(COMMAND_ID, copySelectionWithContextCommand);

	const disposable = vscode.commands.registerCommand('copy-with-context.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('HI! Hello World from Copy With Context!');
	});

    // Add the command disposable to the context's subscriptions
    // This ensures the command is cleaned up when the extension is deactivated
    context.subscriptions.push(copyCommandDisposable);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('"context-copy" extension is now deactivated.');
    // Perform any cleanup if necessary
}