import { JS_TS_KEYWORDS, TYPESCRIPT_LANGUAGE_IDS } from './constants';
import { getLanguageProfile, LanguageProfile, stripCLikeStringsAndComments } from './languageProfiles';
import { extractTypeScriptSymbols } from './typescriptExtractor';

export interface ExtractSymbolsOptions {
	maxSymbols: number;
	ignoreSingleCharacterSymbols: boolean;
}

interface SymbolCandidate {
	count: number;
	firstIndex: number;
}

interface SymbolHit {
	symbol: string;
	index: number;
}

const identifierPattern = /[A-Za-z_$][A-Za-z0-9_$]*/g;

export function extractSymbols(text: string, options: ExtractSymbolsOptions, profile?: LanguageProfile): string[] {
	const sanitizedText = profile ? profile.stripStringsAndComments(text) : stripStringsAndComments(text);
	const pattern = new RegExp(profile?.identifierPattern.source ?? identifierPattern.source, 'g');
	const hits: SymbolHit[] = [];
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(sanitizedText)) !== null) {
		const rawSymbol = match[0];
		const symbol = profile?.normalizeSymbol?.(rawSymbol) ?? rawSymbol;

		if (isValidSymbol(symbol, options, profile)) {
			hits.push({
				symbol,
				index: match.index,
			});
		}
	}

	return rankSymbols(hits, options.maxSymbols);
}

export function extractSymbolsForLanguage(text: string, languageId: string, options: ExtractSymbolsOptions): string[] {
	if (TYPESCRIPT_LANGUAGE_IDS.includes(languageId)) {
		return extractTypeScriptSymbols(text, languageId, options);
	}

	return extractSymbols(text, options, getLanguageProfile(languageId));
}

export function rankSymbols(hits: SymbolHit[], maxSymbols: number): string[] {
	const candidates = new Map<string, SymbolCandidate>();

	for (const hit of hits) {
		const existingCandidate = candidates.get(hit.symbol);
		if (existingCandidate) {
			existingCandidate.count += 1;
		} else {
			candidates.set(hit.symbol, {
				count: 1,
				firstIndex: hit.index,
			});
		}
	}

	return [...candidates.entries()]
		.sort((left, right) => {
			const countDifference = right[1].count - left[1].count;
			// Frequent names matter first. Ties keep the user's reading order
			return countDifference === 0 ? left[1].firstIndex - right[1].firstIndex : countDifference;
		})
		.slice(0, maxSymbols)
		.map(([symbol]) => symbol);
}

export function stripStringsAndComments(text: string): string {
	// Keep line breaks so match indexes still map cleanly to the original text shape
	return stripCLikeStringsAndComments(text);
}

function isValidSymbol(symbol: string, options: ExtractSymbolsOptions, profile?: LanguageProfile): boolean {
	if (options.ignoreSingleCharacterSymbols && symbol.length === 1) {
		return false;
	}

	if ((profile?.keywords ?? JS_TS_KEYWORDS).has(symbol)) {
		return false;
	}

	return !/^\d+$/.test(symbol);
}
