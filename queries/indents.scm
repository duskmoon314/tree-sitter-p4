; Indent increase — opening delimiters
[
  "{"
  "("
  "["
] @indent

; Dedent — closing delimiters
[
  "}"
  ")"
  "]"
] @outdent

; Zero indent — top-level source file
(source_file) @zero_indent
