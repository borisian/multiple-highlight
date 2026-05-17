# Multiple Highlight

Multiple Highlight automatically applies multiple distinct highlights for symbols found in the current code selection.

## Features

Select a multi-line or sufficiently long block of JS, TS, JSX, or TSX code. The extension extracts plausible identifiers, filters obvious keywords and primitive types, and applies a different highlight color for each symbol across the current document.

The MVP is intentionally regex-based. It does not run a language server or TypeScript AST analysis.

## Commands

- `MultipleHighlight: Toggle Auto Highlight`
- `MultipleHighlight: Clear Highlights`
- `MultipleHighlight: Highlight Current Selection`

## Requirements

No runtime dependencies are required.

## Extension Settings

This extension contributes the following settings:

- `multipleHighlight.autoHighlightEnabled`: Enable or disable automatic highlighting.
- `multipleHighlight.debounceMs`: Delay before recalculating highlights after selection changes.
- `multipleHighlight.minSelectedLines`: Minimum selected lines that can trigger highlighting even when the selection is short.
- `multipleHighlight.minSelectionLength`: Minimum selected characters that can trigger highlighting even on a single line.
- `multipleHighlight.maxSymbols`: Maximum symbols extracted from one selection.
- `multipleHighlight.maxFileSize`: Maximum document size scanned.
- `multipleHighlight.supportedLanguages`: Language identifiers where automatic highlighting runs.
- `multipleHighlight.ignoreSingleCharacterSymbols`: Ignore one-character identifiers.
- `multipleHighlight.includeOverviewRuler`: Add markers to the overview ruler.

## Known Issues

- Symbol extraction is syntactic, not semantic.
- Identical property, type, and variable names can be highlighted together.
- Template strings, JSX, and complex TypeScript syntax are handled only approximately.
- Occurrences inside strings and comments can still be highlighted in the full document.
- Unicode identifiers are not supported by the MVP extractor.

## Release Notes

### 0.0.1

Initial MVP with automatic selection-based highlighting, commands, settings, and focused tests.
