// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';
import { createFilePick, goUpDirectory, selectItem, FileData } from './ido';

export type ContextType = {
    input: vscode.QuickPick<FileData> | null;
    cwd: string;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-ido" is now active!');

    const ctx: ContextType = { cwd: '', input: null };

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const idoCommand = vscode.commands.registerCommand('extension.ido', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello Code!');

        // const editor: vscode.TextEditor = vscode.window.activeTextEditor;
        const workspaceFolder: string | undefined = vscode.workspace.rootPath;
        let dir = workspaceFolder;
        if (!dir) {
            dir = os.homedir();
        }

        createFilePick(ctx, dir);

        vscode.commands.executeCommand('setContext', 'idoMode', true);
    });
    context.subscriptions.push(idoCommand);

    const goUpDirectoryCommand = vscode.commands.registerCommand(
        'extension.ido-go-up-directory',
        () => {
            if (!ctx.input) {
                return;
            }
            goUpDirectory(ctx);
        }
    );
    context.subscriptions.push(goUpDirectoryCommand);

    const selectItemCommand = vscode.commands.registerCommand(
        'extension.ido-select-item',
        () => {
            if (!ctx.input) {
                return;
            }
            selectItem(ctx);
        }
    );
    context.subscriptions.push(selectItemCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
    vscode.commands.executeCommand('setContext', 'idoMode', false);
}
