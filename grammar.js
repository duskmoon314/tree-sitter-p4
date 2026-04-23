/**
 * @file Programming Protocol-independent Packet Processors
 * @author duskmoon (Campbell He) <kp.campbell.he@duskmoon314.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "p4",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
