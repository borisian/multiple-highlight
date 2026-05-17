import * as vscode from 'vscode';
import { HighlightController } from './highlightController';

let controller: HighlightController | undefined;

export function activate(context: vscode.ExtensionContext) {
	controller = new HighlightController(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('multipleHighlight.toggleAutoHighlight', () => {
			const enabled = controller?.toggleAutoHighlight() ?? false;
			vscode.window.showInformationMessage(`MultipleHighlight auto-highlight ${enabled ? 'enabled' : 'disabled'}.`);
		}),
		vscode.commands.registerCommand('multipleHighlight.clearHighlights', () => {
			controller?.clearHighlights();
		}),
		vscode.commands.registerCommand('multipleHighlight.highlightCurrentSelection', () => {
			controller?.highlightCurrentSelection();
		}),
	);
}

export function deactivate() {
	controller?.dispose();
	controller = undefined;
}
