export interface OccurrenceMatch {
	start: number;
	end: number;
}

export function findSymbolOccurrences(text: string, symbol: string): OccurrenceMatch[] {
	const escapedSymbol = escapeRegExp(symbol);
	// \b is not enough here: _ and $ are valid JavaScript identifier characters
	const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escapedSymbol}(?![A-Za-z0-9_$])`, 'g');
	const matches: OccurrenceMatch[] = [];
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(text)) !== null) {
		matches.push({
			start: match.index,
			end: match.index + symbol.length,
		});
	}

	return matches;
}

export function filterSymbolsWithOccurrences(texts: string[], symbols: string[], minimumOccurrences = 2): string[] {
	return symbols.filter((symbol) => {
		let occurrenceCount = 0;

		for (const text of texts) {
			occurrenceCount += findSymbolOccurrences(text, symbol).length;

			if (occurrenceCount >= minimumOccurrences) {
				return true;
			}
		}

		return false;
	});
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
