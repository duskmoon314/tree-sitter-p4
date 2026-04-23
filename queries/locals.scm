; Scopes
(block_statement) @local.scope
(control_body) @local.scope
(parser_state) @local.scope
(for_statement) @local.scope
(conditional_statement) @local.scope
(switch_statement) @local.scope

; Function definitions
(function_declaration
  prototype: (function_prototype
    name: (name (nonTypeName (identifier))) @local.definition))

; Action definitions
(action_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

; Variable definitions
(variable_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

; Constant definitions
(constant_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

; Parameter definitions
(parameter
  name: (name (nonTypeName (identifier))) @local.definition)

; Type definitions
(header_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

(struct_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

(enum_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

(typedef_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

; Parser/Control/Package definitions
(parser_type_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

(control_type_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

(package_type_declaration
  name: (name (nonTypeName (identifier))) @local.definition)

; Extern definitions
(extern_declaration
  name: (nonTypeName (identifier)) @local.definition)

; Instantiation definitions
(instantiation
  name: (name (nonTypeName (identifier))) @local.definition)

; Parser state definitions
(parser_state
  name: (name (nonTypeName (identifier))) @local.definition)

; References
(identifier) @local.reference
