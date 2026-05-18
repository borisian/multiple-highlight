import { JS_TS_KEYWORDS } from './constants';
import { ExtractSymbolsOptions, rankSymbols } from './symbolExtractor';

interface SymbolHit {
	symbol: string;
	index: number;
}

export function extractTypeScriptSymbols(text: string, languageId: string, options: ExtractSymbolsOptions): string[] {
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

	scanIdentifiers(text, addHit);

	return rankSymbols(hits, options.maxSymbols);
}

function isValidTypeScriptSymbol(symbol: string, options: ExtractSymbolsOptions): boolean {
	if (options.ignoreSingleCharacterSymbols && symbol.length === 1) {
		return false;
	}

	return !JS_TS_KEYWORDS.has(symbol);
}

function scanIdentifiers(text: string, addHit: (symbol: string, index: number) => void): void {
	const identifierPattern = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/gu;
	let match: RegExpExecArray | null;

	while ((match = identifierPattern.exec(text)) !== null) {
		addHit(match[0], match.index);
	}
}
