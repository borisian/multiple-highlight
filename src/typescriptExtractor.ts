import * as ts from 'typescript';
import { JS_TS_KEYWORDS } from './constants';
import { ExtractSymbolsOptions, rankSymbols } from './symbolExtractor';

interface SymbolHit {
	symbol: string;
	index: number;
}

export function extractTypeScriptSymbols(text: string, languageId: string, options: ExtractSymbolsOptions): string[] {
	const sourceFile = ts.createSourceFile(
		`selection.${getExtension(languageId)}`,
		text,
		ts.ScriptTarget.Latest,
		true,
		getScriptKind(languageId),
	);
	const hits: SymbolHit[] = [];
	const seenHits = new Set<string>();
	const addHit = (symbol: string, index: number) => {
		const key = `${symbol}:${index}`;
		if (!seenHits.has(key) && isValidTypeScriptSymbol(symbol, options)) {
			seenHits.add(key);
			hits.push({
				symbol,
				index,
			});
		}
	};

	visit(sourceFile, sourceFile, (node) => {
		if (!ts.isIdentifier(node)) {
			return;
		}

		addHit(node.text, node.getStart(sourceFile));
	});

	scanIdentifiers(text, languageId, addHit);

	return rankSymbols(hits, options.maxSymbols);
}

function visit(node: ts.Node, sourceFile: ts.SourceFile, onNode: (node: ts.Node) => void): void {
	onNode(node);
	for (const child of node.getChildren(sourceFile)) {
		visit(child, sourceFile, onNode);
	}
}

function isValidTypeScriptSymbol(symbol: string, options: ExtractSymbolsOptions): boolean {
	if (options.ignoreSingleCharacterSymbols && symbol.length === 1) {
		return false;
	}

	return !JS_TS_KEYWORDS.has(symbol);
}

function scanIdentifiers(text: string, languageId: string, addHit: (symbol: string, index: number) => void): void {
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		true,
		languageId.endsWith('react') ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
		text,
	);
	let token = scanner.scan();

	while (token !== ts.SyntaxKind.EndOfFileToken) {
		if (token === ts.SyntaxKind.Identifier) {
			addHit(scanner.getTokenText(), scanner.getTokenStart());
		}

		token = scanner.scan();
	}
}

function getScriptKind(languageId: string): ts.ScriptKind {
	switch (languageId) {
		case 'javascript':
			return ts.ScriptKind.JS;
		case 'javascriptreact':
			return ts.ScriptKind.JSX;
		case 'typescriptreact':
			return ts.ScriptKind.TSX;
		default:
			return ts.ScriptKind.TS;
	}
}

function getExtension(languageId: string): string {
	switch (languageId) {
		case 'javascript':
			return 'js';
		case 'javascriptreact':
			return 'jsx';
		case 'typescriptreact':
			return 'tsx';
		default:
			return 'ts';
	}
}
