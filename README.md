# MultipleHighlight

## Features

MultipleHighlight automatically highlights occurrences of likely symbols found in a meaningful JavaScript or TypeScript selection.

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

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
