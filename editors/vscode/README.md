# P4 (Tree-sitter) — VS Code Extension

VS Code extension for P4-16 language support using tree-sitter. Provides semantic syntax highlighting, code folding, and smart selection.

## Features

- Syntax highlighting via tree-sitter semantic tokens
- Code folding for blocks, parser states, declarations, and tables
- Smart selection (expand/shrink by AST nodes)

## Prerequisites

- Node.js >= 18
- pnpm
- `tree-sitter` CLI (for building the WASM grammar)

## Setup

From the repo root, build the WASM grammar:

```bash
tree-sitter build --wasm
```

Then install dependencies and build the extension:

```bash
cd editors/vscode
pnpm install
pnpm run build
```

## Development

Launch the Extension Development Host from VS Code:

1. Open `editors/vscode/` in VS Code
2. Press F5
3. Open a `.p4` file in the new window

To rebuild on changes:

```bash
pnpm run watch
```

## Building a VSIX

Package the extension for distribution:

```bash
pnpm run build
pnpm run package
```

This produces a `tree-sitter-p4-*.vsix` file. Install it with:

```bash
code --install-extension tree-sitter-p4-*.vsix
```
