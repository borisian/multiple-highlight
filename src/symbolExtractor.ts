import { JS_TS_KEYWORDS } from './constants';

export interface ExtractSymbolsOptions {
	maxSymbols: number;
	ignoreSingleCharacterSymbols: boolean;
}

interface SymbolCandidate {
	count: number;
	firstIndex: number;
}

const identifierPattern = /[A-Za-z_$][A-Za-z0-9_$]*/g;

export function extractSymbols(text: string, options: ExtractSymbolsOptions): string[] {
	const sanitizedText = stripStringsAndComments(text);
	const candidates = new Map<string, SymbolCandidate>();
	let match: RegExpExecArray | null;

	while ((match = identifierPattern.exec(sanitizedText)) !== null) {
		const symbol = match[0];

		if (!isValidSymbol(symbol, options)) {
			continue;
		}

		const existingCandidate = candidates.get(symbol);
		if (existingCandidate) {
			existingCandidate.count += 1;
		} else {
			candidates.set(symbol, {
				count: 1,
				firstIndex: match.index,
			});
		}
	}

	return [...candidates.entries()]
		.sort((left, right) => {
			const countDifference = right[1].count - left[1].count;
			return countDifference === 0 ? left[1].firstIndex - right[1].firstIndex : countDifference;
		})
		.slice(0, options.maxSymbols)
		.map(([symbol]) => symbol);
}

export function stripStringsAndComments(text: string): string {
	return text
		.replace(/\/\*[\s\S]*?\*\//g, preserveNewlines)
		.replace(/\/\/.*$/gm, '')
		.replace(/'(?:\\.|[^'\\])*'/g, preserveNewlines)
		.replace(/"(?:\\.|[^"\\])*"/g, preserveNewlines)
		.replace(/`(?:\\.|[^`\\])*`/g, preserveNewlines);
}

function isValidSymbol(symbol: string, options: ExtractSymbolsOptions): boolean {
	if (options.ignoreSingleCharacterSymbols && symbol.length === 1) {
		return false;
	}

	if (JS_TS_KEYWORDS.has(symbol)) {
		return false;
	}

	return !/^\d+$/.test(symbol);
}

function preserveNewlines(value: string): string {
	return value.replace(/[^\r\n]/g, ' ');
}
