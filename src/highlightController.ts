import * as vscode from 'vscode';
import { getConfig, MultipleHighlightConfig } from './config';
import { HIGHLIGHT_COLORS, OVERVIEW_RULER_COLORS } from './constants';
import { filterSymbolsWithOccurrences, findSymbolOccurrences } from './occurrenceFinder';
import { isMeaningfulSelection } from './selectionCriteria';
import { extractSymbolsForLanguage } from './symbolExtractor';

export class HighlightController implements vscode.Disposable {
	private readonly decorationTypes: vscode.TextEditorDecorationType[];
	private readonly disposables: vscode.Disposable[] = [];
	private readonly decoratedEditors = new Set<vscode.TextEditor>();
	private debounceTimer: NodeJS.Timeout | undefined;
	private clearTimer: NodeJS.Timeout | undefined;
	private highlightRequestId = 0;
	private autoHighlightEnabled: boolean;
	private lastSymbols: string[] | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.autoHighlightEnabled = getConfig().autoHighlightEnabled;
		this.decorationTypes = this.createDecorationTypes(getConfig());

		this.disposables.push(
			vscode.window.onDidChangeTextEditorSelection((event) => this.handleSelectionChange(event)),
			vscode.window.onDidChangeActiveTextEditor((editor) => this.handleActiveTextEditorChange(editor)),
			vscode.window.onDidChangeVisibleTextEditors(() => this.handleVisibleTextEditorsChange()),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (event.affectsConfiguration('multipleHighlight')) {
					this.autoHighlightEnabled = getConfig().autoHighlightEnabled;
					this.cancelDebounce();

					const editor = vscode.window.activeTextEditor;
					if (!this.autoHighlightEnabled || !editor || editor.selection.isEmpty) {
						this.clearAllHighlights();
					} else {
						this.clearAllHighlights();
						this.scheduleHighlight(editor);
					}
				}
			}),
		);

		context.subscriptions.push(this);
	}

	toggleAutoHighlight(): boolean {
		this.autoHighlightEnabled = !this.autoHighlightEnabled;
		if (!this.autoHighlightEnabled) {
			this.clearAllHighlights();
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
		this.highlightFromSelection(editor);
	}

	clearAllHighlights(): void {
		this.cancelDebounce();
		this.cancelPendingClear();
		this.highlightRequestId += 1;
		this.clearHighlightedEditors();
		this.lastSymbols = undefined;
	}

	dispose(): void {
		this.cancelDebounce();
		this.cancelPendingClear();
		this.clearAllHighlights();

		for (const disposable of this.disposables) {
			disposable.dispose();
		}

		for (const decorationType of this.decorationTypes) {
			decorationType.dispose();
		}
	}

	private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
		if (event.selections.length === 0 || event.selections[0].isEmpty) {
			this.scheduleClearIfActiveSelectionIsEmpty();
			return;
		}

		this.cancelPendingClear();

		if (!this.autoHighlightEnabled) {
			if (event.textEditor === vscode.window.activeTextEditor) {
				this.clearAllHighlights();
			}
			return;
		}

		this.scheduleHighlight(event.textEditor, event.selections[0]);
	}

	private handleActiveTextEditorChange(editor: vscode.TextEditor | undefined): void {
		if (!this.autoHighlightEnabled || !editor) {
			this.clearAllHighlights();
		}
	}

	private scheduleHighlight(editor: vscode.TextEditor, selection = editor.selection): void {
		this.cancelDebounce();
		this.cancelPendingClear();

		const document = editor.document;
		const debounceMs = getConfig().debounceMs;
		const requestId = ++this.highlightRequestId;

		this.debounceTimer = setTimeout(() => {
			if (requestId !== this.highlightRequestId) {
				return;
			}

			// Drop stale work if the source editor changed documents or its selection changed again.
			if (editor.document !== document || !editor.selection.isEqual(selection)) {
				return;
			}

			this.highlightFromSelection(editor, selection);
		}, debounceMs);
	}

	private handleVisibleTextEditorsChange(): void {
		const config = getConfig();
		const targetEditors = new Set(this.targetEditors(config, vscode.window.activeTextEditor));

		for (const editor of Array.from(this.decoratedEditors)) {
			if (!targetEditors.has(editor)) {
				this.clearEditor(editor);
			}
		}

		if (!this.autoHighlightEnabled || !this.lastSymbols) {
			return;
		}

		for (const editor of targetEditors) {
			this.highlightEditor(editor, this.lastSymbols, config);
		}
	}

	private highlightFromSelection(sourceEditor: vscode.TextEditor, sourceSelection = sourceEditor.selection): void {
		const config = getConfig();
		const sourceDocument = sourceEditor.document;

		if (!this.shouldProcessSelection(sourceDocument, sourceSelection, config)) {
			this.clearAllHighlights();
			return;
		}

		const selectedText = sourceDocument.getText(sourceSelection);
		const symbols = extractSymbolsForLanguage(selectedText, sourceDocument.languageId, {
			maxSymbols: config.maxSymbols,
			ignoreSingleCharacterSymbols: config.ignoreSingleCharacterSymbols,
		});

		const targetEditors = this.targetEditors(config, sourceEditor);
		const symbolsWithOccurrences = filterSymbolsWithOccurrences(this.scannableDocumentTexts(targetEditors, config), symbols);

		if (symbolsWithOccurrences.length === 0) {
			this.clearAllHighlights();
			return;
		}

		this.clearHighlightedEditors();
		this.lastSymbols = symbolsWithOccurrences;

		for (const editor of targetEditors) {
			this.highlightEditor(editor, symbolsWithOccurrences, config);
		}
	}

	private highlightEditor(editor: vscode.TextEditor, symbols: string[], config: MultipleHighlightConfig): void {
		this.clearEditor(editor);

		const document = editor.document;
		if (!config.supportedLanguages.includes(document.languageId)) {
			return;
		}

		const documentText = document.getText();
		if (documentText.length > config.maxFileSize) {
			return;
		}

		let hasRanges = false;

		symbols.forEach((symbol, index) => {
			const ranges = findSymbolOccurrences(documentText, symbol).map((match) => {
				const start = document.positionAt(match.start);
				const end = document.positionAt(match.end);
				return new vscode.Range(start, end);
			});

			if (ranges.length > 0) {
				hasRanges = true;
				editor.setDecorations(this.decorationTypes[index % this.decorationTypes.length], ranges);
			}
		});

		if (hasRanges) {
			this.decoratedEditors.add(editor);
		}
	}

	private clearEditor(editor: vscode.TextEditor): void {
		for (const decorationType of this.decorationTypes) {
			editor.setDecorations(decorationType, []);
		}

		this.decoratedEditors.delete(editor);
	}

	private editorsToClear(): vscode.TextEditor[] {
		return [...new Set([...this.decoratedEditors, ...vscode.window.visibleTextEditors])];
	}

	private clearHighlightedEditors(): void {
		for (const editor of this.editorsToClear()) {
			this.clearEditor(editor);
		}
		this.decoratedEditors.clear();
	}

	private scheduleClearIfActiveSelectionIsEmpty(): void {
		this.cancelPendingClear();
		this.clearTimer = setTimeout(() => {
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor || activeEditor.selection.isEmpty) {
				this.clearAllHighlights();
			}
		}, 0);
	}

	private targetEditors(config: MultipleHighlightConfig, sourceEditor?: vscode.TextEditor): vscode.TextEditor[] {
		if (config.highlightScope === 'activeEditor') {
			return sourceEditor ? [sourceEditor] : [];
		}

		return [...vscode.window.visibleTextEditors];
	}

	private scannableDocumentTexts(editors: vscode.TextEditor[], config: MultipleHighlightConfig): string[] {
		const documents = new Set<vscode.TextDocument>();

		for (const editor of editors) {
			const document = editor.document;
			const text = document.getText();

			if (config.supportedLanguages.includes(document.languageId) && text.length <= config.maxFileSize) {
				documents.add(document);
			}
		}

		return [...documents].map((document) => document.getText());
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
		// A selection can be useful because it is long, or because it spans context
		if (!isMeaningfulSelection({
			selectedTextLength: selectedText.length,
			selectedLineCount,
			minSelectionLength: config.minSelectionLength,
			minSelectedLines: config.minSelectedLines,
		}) && !this.isSingleSymbolSelection(selectedText, document.languageId, config)) {
			return false;
		}

		return document.getText().length <= config.maxFileSize;
	}

	private isSingleSymbolSelection(selectedText: string, languageId: string, config: MultipleHighlightConfig): boolean {
		const trimmedText = selectedText.trim();
		if (trimmedText.length === 0 || /\s/.test(trimmedText)) {
			return false;
		}

		const symbols = extractSymbolsForLanguage(trimmedText, languageId, {
			maxSymbols: 2,
			ignoreSingleCharacterSymbols: config.ignoreSingleCharacterSymbols,
		});

		return symbols.length === 1 && symbols[0] === trimmedText;
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

	private cancelPendingClear(): void {
		if (this.clearTimer) {
			clearTimeout(this.clearTimer);
			this.clearTimer = undefined;
		}
	}
}
