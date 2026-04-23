import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Parser, Language, Tree, Node, Query, QueryMatch, Point } from "web-tree-sitter";

// VS Code semantic token types and modifiers
const TOKEN_TYPES = [
  "keyword",
  "function",
  "type",
  "variable",
  "parameter",
  "property",
  "class",
  "string",
  "number",
  "comment",
  "operator",
  "punctuation",
  "decorator",
  "enum",
  "enumMember",
  "method",
] as const;

const TOKEN_MODIFIERS = [
  "declaration",
  "readonly",
  "builtin",
  "defaultLibrary",
] as const;

const legend = new vscode.SemanticTokensLegend(
  [...TOKEN_TYPES],
  [...TOKEN_MODIFIERS]
);

// Map tree-sitter capture names to VS Code token type index + modifiers
function mapCapture(
  name: string
): { type: number; modifiers: number } | null {
  const cleanName = name.startsWith("@") ? name.slice(1) : name;
  let typeIdx: number | null = null;
  let modIdx: number | null = null;

  if (cleanName.startsWith("keyword")) typeIdx = 0;
  else if (cleanName === "function" || cleanName === "function.method")
    typeIdx = 1;
  else if (cleanName === "type" || cleanName === "type.builtin") typeIdx = 2;
  else if (cleanName === "variable" || cleanName === "variable.builtin")
    typeIdx = 3;
  else if (cleanName === "variable.parameter") typeIdx = 4;
  else if (cleanName === "property") typeIdx = 5;
  else if (cleanName === "constructor") typeIdx = 6;
  else if (cleanName === "string") typeIdx = 7;
  else if (cleanName === "number") typeIdx = 8;
  else if (cleanName === "comment") typeIdx = 9;
  else if (cleanName === "operator") typeIdx = 10;
  else if (cleanName.startsWith("punctuation")) typeIdx = 11;
  else if (cleanName === "attribute") typeIdx = 12;
  else if (cleanName === "type.enum") typeIdx = 13;
  else if (cleanName === "constant") typeIdx = 14;
  else if (cleanName === "method") typeIdx = 15;
  else return null;

  // Modifiers
  if (cleanName === "type.builtin" || cleanName === "variable.builtin")
    modIdx = 2; // builtin
  if (cleanName === "constant") modIdx = 1; // readonly

  return {
    type: typeIdx,
    modifiers: modIdx !== null ? 1 << modIdx : 0,
  };
}

interface TreeEntry {
  tree: Tree;
  version: number;
}

