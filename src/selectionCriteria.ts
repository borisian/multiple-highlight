export interface SelectionCriteria {
	selectedTextLength: number;
	selectedLineCount: number;
	minSelectionLength: number;
	minSelectedLines: number;
}

export function isMeaningfulSelection(criteria: SelectionCriteria): boolean {
	// Either a long single line or a short multi-line selection is intentional enough
	return criteria.selectedTextLength >= criteria.minSelectionLength || criteria.selectedLineCount >= criteria.minSelectedLines;
}
