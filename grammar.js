/**
 * @file Programming Protocol-independent Packet Processors (P4-16)
 * @author duskmoon (Campbell He) <kp.campbell.he@duskmoon314.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "p4",

  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment, $.preprocessor_directive],

  conflicts: ($) => [
    [$._expression],
    [$.nonTypeName, $.type_name],
    [$._expression, $.nonBraceExpression],
    [$.identifier_list],
    [$.kv_list],
    [$.expression_list],
    [$.specified_identifier_list],
  ],

  rules: {
    // ==================== Top-level ====================

    source_file: ($) => repeat(choice($._declaration, ";")),

    _declaration: ($) =>
      choice(
        $.constant_declaration,
        $.extern_declaration,
        $.action_declaration,
        $.parser_declaration,
        $.type_declaration,
        $.control_declaration,
        $.instantiation,
        $.error_declaration,
        $.match_kind_declaration,
        $.function_declaration
      ),

    // ==================== Names & Identifiers ====================

    nonTypeName: ($) =>
      choice(
        $.identifier,
        "apply",
        "key",
        "actions",
        "state",
        "entries",
        "type",
        "priority"
      ),

    name: ($) => choice($.nonTypeName, "list"),

    nonTableKwName: ($) =>
      choice($.identifier, "apply", "state", "type", "priority"),

    member: ($) => field("name", $.name),

    prefixedNonTypeName: ($) =>
      choice($.nonTypeName, seq(".", $.nonTypeName)),

    dotPrefix: ($) => ".",

    // ==================== Tokens ====================

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    integer_literal: ($) =>
      token(
        choice(
          /\d+[wW]0[xX][0-9a-fA-F]+/,
          /\d+[wW]0[bB][01]+/,
          /\d+[wW]\d+/,
          /0[xX][0-9a-fA-F]+/,
          /0[bB][01]+/,
          /\d+/
        )
      ),

    string_literal: ($) => token(/"([^"\\]|\\.)*"/),

    comment: ($) =>
      token(
        choice(
          seq("//", /[^\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
        )
      ),

    preprocessor_directive: ($) =>
      token(
        choice(
          // Multi-line directive with backslash continuation
          seq(/#[^\n]*\\\n/, repeat(/[^\n]*\\\n/), /[^\n]*/),
          // Single-line directive
          /#[^\n]*/
        )
      ),

    // ==================== Types ====================

    type_ref: ($) =>
      choice(
        $.base_type,
        $.type_name,
        $.specialized_type,
        $.array_type,
        $.list_type,
        $.tuple_type
      ),

    named_type: ($) => choice($.type_name, $.specialized_type),

    type_name: ($) => choice($.identifier, seq(".", $.identifier)),

    base_type: ($) =>
      choice(
        "bool",
        "error",
        "bit",
        "string",
        "int",
        "varbit",
        seq("bit", "<", $.integer_literal, ">"),
        seq("int", "<", $.integer_literal, ">"),
        seq("varbit", "<", $.integer_literal, ">"),
        seq("bit", "<", "(", $._expression, ")", ">"),
        seq("int", "<", "(", $._expression, ")", ">"),
        seq("varbit", "<", "(", $._expression, ")", ">")
      ),

    type_or_void: ($) => choice($.type_ref, "void"),

    list_type: ($) => seq("list", "<", $.type_arg, ">"),

    tuple_type: ($) => seq("tuple", "<", $.type_argument_list, ">"),

    array_type: ($) => seq($.type_ref, "[", $._expression, "]"),

    specialized_type: ($) =>
      seq($.type_name, "<", $.type_argument_list, ">"),

    optTypeParameters: ($) => optional($.type_parameters),

    type_parameters: ($) => seq("<", $.type_parameter_list, ">"),

    type_parameter_list: ($) => seq($.name, repeat(seq(",", $.name))),

    type_argument_list: ($) =>
      seq($.type_arg, repeat(seq(",", $.type_arg))),

    type_arg: ($) => choice($.type_ref, $.nonTypeName, "void", "_"),

    real_type_argument_list: ($) =>
      seq($.real_type_arg, repeat(seq(",", $.type_arg))),

    real_type_arg: ($) => choice($.type_ref, "void", "_"),

    // ==================== Type Declarations ====================

    type_declaration: ($) =>
      choice(
        $.derived_type_declaration,
        seq($.typedef_declaration, ";"),
        seq($.parser_type_declaration, ";"),
        seq($.control_type_declaration, ";"),
        seq($.package_type_declaration, ";")
      ),

    derived_type_declaration: ($) =>
      choice(
        $.header_declaration,
        $.header_union_declaration,
        $.struct_declaration,
        $.enum_declaration
      ),

    header_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "header",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "{",
        field("fields", repeat($.struct_field)),
        "}"
      ),

    struct_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "struct",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "{",
        field("fields", repeat($.struct_field)),
        "}"
      ),

    header_union_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "header_union",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "{",
        field("fields", repeat($.struct_field)),
        "}"
      ),

    struct_field: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        field("type", $.type_ref),
        field("name", $.name),
        ";"
      ),

    enum_declaration: ($) =>
      choice(
        seq(
          field("annotations", optional($.annotations)),
          "enum",
          field("name", $.name),
          "{",
          field("members", $.identifier_list),
          optional(","),
          "}"
        ),
        seq(
          field("annotations", optional($.annotations)),
          "enum",
          field("type", $.type_ref),
          field("name", $.name),
          "{",
          field("members", $.specified_identifier_list),
          optional(","),
          "}"
        )
      ),

    specified_identifier_list: ($) =>
      seq(
        $.specified_identifier,
        repeat(seq(",", $.specified_identifier))
      ),

    specified_identifier: ($) => seq(field("name", $.name), "=", field("value", $._initializer)),

    error_declaration: ($) => seq("error", "{", field("members", $.identifier_list), "}"),

    match_kind_declaration: ($) =>
      seq("match_kind", "{", field("members", $.identifier_list), optional(","), "}"),

    identifier_list: ($) => seq($.name, repeat(seq(",", $.name))),

    typedef_declaration: ($) =>
      choice(
        seq(
          field("annotations", optional($.annotations)),
          "typedef",
          field("type", $.type_ref),
          field("name", $.name)
        ),
        seq(
          field("annotations", optional($.annotations)),
          "typedef",
          field("type", $.derived_type_declaration),
          field("name", $.name)
        ),
        seq(
          field("annotations", optional($.annotations)),
          "type",
          field("type", $.type_ref),
          field("name", $.name)
        )
      ),

    // ==================== Annotations ====================

    annotations: ($) => repeat1($.annotation),

    annotation: ($) =>
      choice(
        seq("@", field("name", $.name)),
        seq("@", field("name", $.name), "(", field("body", optional($.annotation_body)), ")"),
        seq("@", field("name", $.name), "[", field("body", optional($.structured_annotation_body)), "]")
      ),

    annotation_body: ($) =>
      repeat1(
        choice(seq("(", $.annotation_body, ")"), $.annotation_token)
      ),

    annotation_token: ($) =>
      choice(
        $.identifier,
        $.integer_literal,
        $.string_literal,
        "abstract",
        "action",
        "actions",
        "apply",
        "bool",
        "bit",
        "break",
        "const",
        "continue",
        "control",
        "default",
        "else",
        "entries",
        "enum",
        "error",
        "exit",
        "extern",
        "false",
        "for",
        "header",
        "header_union",
        "if",
        "in",
        "inout",
        "int",
        "key",
        "match_kind",
        "type",
        "out",
        "parser",
        "package",
        "return",
        "select",
        "state",
        "string",
        "struct",
        "switch",
        "table",
        "this",
        "transition",
        "true",
        "tuple",
        "typedef",
        "varbit",
        "value_set",
        "list",
        "void",
        "_",
        "&&&",
        "..",
        "<<",
        "&&",
        "||",
        "==",
        "!=",
        ">=",
        "<=",
        "++",
        "+",
        "|+|",
        "-",
        "|-|",
        "*",
        "/",
        "%",
        "|",
        "&",
        "^",
        "~",
        "[",
        "]",
        "{",
        "}",
        "<",
        ">",
        "!",
        ":",
        ",",
        "?",
        ".",
        "=",
        ";",
        "@"
      ),

    structured_annotation_body: ($) =>
      choice(
        seq($.expression_list, optional(",")),
        seq($.kv_list, optional(","))
      ),

    kv_list: ($) => seq($.kv_pair, repeat(seq(",", $.kv_pair))),

    kv_pair: ($) => seq(field("key", $.name), "=", field("value", $._expression)),

    // ==================== Parameters ====================

    parameter_list: ($) => $.non_empty_parameter_list,

    non_empty_parameter_list: ($) =>
      seq($.parameter, repeat(seq(",", $.parameter))),

    parameter: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        field("direction", optional($.direction)),
        field("type", $.type_ref),
        field("name", $.name),
        field("default_value", optional(seq("=", $._expression)))
      ),

    direction: ($) => choice("in", "out", "inout"),

    // ==================== Package ====================

    package_type_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "package",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "(",
        field("parameters", optional($.parameter_list)),
        ")"
      ),

    // ==================== Instantiation ====================

    instantiation: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        field("type", $.type_ref),
        "(",
        field("arguments", optional($.argument_list)),
        ")",
        field("name", $.name),
        field("initializer", optional(seq("=", $.obj_initializer))),
        ";"
      ),

    obj_initializer: ($) => seq("{", repeat($.obj_declaration), "}"),

    obj_declaration: ($) => choice($.function_declaration, $.instantiation),

    optConstructorParameters: ($) =>
      optional(seq("(", $.parameter_list, ")")),

    // ==================== Parser ====================

    parser_declaration: ($) =>
      seq(
        field("type_declaration", $.parser_type_declaration),
        field("constructor_parameters", optional($.constructor_parameters)),
        "{",
        field("local_elements", repeat($.parser_local_element)),
        field("states", repeat($.parser_state)),
        "}"
      ),

    parser_type_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "parser",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "(",
        field("parameters", optional($.parameter_list)),
        ")"
      ),

    constructor_parameters: ($) =>
      seq("(", optional($.parameter_list), ")"),

    parser_local_element: ($) =>
      choice(
        $.constant_declaration,
        $.instantiation,
        $.variable_declaration,
        $.value_set_declaration
      ),

    parser_state: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "state",
        field("name", $.name),
        "{",
        field("statements", repeat($.parser_statement)),
        field("transition", optional($.transition_statement)),
        "}"
      ),

    parser_statement: ($) =>
      choice(
        $.assignment_or_method_call_statement,
        $.direct_application,
        $.empty_statement,
        $.variable_declaration,
        $.constant_declaration,
        $.parser_block_statement,
        $.conditional_statement
      ),

    parser_block_statement: ($) =>
      seq(optional($.annotations), "{", repeat($.parser_statement), "}"),

    transition_statement: ($) => seq("transition", field("target", $._state_expression)),

    _state_expression: ($) => choice(seq($.name, ";"), $.select_expression),

    select_expression: ($) =>
      seq(
        "select",
        "(",
        field("expression", $.expression_list),
        ")",
        "{",
        field("cases", repeat($.select_case)),
        "}"
      ),

    select_case: ($) => seq(field("keyset", $.keyset_expression), ":", field("state", $.name), ";"),

    keyset_expression: ($) =>
      choice($.tuple_keyset_expression, $.simple_keyset_expression),

    tuple_keyset_expression: ($) =>
      choice(
        seq(
          "(",
          $.simple_keyset_expression,
          ",",
          $.simple_expression_list,
          ")"
        ),
        seq("(", $.reduced_simple_keyset_expression, ")")
      ),

    simple_expression_list: ($) =>
      seq(
        $.simple_keyset_expression,
        repeat(seq(",", $.simple_keyset_expression))
      ),

    simple_keyset_expression: ($) =>
      choice(
        $._expression,
        seq($._expression, "&&&", $._expression),
        seq($._expression, "..", $._expression),
        "default",
        "_"
      ),

    reduced_simple_keyset_expression: ($) =>
      choice(
        seq($._expression, "&&&", $._expression),
        seq($._expression, "..", $._expression),
        "default",
        "_"
      ),

    value_set_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "value_set",
        "<",
        field("type", choice($.base_type, $.tuple_type, $.type_name)),
        ">",
        "(",
        field("size", $._expression),
        ")",
        field("name", $.name),
        ";"
      ),

    // ==================== Control ====================

    control_declaration: ($) =>
      seq(
        field("type_declaration", $.control_type_declaration),
        field("constructor_parameters", optional($.constructor_parameters)),
        "{",
        field("local_declarations", repeat($.control_local_declaration)),
        "apply",
        field("body", $.control_body),
        "}"
      ),

    control_type_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "control",
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "(",
        field("parameters", optional($.parameter_list)),
        ")"
      ),

    control_local_declaration: ($) =>
      choice(
        $.constant_declaration,
        $.action_declaration,
        $.table_declaration,
        $.instantiation,
        $.variable_declaration
      ),

    control_body: ($) => $.block_statement,

    // ==================== Extern ====================

    extern_declaration: ($) =>
      choice(
        seq(
          field("annotations", optional($.annotations)),
          "extern",
          field("name", $.nonTypeName),
          field("type_parameters", optional($.type_parameters)),
          "{",
          field("methods", repeat($.method_prototype)),
          "}"
        ),
        seq(
          field("annotations", optional($.annotations)),
          "extern",
          field("function_prototype", $.function_prototype),
          ";"
        )
      ),

    function_prototype: ($) =>
      seq(
        field("return_type", $.type_or_void),
        field("name", $.name),
        field("type_parameters", optional($.type_parameters)),
        "(",
        field("parameters", optional($.parameter_list)),
        ")"
      ),

    method_prototype: ($) =>
      choice(
        seq(
          field("annotations", optional($.annotations)),
          field("function_prototype", $.function_prototype),
          ";"
        ),
        seq(
          field("annotations", optional($.annotations)),
          "abstract",
          field("function_prototype", $.function_prototype),
          ";"
        ),
        seq(
          field("annotations", optional($.annotations)),
          field("name", $.identifier),
          "(",
          field("parameters", optional($.parameter_list)),
          ")",
          ";"
        )
      ),

    // ==================== Table ====================

    table_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "table",
        field("name", $.name),
        "{",
        field("properties", repeat1($.table_property)),
        "}"
      ),

    table_property: ($) =>
      choice(
        seq("key", "=", "{", field("key_elements", repeat($.key_element)), "}"),
        seq("actions", "=", "{", field("action_refs", repeat($.action_ref_with_annotations)), "}"),
        seq(
          field("annotations", optional($.annotations)),
          optional("const"),
          "entries",
          "=",
          "{",
          field("entries", repeat($.entry)),
          "}"
        ),
        seq(
          field("annotations", optional($.annotations)),
          optional("const"),
          field("name", $.nonTableKwName),
          "=",
          field("value", $._initializer),
          ";"
        )
      ),

    key_element: ($) =>
      seq(
        field("expression", $._expression),
        ":",
        field("match_kind", $.name),
        field("annotations", optional($.annotations)),
        ";"
      ),

    action_ref_with_annotations: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        field("action_ref", $.action_ref),
        ";"
      ),

    action_ref: ($) =>
      choice(
        field("name", $.prefixedNonTypeName),
        seq(
          field("name", $.prefixedNonTypeName),
          "(",
          field("arguments", optional($.argument_list)),
          ")"
        )
      ),

    entry: ($) =>
      seq(
        optional("const"),
        field("priority", optional($.entry_priority)),
        field("keyset", $.keyset_expression),
        ":",
        field("action", $.action_ref),
        field("annotations", optional($.annotations)),
        ";"
      ),

    entry_priority: ($) =>
      choice(
        seq("priority", "=", field("value", $.integer_literal), ":"),
        seq("priority", "=", "(", field("value", $._expression), ")", ":")
      ),

    // ==================== Action ====================

    action_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "action",
        field("name", $.name),
        "(",
        field("parameters", optional($.parameter_list)),
        ")",
        field("body", $.block_statement)
      ),

    // ==================== Variables & Constants ====================

    variable_declaration: ($) =>
      seq(
        choice(
          seq(
            field("annotations", $.annotations),
            field("type", $.type_ref),
            field("name", $.name),
            field("initializer", optional($._opt_initializer))
          ),
          seq(
            field("type", $.type_ref),
            field("name", $.name),
            field("initializer", optional($._opt_initializer))
          )
        ),
        ";"
      ),

    constant_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "const",
        field("type", $.type_ref),
        field("name", $.name),
        "=",
        field("value", $._initializer),
        ";"
      ),

    _opt_initializer: ($) => seq("=", $._initializer),

    _initializer: ($) => $._expression,

    // ==================== Function ====================

    function_declaration: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        field("prototype", $.function_prototype),
        field("body", $.block_statement)
      ),

    // ==================== Arguments ====================

    argument_list: ($) => $.non_empty_arg_list,

    non_empty_arg_list: ($) =>
      seq($.argument, repeat(seq(",", $.argument))),

    argument: ($) =>
      choice(
        field("value", $._expression),
        seq(field("name", $.name), "=", field("value", $._expression)),
        "_",
        seq(field("name", $.name), "=", "_")
      ),

    expression_list: ($) =>
      seq($._expression, repeat(seq(",", $._expression))),

    // ==================== Lvalue ====================

    lvalue: ($) =>
      choice(
        $.prefixedNonTypeName,
        "this",
        seq($.lvalue, ".", field("member", $.member)),
        seq($.lvalue, "[", $._expression, "]"),
        seq(
          $.lvalue,
          "[",
          $._expression,
          ":",
          $._expression,
          "]"
        ),
        seq(
          $.lvalue,
          "[",
          $._expression,
          "+",
          ":",
          $._expression,
          "]"
        ),
        seq("(", $.lvalue, ")")
      ),

    // ==================== Expressions ====================

    _expression: ($) =>
      choice(
        // Literals
        $.integer_literal,
        "...",
        $.string_literal,
        "true",
        "false",
        "this",

        // Identifiers
        $.prefixedNonTypeName,

        // Array/bit index (postfix, highest precedence)
        prec.left(13, seq($._expression, "[", $._expression, "]")),
        prec.left(
          13,
          seq($._expression, "[", $._expression, ":", $._expression, "]")
        ),
        prec.left(
          13,
          seq(
            $._expression,
            "[",
            $._expression,
            "+",
            ":",
            $._expression,
            "]"
          )
        ),

        // Brace expressions
        seq("{", optional($.expression_list), optional(","), "}"),
        seq("{", "}"),
        seq("{#", "}"),
        seq("{", $.kv_list, optional(","), "}"),
        seq("{", $.kv_list, ",", "...", optional(","), "}"),

        // Parenthesized
        seq("(", $._expression, ")"),

        // Prefix unary (precedence 12)
        prec.right(12, seq("!", $._expression)),
        prec.right(12, seq("~", $._expression)),
        prec.right(12, seq("-", $._expression)),
        prec.right(12, seq("+", $._expression)),

        // Enum/error member access
        seq($.type_name, ".", field("member", $.member)),
        seq("error", ".", field("member", $.member)),

        // Member access (postfix, highest precedence)
        prec.left(13, seq($._expression, ".", field("member", $.member))),

        // Multiplicative (precedence 10)
        prec.left(10, seq($._expression, "*", $._expression)),
        prec.left(10, seq($._expression, "/", $._expression)),
        prec.left(10, seq($._expression, "%", $._expression)),

        // Additive (precedence 9)
        prec.left(9, seq($._expression, "+", $._expression)),
        prec.left(9, seq($._expression, "-", $._expression)),
        prec.left(9, seq($._expression, "|+|", $._expression)),
        prec.left(9, seq($._expression, "|-|", $._expression)),
        prec.left(9, seq($._expression, "++", $._expression)),

        // Shift (precedence 8)
        prec.left(8, seq($._expression, "<<", $._expression)),
        prec.left(8, seq($._expression, ">>", $._expression)),

        // Relational (precedence 7)
        prec.left(7, seq($._expression, "<=", $._expression)),
        prec.left(7, seq($._expression, ">=", $._expression)),
        prec.left(7, seq($._expression, "<", $._expression)),
        prec.left(7, seq($._expression, ">", $._expression)),

        // Equality (precedence 6)
        prec.left(6, seq($._expression, "!=", $._expression)),
        prec.left(6, seq($._expression, "==", $._expression)),

        // Bitwise AND (precedence 5)
        prec.left(5, seq($._expression, "&", $._expression)),

        // Bitwise XOR (precedence 4)
        prec.left(4, seq($._expression, "^", $._expression)),

        // Bitwise OR (precedence 3)
        prec.left(3, seq($._expression, "|", $._expression)),

        // Logical AND (precedence 2)
        prec.left(2, seq($._expression, "&&", $._expression)),

        // Logical OR (precedence 1)
        prec.left(1, seq($._expression, "||", $._expression)),

        // Ternary conditional (precedence 0)
        prec.right(
          0,
          seq(
            $._expression,
            "?",
            $._expression,
            ":",
            $._expression
          )
        ),

        // Method call with type arguments (postfix)
        prec.left(
          13,
          seq(
            $._expression,
            "<",
            field("type_arguments", $.real_type_argument_list),
            ">",
            "(",
            field("arguments", optional($.argument_list)),
            ")"
          )
        ),

        // Function/method call (postfix)
        prec.left(
          13,
          seq(
            $._expression,
            "(",
            field("arguments", optional($.argument_list)),
            ")"
          )
        ),

        // Constructor call
        seq(
          field("type", $.named_type),
          "(",
          field("arguments", optional($.argument_list)),
          ")"
        ),

        // Cast
        seq("(", field("type", $.type_ref), ")", field("expression", $._expression))
      ),

    // Non-brace expression (for switch labels)
    nonBraceExpression: ($) =>
      choice(
        $.integer_literal,
        $.string_literal,
        "true",
        "false",
        "this",
        $.prefixedNonTypeName,
        prec.left(13, seq($.nonBraceExpression, "[", $._expression, "]")),
        prec.left(
          13,
          seq(
            $.nonBraceExpression,
            "[",
            $._expression,
            ":",
            $._expression,
            "]"
          )
        ),
        prec.left(
          13,
          seq(
            $.nonBraceExpression,
            "[",
            $._expression,
            "+",
            ":",
            $._expression,
            "]"
          )
        ),
        seq("(", $._expression, ")"),
        prec.right(12, seq("!", $._expression)),
        prec.right(12, seq("~", $._expression)),
        prec.right(12, seq("-", $._expression)),
        prec.right(12, seq("+", $._expression)),
        seq($.type_name, ".", field("member", $.member)),
        seq("error", ".", field("member", $.member)),
        prec.left(13, seq($.nonBraceExpression, ".", field("member", $.member))),
        prec.left(10, seq($.nonBraceExpression, "*", $._expression)),
        prec.left(10, seq($.nonBraceExpression, "/", $._expression)),
        prec.left(10, seq($.nonBraceExpression, "%", $._expression)),
        prec.left(9, seq($.nonBraceExpression, "+", $._expression)),
        prec.left(9, seq($.nonBraceExpression, "-", $._expression)),
        prec.left(9, seq($.nonBraceExpression, "|+|", $._expression)),
        prec.left(9, seq($.nonBraceExpression, "|-|", $._expression)),
        prec.left(9, seq($.nonBraceExpression, "++", $._expression)),
        prec.left(8, seq($.nonBraceExpression, "<<", $._expression)),
        prec.left(8, seq($.nonBraceExpression, ">>", $._expression)),
        prec.left(7, seq($.nonBraceExpression, "<=", $._expression)),
        prec.left(7, seq($.nonBraceExpression, ">=", $._expression)),
        prec.left(7, seq($.nonBraceExpression, "<", $._expression)),
        prec.left(7, seq($.nonBraceExpression, ">", $._expression)),
        prec.left(6, seq($.nonBraceExpression, "!=", $._expression)),
        prec.left(6, seq($.nonBraceExpression, "==", $._expression)),
        prec.left(5, seq($.nonBraceExpression, "&", $._expression)),
        prec.left(4, seq($.nonBraceExpression, "^", $._expression)),
        prec.left(3, seq($.nonBraceExpression, "|", $._expression)),
        prec.left(2, seq($.nonBraceExpression, "&&", $._expression)),
        prec.left(1, seq($.nonBraceExpression, "||", $._expression)),
        prec.right(
          0,
          seq(
            $.nonBraceExpression,
            "?",
            $._expression,
            ":",
            $._expression
          )
        ),
        prec.left(
          13,
          seq(
            $.nonBraceExpression,
            "<",
            field("type_arguments", $.real_type_argument_list),
            ">",
            "(",
            field("arguments", optional($.argument_list)),
            ")"
          )
        ),
        prec.left(
          13,
          seq(
            $.nonBraceExpression,
            "(",
            field("arguments", optional($.argument_list)),
            ")"
          )
        ),
        seq(
          field("type", $.named_type),
          "(",
          field("arguments", optional($.argument_list)),
          ")"
        ),
        seq(
          "(",
          field("type", $.type_ref),
          ")",
          field("expression", $._expression)
        )
      ),

    // ==================== Statements ====================

    _statement: ($) =>
      choice(
        $.assignment_or_method_call_statement,
        $.direct_application,
        $.conditional_statement,
        $.empty_statement,
        $.block_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.exit_statement,
        $.switch_statement,
        $.for_statement
      ),

    assignment_or_method_call_statement: ($) =>
      seq($._assignment_or_method_call_without_semicolon, ";"),

    _assignment_or_method_call_without_semicolon: ($) =>
      choice(
        seq($.lvalue, "(", optional($.argument_list), ")"),
        seq(
          $.lvalue,
          "<",
          $.type_argument_list,
          ">",
          "(",
          optional($.argument_list),
          ")"
        ),
        seq($.lvalue, "=", $._expression),
        seq($.lvalue, "*=", $._expression),
        seq($.lvalue, "/=", $._expression),
        seq($.lvalue, "%=", $._expression),
        seq($.lvalue, "+=", $._expression),
        seq($.lvalue, "-=", $._expression),
        seq($.lvalue, "|+|=", $._expression),
        seq($.lvalue, "|-|=", $._expression),
        seq($.lvalue, "<<=", $._expression),
        seq($.lvalue, ">>=", $._expression),
        seq($.lvalue, "&=", $._expression),
        seq($.lvalue, "|=", $._expression),
        seq($.lvalue, "^=", $._expression)
      ),

    empty_statement: ($) => ";",

    exit_statement: ($) => seq("exit", ";"),

    return_statement: ($) =>
      choice(seq("return", ";"), seq("return", field("expression", $._expression), ";")),

    conditional_statement: ($) =>
      choice(
        prec.right(
          seq(
            "if",
            "(",
            field("condition", $._expression),
            ")",
            field("consequence", $._statement)
          )
        ),
        prec.right(
          seq(
            "if",
            "(",
            field("condition", $._expression),
            ")",
            field("consequence", $._statement),
            "else",
            field("alternative", $._statement)
          )
        )
      ),

    break_statement: ($) => seq("break", ";"),

    continue_statement: ($) => seq("continue", ";"),

    direct_application: ($) =>
      choice(
        seq(
          field("type", $.type_name),
          ".",
          "apply",
          "(",
          field("arguments", optional($.argument_list)),
          ")",
          ";"
        ),
        seq(
          field("type", $.specialized_type),
          ".",
          "apply",
          "(",
          field("arguments", optional($.argument_list)),
          ")",
          ";"
        )
      ),

    block_statement: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "{",
        field("statements", repeat($._statement_or_declaration)),
        "}"
      ),

    _statement_or_declaration: ($) =>
      choice($.variable_declaration, $.constant_declaration, $._statement),

    switch_statement: ($) =>
      seq(
        "switch",
        "(",
        field("expression", $._expression),
        ")",
        "{",
        field("cases", repeat($.switch_case)),
        "}"
      ),

    switch_case: ($) =>
      choice(
        seq(field("label", $.switch_label), ":", field("body", $.block_statement)),
        seq(field("label", $.switch_label), ":")
      ),

    switch_label: ($) => choice("default", $.nonBraceExpression),

    for_statement: ($) =>
      seq(
        field("annotations", optional($.annotations)),
        "for",
        "(",
        choice(
          // C-style for
          seq(
            field("init", optional($._for_init_statements)),
            ";",
            field("condition", $._expression),
            ";",
            field("update", optional($._for_update_statements))
          ),
          // For-in
          seq(
            field("annotations", optional($.annotations)),
            field("type", $.type_ref),
            field("name", $.name),
            "in",
            field("collection", $._for_collection_expr)
          )
        ),
        ")",
        field("body", $._statement)
      ),

    _for_init_statements: ($) =>
      seq(
        $._decl_or_assignment_or_method_call,
        repeat(seq(",", $._decl_or_assignment_or_method_call))
      ),

    _for_update_statements: ($) =>
      seq(
        $._assignment_or_method_call_without_semicolon,
        repeat(
          seq(",", $._assignment_or_method_call_without_semicolon)
        )
      ),

    _decl_or_assignment_or_method_call: ($) =>
      choice(
        // Variable declaration without semicolon
        seq(
          choice(
            seq($.annotations, $.type_ref, $.name, optional($._opt_initializer)),
            seq($.type_ref, $.name, optional($._opt_initializer))
          )
        ),
        $._assignment_or_method_call_without_semicolon
      ),

    _for_collection_expr: ($) =>
      choice($._expression, seq($._expression, "..", $._expression)),
  },
});
