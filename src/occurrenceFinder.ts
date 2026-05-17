export interface OccurrenceMatch {
	start: number;
	end: number;
}

export function findSymbolOccurrences(text: string, symbol: string): OccurrenceMatch[] {
	const escapedSymbol = escapeRegExp(symbol);
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

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
