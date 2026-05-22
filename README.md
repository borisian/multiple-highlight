# multiple-highlight 

[Link to Marketplace](https://marketplace.visualstudio.com/items?itemName=borisian.multiple-highlight)

Highlight several symbols at once from the code you just selected.

Select a chunk of code, and the extension picks out the useful identifiers, then marks every matching occurrence in every visible editor with its own color. It is meant for the moments where VS Code's built-in single-symbol highlight is not enough.

## What it does

- Works automatically when you change the selection.
- Uses separate colors for separate symbols.
- Highlights all visible editors by default, including split editors.
- Supports JavaScript, TypeScript, JSX, TSX, Python, C#, Java, Rust, Go, PHP, C, C++, and Swift by default.
- Ignores short selections unless they span enough lines.
- Uses the TypeScript AST for JS/TS selections.
- Uses language-aware lexical parsing for the other supported languages.

## Visible editor scope

Highlights are calculated from the active selection once, then applied only to editors currently visible in the VS Code window. This includes side-by-side split editors. Hidden tabs, closed files, and workspace files that are not visible are not scanned or opened.

Set `multipleHighlight.highlightScope` to `activeEditor` to keep highlights limited to the active editor.

## Commands

- `Multiple Highlight: Toggle Auto Highlight`
- `Multiple Highlight: Clear Highlights`
- `Multiple Highlight: Highlight Current Selection`

## Requirements

None.

## Settings

Available under `multipleHighlight.*`:

- `multipleHighlight.autoHighlightEnabled`: Enable or disable automatic highlighting.
- `multipleHighlight.highlightScope`: Choose `visibleEditors` for all visible editors or `activeEditor` for only the active editor.
- `multipleHighlight.debounceMs`: Wait time before recalculating after a selection change.
- `multipleHighlight.minSelectedLines`: Let short selections run when they span enough lines.
- `multipleHighlight.minSelectionLength`: Let single-line selections run when they are long enough.
- `multipleHighlight.maxSymbols`: Maximum number of symbols highlighted from one selection.
- `multipleHighlight.maxFileSize`: Skip files above this size.
- `multipleHighlight.supportedLanguages`: VS Code language IDs where the extension runs.
- `multipleHighlight.ignoreSingleCharacterSymbols`: Skip one-letter identifiers.
- `multipleHighlight.includeOverviewRuler`: Add markers to the overview ruler.

## Current trade-offs

- JS/TS extraction uses the TypeScript AST, but it still does not resolve scopes or references.
- Other languages use lexical extraction, not full AST parsers.
- Properties, variables, and type names with the same text can be highlighted together.
- Strings and comments are filtered in the selection, but matches in the rest of the file can still appear.
- Complex TSX and template literal cases are best-effort.
- Unicode identifiers are not supported yet.

## Release Notes

### 0.0.1

First usable version: automatic selection highlights, commands, settings, and tests.
