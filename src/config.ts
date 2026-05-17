import * as vscode from 'vscode';
import { DEFAULT_SUPPORTED_LANGUAGES } from './constants';

export interface MultipleHighlightConfig {
	autoHighlightEnabled: boolean;
	highlightScope: 'visibleEditors' | 'activeEditor';
	debounceMs: number;
	minSelectedLines: number;
	minSelectionLength: number;
	maxSymbols: number;
	maxFileSize: number;
	supportedLanguages: string[];
	ignoreSingleCharacterSymbols: boolean;
	includeOverviewRuler: boolean;
}

export function getConfig(): MultipleHighlightConfig {
	const configuration = vscode.workspace.getConfiguration('multipleHighlight');

	return {
		autoHighlightEnabled: configuration.get('autoHighlightEnabled', true),
		highlightScope: configuration.get<MultipleHighlightConfig['highlightScope']>('highlightScope', 'visibleEditors'),
		debounceMs: clamp(configuration.get('debounceMs', 200), 50, 1000),
		minSelectedLines: Math.max(1, configuration.get('minSelectedLines', 2)),
		minSelectionLength: Math.max(1, configuration.get('minSelectionLength', 20)),
		maxSymbols: Math.max(1, configuration.get('maxSymbols', 8)),
		maxFileSize: Math.max(1, configuration.get('maxFileSize', 200000)),
		supportedLanguages: configuration.get('supportedLanguages', DEFAULT_SUPPORTED_LANGUAGES),
		ignoreSingleCharacterSymbols: configuration.get('ignoreSingleCharacterSymbols', true),
		includeOverviewRuler: configuration.get('includeOverviewRuler', true),
	};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
