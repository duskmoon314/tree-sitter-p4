package tree_sitter_p4_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_p4 "github.com/duskmoon314/tree-sitter-p4/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_p4.Language())
	if language == nil {
		t.Errorf("Error loading P4 grammar")
	}
}
