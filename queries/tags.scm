; Functions
(function_declaration
  prototype: (function_prototype
    name: (name (nonTypeName (identifier)) @name))) @definition.function

; Actions
(action_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.function

; Parsers
(parser_declaration
  type_declaration: (parser_type_declaration
    name: (name (nonTypeName (identifier)) @name))) @definition.class

; Controls
(control_declaration
  type_declaration: (control_type_declaration
    name: (name (nonTypeName (identifier)) @name))) @definition.class

; Externs
(extern_declaration
  name: (nonTypeName (identifier)) @name) @definition.class

; Packages
(package_type_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.class

; Tables
(table_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.class

; Types
(header_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.type

(struct_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.type

(enum_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.type

(typedef_declaration
  name: (name (nonTypeName (identifier)) @name)) @definition.type

; Parser states
(parser_state
  name: (name (nonTypeName (identifier)) @name)) @definition.function