class P4Language implements vscode.DocumentSemanticTokensProvider,
  vscode.FoldingRangeProvider,
  vscode.SelectionRangeProvider {

  private parser: Parser | null = null;
  private language: Language | null = null;
  private highlightQuery: Query | null = null;
  private foldQuery: Query | null = null;
  private output: vscode.OutputChannel;

  private trees = new Map<string, TreeEntry>();
  private initPromise: Promise<void> | null = null;

  constructor(private extensionPath: string) {
    this.output = vscode.window.createOutputChannel("P4 (Tree-sitter)");
  }

  async ensureInitialized(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.init();
    return this.initPromise;
  }

  private async init(): Promise<void> {
    this.output.appendLine("Initializing P4 tree-sitter extension...");
    this.output.appendLine(`Extension path: ${this.extensionPath}`);

    try {
      this.output.appendLine(`__dirname: ${typeof __dirname !== "undefined" ? __dirname : "undefined"}`);
      await Parser.init();
      this.output.appendLine("Parser.init() done");

      this.parser = new Parser();
      this.output.appendLine("Parser created");

      const wasmPath = path.join(this.extensionPath, "dist", "tree-sitter-p4.wasm");
      this.output.appendLine(`Loading WASM from: ${wasmPath}`);
      this.output.appendLine(`WASM exists: ${fs.existsSync(wasmPath)}`);

      const wasmBytes = fs.readFileSync(wasmPath);
      this.output.appendLine(`WASM size: ${wasmBytes.length} bytes`);

      this.language = await Language.load(wasmBytes);
      this.output.appendLine("Language loaded");

      this.parser.setLanguage(this.language);
      this.output.appendLine("Language set on parser");

      const queryDir = path.join(this.extensionPath, "dist", "queries");
      this.output.appendLine(`Query dir: ${queryDir}`);

      const highlightPath = path.join(queryDir, "highlights.scm");
      this.output.appendLine(`Highlights exists: ${fs.existsSync(highlightPath)}`);

      const highlightSrc = fs.readFileSync(highlightPath, "utf-8");
      this.highlightQuery = new Query(this.language, highlightSrc);
      this.output.appendLine(`Highlight query loaded (${highlightSrc.length} chars)`);

      const foldPath = path.join(queryDir, "folds.scm");
      if (fs.existsSync(foldPath)) {
        this.foldQuery = new Query(this.language, fs.readFileSync(foldPath, "utf-8"));
        this.output.appendLine("Fold query loaded");
      }

      this.output.appendLine("Initialization complete!");
    } catch (err) {
      this.output.appendLine(`ERROR during init: ${err}`);
      throw err;
    }
  }

  private getTree(document: vscode.TextDocument): Tree | null {
    if (!this.parser) return null;

    const uri = document.uri.toString();
    const entry = this.trees.get(uri);

    if (entry && entry.version === document.version) {
      return entry.tree;
    }

    const text = document.getText();
    let tree: Tree | null;

    if (entry) {
      // Incremental parse — pass old tree
      tree = this.parser.parse(text, entry.tree);
    } else {
      tree = this.parser.parse(text);
    }

    if (tree) {
      this.trees.set(uri, { tree, version: document.version });
    }
    return tree;
  }

  // --- DocumentSemanticTokensProvider ---

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    await this.ensureInitialized();
    this.output.appendLine(`provideDocumentSemanticTokens called for: ${document.fileName}`);
    const tree = this.getTree(document);
    this.output.appendLine(`Tree: ${tree ? "ok" : "null"}, Query: ${this.highlightQuery ? "ok" : "null"}`);
    if (!tree || !this.highlightQuery) return new vscode.SemanticTokensBuilder(legend).build();

    const matches = this.highlightQuery.matches(tree.rootNode);
    this.output.appendLine(`Query matches: ${matches.length}`);
    const tokens: { line: number; char: number; len: number; type: number; mod: number }[] = [];

    for (const match of matches) {
      for (const capture of match.captures) {
        const mapped = mapCapture(capture.name);
        if (!mapped) continue;

        const node = capture.node;
        const startLine = node.startPosition.row;
        const startCol = node.startPosition.column;
        const endLine = node.endPosition.row;
        const endCol = node.endPosition.column;

        // VS Code semantic tokens can't span lines
        if (startLine === endLine) {
          tokens.push({
            line: startLine,
            char: startCol,
            len: endCol - startCol,
            type: mapped.type,
            mod: mapped.modifiers,
          });
        } else {
          // Split multi-line tokens into per-line segments
          for (let l = startLine; l <= endLine; l++) {
            const ch = l === startLine ? startCol : 0;
            const textLine = document.lineAt(l);
            const endCh = l === endLine ? endCol : textLine.text.length;
            if (endCh > ch) {
              tokens.push({
                line: l,
                char: ch,
                len: endCh - ch,
                type: mapped.type,
                mod: mapped.modifiers,
              });
            }
          }
        }
      }
    }

    // Sort by position
    tokens.sort((a, b) => a.line - b.line || a.char - b.char);

    // Remove duplicates (keep first match at each position)
    const seen = new Set<string>();
    const deduped = tokens.filter((t) => {
      const key = `${t.line}:${t.char}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const builder = new vscode.SemanticTokensBuilder(legend);
    for (const t of deduped) {
      builder.push(t.line, t.char, t.len, t.type, t.mod);
    }
    const result = builder.build();
    this.output.appendLine(`Returning ${deduped.length} tokens`);
    return result;
  }

  // --- FoldingRangeProvider ---

  async provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.FoldingRange[]> {
    await this.ensureInitialized();
    const tree = this.getTree(document);
    if (!tree || !this.foldQuery) return [];

    const matches = this.foldQuery.matches(tree.rootNode);
    const ranges: vscode.FoldingRange[] = [];

    for (const match of matches) {
      for (const capture of match.captures) {
        const node = capture.node;
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;

        if (endLine > startLine) {
          ranges.push(
            new vscode.FoldingRange(startLine, endLine, vscode.FoldingRangeKind.Region)
          );
        }
      }
    }

    return ranges;
  }

  // --- SelectionRangeProvider ---

  async provideSelectionRanges(
    document: vscode.TextDocument,
    positions: vscode.Position[],
    _token: vscode.CancellationToken
  ): Promise<vscode.SelectionRange[]> {
    await this.ensureInitialized();
    const tree = this.getTree(document);
    if (!tree) return [];

    return positions.map((pos) => {
      const offset = document.offsetAt(pos);
      let node = tree.rootNode;

      // Find the innermost node at cursor position
      while (true) {
        let found = false;
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && child.startIndex <= offset && child.endIndex > offset) {
            node = child;
            found = true;
            break;
          }
        }
        if (!found) break;
      }

      // Build selection range chain going up the AST
      let current: vscode.SelectionRange | undefined;
      let n: Node | null = node;

      while (n) {
        const range = new vscode.Range(
          n.startPosition.row,
          n.startPosition.column,
          n.endPosition.row,
          n.endPosition.column
        );
        current = new vscode.SelectionRange(range, current);
        n = n.parent;
      }

      return current ?? new vscode.SelectionRange(new vscode.Range(pos, pos));
    });
  }

  // --- Cleanup ---

  disposeDocument(uri: vscode.Uri): void {
    this.trees.delete(uri.toString());
  }

  dispose(): void {
    this.trees.clear();
    this.parser = null;
    this.language = null;
    this.highlightQuery = null;
    this.foldQuery = null;
    this.initPromise = null;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  console.log("P4 extension activating...");
  const p4 = new P4Language(context.extensionPath);

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: "p4" },
      p4,
      legend
    )
  );

  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider({ language: "p4" }, p4)
  );

  context.subscriptions.push(
    vscode.languages.registerSelectionRangeProvider({ language: "p4" }, p4)
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      p4.disposeDocument(doc.uri);
    })
  );

  context.subscriptions.push({ dispose: () => p4.dispose() });
}

export function deactivate(): void {}
