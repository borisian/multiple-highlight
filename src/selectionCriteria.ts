export interface SelectionCriteria {
	selectedTextLength: number;
	selectedLineCount: number;
	minSelectionLength: number;
	minSelectedLines: number;
}

export function isMeaningfulSelection(criteria: SelectionCriteria): boolean {
	return criteria.selectedTextLength >= criteria.minSelectionLength || criteria.selectedLineCount >= criteria.minSelectedLines;
}
