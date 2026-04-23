; Comments
(comment) @comment

; Preprocessor directives
(preprocessor_directive) @keyword.directive

; Literals
(integer_literal) @number
(string_literal) @string
"true" @boolean
"false" @boolean

; Type keywords
[
  "header"
  "struct"
  "header_union"
  "enum"
  "typedef"
  "error"
  "match_kind"
] @keyword.type

; Declaration keywords
[
  "parser"
  "control"
  "action"
  "extern"
  "package"
  "table"
  "state"
] @keyword

; Modifier keywords
[
  "const"
  "abstract"
  "in"
  "out"
  "inout"
] @keyword.modifier

; Control flow keywords
[
  "if"
  "else"
  "switch"
  "default"
] @keyword.conditional

[
  "for"
  "break"
  "continue"
] @keyword.repeat

[
  "return"
  "exit"
  "transition"
] @keyword.return

; Special keywords
[
  "apply"
  "key"
  "actions"
  "entries"
  "select"
  "value_set"
  "priority"
] @keyword

"this" @variable.builtin

; Built-in types
[
  "bool"
  "bit"
  "int"
  "varbit"
  "string"
  "void"
  "error"
] @type.builtin

; Type references
(type_name (identifier)) @type

; Base types with width
(base_type) @type.builtin

; Function declarations
(function_declaration
  prototype: (function_prototype
    name: (name (nonTypeName (identifier))) @function))

; Action declarations
(action_declaration
  name: (name (nonTypeName (identifier))) @function)

; Method prototypes in externs
(method_prototype
  function_prototype: (function_prototype
    name: (name (nonTypeName (identifier))) @function.method))

; Constructor calls
(named_type (type_name (identifier))) @constructor

; Parameters
(parameter
  name: (name (nonTypeName (identifier))) @variable.parameter)

; Variable declarations
(variable_declaration
  name: (name (nonTypeName (identifier))) @variable)

; Constants
(constant_declaration
  name: (name (nonTypeName (identifier))) @constant)

; Instantiation names
(instantiation
  name: (name (nonTypeName (identifier))) @variable)

; Struct field names
(struct_field
  name: (name (nonTypeName (identifier))) @property)

; Member access
(member
  name: (name (nonTypeName (identifier))) @property)

; Enum members
(specified_identifier
  name: (name (nonTypeName (identifier))) @constant)

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<="
  ">="
  "<"
  ">"
  "&&"
  "||"
  "!"
  "~"
  "&"
  "|"
  "^"
  "<<"
  ">>"
  "++"
  "|+|"
  "|-|"
  "&&&"
  ".."
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "<<="
  ">>="
  "&="
  "|="
  "^="
  "|+|="
  "|-|="
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ";"
  ","
  "."
  ":"
  "@"
  "?"
  "!"
] @punctuation.delimiter

; Annotations
(annotation
  name: (name (nonTypeName (identifier))) @attribute)

; Table declarations
(table_declaration
  name: (name (nonTypeName (identifier))) @type)

; Key element match kinds
(key_element
  match_kind: (name (nonTypeName (identifier))) @keyword)

; Parser/Control/Package type declarations
(parser_type_declaration
  name: (name (nonTypeName (identifier))) @type)

(control_type_declaration
  name: (name (nonTypeName (identifier))) @type)

(package_type_declaration
  name: (name (nonTypeName (identifier))) @type)

; Extern declarations
(extern_declaration
  name: (nonTypeName (identifier)) @type)

; Header/Struct/Enum declarations
(header_declaration
  name: (name (nonTypeName (identifier))) @type)

(struct_declaration
  name: (name (nonTypeName (identifier))) @type)

(enum_declaration
  name: (name (nonTypeName (identifier))) @type)

; Typedef declarations
(typedef_declaration
  name: (name (nonTypeName (identifier))) @type)

; Parser states
(parser_state
  name: (name (nonTypeName (identifier))) @function)

; Direction keywords
(direction) @keyword.modifier
