# tree-sitter-p4

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [P4-16](https://p4.org/specs/) (Programming Protocol-independent Packet Processors).

## Features

- Full P4-16 grammar coverage: types, expressions, statements, parsers, controls, tables, actions, externs, packages, annotations
- 13-level operator precedence for expressions
- Multi-line preprocessor directive handling
- 98.3% parse success rate on official Tofino example programs (119/121 files)

## Usage

```bash
# Generate the parser
tree-sitter generate

# Run tests
tree-sitter test

# Parse a P4 file
tree-sitter parse example.p4
```

## Bindings

- **Rust**: `cargo test`
- **C**: `make && make test`

## Known Limitations

- Files using complex C preprocessor macros (token pasting with `##`) may not parse correctly
- Preprocessor directives are skipped rather than expanded

## License

MIT
