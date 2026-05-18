import * as assert from 'assert';

import * as vscode from 'vscode';
import { findSymbolOccurrences } from '../occurrenceFinder';
import { isMeaningfulSelection } from '../selectionCriteria';
import { extractSymbols, extractSymbolsForLanguage } from '../symbolExtractor';

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

	test('extracts TypeScript symbols from identifiers', () => {
		const symbols = extractSymbolsForLanguage('const existingCandidate = candidates.get(symbol);', 'typescript', {
			maxSymbols: 5,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['existingCandidate', 'candidates', 'get', 'symbol']);
	});

	test('extracts TSX symbols from JSX expressions', () => {
		const symbols = extractSymbolsForLanguage('return <UserCard userId={userId} onSelect={selectUser} />;', 'typescriptreact', {
			maxSymbols: 6,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['userId', 'UserCard', 'onSelect', 'selectUser']);
	});

	test('keeps function calls from longer TypeScript selections with the default symbol budget', () => {
		const symbols = extractSymbolsForLanguage([
			'const selectedText = sourceDocument.getText(sourceSelection);',
			'const symbols = extractSymbolsForLanguage(selectedText, sourceDocument.languageId, {',
			'\tmaxSymbols: config.maxSymbols,',
			'\tignoreSingleCharacterSymbols: config.ignoreSingleCharacterSymbols,',
			'});',
			'if (symbols.length === 0) {',
		].join('\n'), 'typescript', {
			maxSymbols: 16,
			ignoreSingleCharacterSymbols: true,
		});

		assert.ok(symbols.includes('extractSymbolsForLanguage'));
	});

	test('filters Python keywords, strings, and comments', () => {
		const symbols = extractSymbolsForLanguage('def build_user(user_id):\n    name = "user_id"\n    return user_id # name', 'python', {
			maxSymbols: 5,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['user_id', 'build_user', 'name']);
	});

	test('extracts PHP variables with their dollar prefix', () => {
		const symbols = extractSymbolsForLanguage('$user = get_user($userId); echo "$user";', 'php', {
			maxSymbols: 5,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['$user', 'get_user', '$userId']);
	});

	test('filters Rust keywords and keeps useful identifiers', () => {
		const symbols = extractSymbolsForLanguage('let user_name = get_user(user_id); // user_name', 'rust', {
			maxSymbols: 5,
			ignoreSingleCharacterSymbols: true,
		});

		assert.deepStrictEqual(symbols, ['user_name', 'get_user', 'user_id']);
	});

	const languageSamples = new Map([
		['csharp', 'public int userCount = getUserCount(userId); // userCount'],
		['java', 'public int userCount = getUserCount(userId); // userCount'],
		['go', 'var userCount = getUserCount(userId) // userCount'],
		['c', 'int userCount = getUserCount(userId); // userCount'],
		['cpp', 'int userCount = getUserCount(userId); // userCount'],
		['swift', 'let userCount = getUserCount(userId) // userCount'],
	]);

	for (const [languageId, sample] of languageSamples) {
		test(`extracts useful identifiers for ${languageId}`, () => {
			const symbols = extractSymbolsForLanguage(sample, languageId, {
				maxSymbols: 5,
				ignoreSingleCharacterSymbols: true,
			});

			assert.deepStrictEqual(symbols, ['userCount', 'getUserCount', 'userId']);
		});
	}
});
