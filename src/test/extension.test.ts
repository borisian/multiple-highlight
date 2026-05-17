import * as assert from 'assert';

import * as vscode from 'vscode';
import { findSymbolOccurrences } from '../occurrenceFinder';
import { isMeaningfulSelection } from '../selectionCriteria';
import { extractSymbols } from '../symbolExtractor';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('extracts repeated symbols before first-seen symbols', () => {
		const symbols = extractSymbols('const alpha = beta;\nalpha(beta); gamma();', {
			maxSymbols: 3,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['alpha', 'beta', 'gamma']);
	});

	test('filters keywords, primitive types, strings, comments, and single-character symbols', () => {
		const symbols = extractSymbols('const x = "ignoredName";\n// commentName\nlet usefulName: string = otherName;', {
			maxSymbols: 5,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['usefulName', 'otherName']);
	});

	test('respects maxSymbols', () => {
		const symbols = extractSymbols('first second third fourth', {
			maxSymbols: 2,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['first', 'second']);
	});

	test('finds occurrences with JavaScript identifier boundaries', () => {
		const matches = findSymbolOccurrences('foo foobar foo_bar $foo foo foo$ foo.', 'foo');

		assert.deepStrictEqual(matches, [
			{ start: 0, end: 3 },
			{ start: 24, end: 27 },
			{ start: 33, end: 36 },
		]);
	});

	test('accepts a single-line selection when it is long enough', () => {
		assert.strictEqual(isMeaningfulSelection({
			selectedTextLength: 'const existingCandidate = candidates.get(symbol);'.length,
			selectedLineCount: 1,
			minSelectionLength: 20,
			minSelectedLines: 2,
		}), true);
	});

	test('accepts a short selection when it spans enough lines', () => {
		assert.strictEqual(isMeaningfulSelection({
			selectedTextLength: 10,
			selectedLineCount: 2,
			minSelectionLength: 20,
			minSelectedLines: 2,
		}), true);
	});
});
