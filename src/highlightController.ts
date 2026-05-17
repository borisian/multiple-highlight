import * as vscode from 'vscode';
import { getConfig, MultipleHighlightConfig } from './config';
import { HIGHLIGHT_COLORS, OVERVIEW_RULER_COLORS } from './constants';
import { findSymbolOccurrences } from './occurrenceFinder';
import { isMeaningfulSelection } from './selectionCriteria';
import { extractSymbols } from './symbolExtractor';

export class HighlightController implements vscode.Disposable {
	private readonly decorationTypes: vscode.TextEditorDecorationType[];
	private readonly disposables: vscode.Disposable[] = [];
	private debounceTimer: NodeJS.Timeout | undefined;
	private autoHighlightEnabled: boolean;
	private lastHighlightedEditor: vscode.TextEditor | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.autoHighlightEnabled = getConfig().autoHighlightEnabled;
		this.decorationTypes = this.createDecorationTypes(getConfig());

		this.disposables.push(
			vscode.window.onDidChangeTextEditorSelection((event) => this.handleSelectionChange(event)),
			vscode.window.onDidChangeActiveTextEditor((editor) => {
				this.cancelDebounce();
				this.clearHighlights(this.lastHighlightedEditor);
				if (editor) {
					this.clearHighlights(editor);
				}
			}),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (event.affectsConfiguration('multipleHighlight.autoHighlightEnabled')) {
					this.autoHighlightEnabled = getConfig().autoHighlightEnabled;
				}
			}),
		);

		context.subscriptions.push(this);
	}

	toggleAutoHighlight(): boolean {
		this.autoHighlightEnabled = !this.autoHighlightEnabled;
		if (!this.autoHighlightEnabled) {
			this.clearHighlights(vscode.window.activeTextEditor);
		} else if (vscode.window.activeTextEditor) {
			this.scheduleHighlight(vscode.window.activeTextEditor);
		}

		return this.autoHighlightEnabled;
	}

	highlightCurrentSelection(): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		this.cancelDebounce();
		this.applyHighlights(editor);
	}

	clearHighlights(editor = vscode.window.activeTextEditor): void {
		if (!editor) {
			return;
		}

		for (const decorationType of this.decorationTypes) {
			editor.setDecorations(decorationType, []);
		}

		if (editor === this.lastHighlightedEditor) {
			this.lastHighlightedEditor = undefined;
		}
	}

	dispose(): void {
		this.cancelDebounce();
		this.clearHighlights(vscode.window.activeTextEditor);

		for (const disposable of this.disposables) {
			disposable.dispose();
		}

		for (const decorationType of this.decorationTypes) {
			decorationType.dispose();
		}
	}

	private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
		if (event.textEditor !== vscode.window.activeTextEditor) {
			return;
		}

		if (event.selections.length === 0 || event.selections[0].isEmpty) {
			this.cancelDebounce();
			this.clearHighlights(event.textEditor);
			return;
		}

		if (!this.autoHighlightEnabled) {
			this.clearHighlights(event.textEditor);
			return;
		}

		this.scheduleHighlight(event.textEditor);
	}

	private scheduleHighlight(editor: vscode.TextEditor): void {
		this.cancelDebounce();

		const documentUri = editor.document.uri.toString();
		const selection = editor.selection;
		const debounceMs = getConfig().debounceMs;

		this.debounceTimer = setTimeout(() => {
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor || activeEditor.document.uri.toString() !== documentUri || !activeEditor.selection.isEqual(selection)) {
				return;
			}

			this.applyHighlights(activeEditor);
		}, debounceMs);
	}

	private applyHighlights(editor: vscode.TextEditor): void {
		const config = getConfig();
		const document = editor.document;
		const selection = editor.selection;

		this.clearHighlights(editor);

		if (!this.shouldProcessSelection(document, selection, config)) {
			return;
		}

		const selectedText = document.getText(selection);
		const symbols = extractSymbols(selectedText, {
			maxSymbols: config.maxSymbols,
			ignoreSingleCharacterSymbols: config.ignoreSingleCharacterSymbols,
		});

		if (symbols.length === 0) {
			return;
		}

		const documentText = document.getText();
		symbols.forEach((symbol, index) => {
			const ranges = findSymbolOccurrences(documentText, symbol).map((match) => {
				const start = document.positionAt(match.start);
				const end = document.positionAt(match.end);
				return new vscode.Range(start, end);
			});

			editor.setDecorations(this.decorationTypes[index % this.decorationTypes.length], ranges);
		});

		this.lastHighlightedEditor = editor;
	}

	private shouldProcessSelection(document: vscode.TextDocument, selection: vscode.Selection, config: MultipleHighlightConfig): boolean {
		if (selection.isEmpty) {
			return false;
		}

		if (!config.supportedLanguages.includes(document.languageId)) {
			return false;
		}

		const selectedText = document.getText(selection);
		const selectedLineCount = selection.end.line - selection.start.line + 1;
		if (!isMeaningfulSelection({
			selectedTextLength: selectedText.length,
			selectedLineCount,
			minSelectionLength: config.minSelectionLength,
			minSelectedLines: config.minSelectedLines,
		})) {
			return false;
		}

		return document.getText().length <= config.maxFileSize;
	}

	private createDecorationTypes(config: MultipleHighlightConfig): vscode.TextEditorDecorationType[] {
		return HIGHLIGHT_COLORS.map((backgroundColor, index) => {
			const options: vscode.DecorationRenderOptions = {
				backgroundColor,
				borderRadius: '2px',
			};

			if (config.includeOverviewRuler) {
				options.overviewRulerColor = OVERVIEW_RULER_COLORS[index];
				options.overviewRulerLane = vscode.OverviewRulerLane.Right;
			}

			return vscode.window.createTextEditorDecorationType(options);
		});
	}

	private cancelDebounce(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = undefined;
		}
	}
}
