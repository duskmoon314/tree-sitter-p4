import * as esbuild from "esbuild";
import { cpSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  alias: {
    "web-tree-sitter": resolve(__dirname, "node_modules/web-tree-sitter/web-tree-sitter.cjs"),
  },
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false,
});

if (watch) {
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();

  // Copy assets to dist/
  mkdirSync(resolve(__dirname, "dist/queries"), { recursive: true });

  const assets = [
    {
      src: resolve(__dirname, "node_modules/web-tree-sitter/web-tree-sitter.wasm"),
      dst: resolve(__dirname, "dist/web-tree-sitter.wasm"),
    },
    {
      src: resolve(repoRoot, "tree-sitter-p4.wasm"),
      dst: resolve(__dirname, "dist/tree-sitter-p4.wasm"),
    },
  ];

  const queryFiles = ["highlights.scm", "folds.scm", "injections.scm"];
  for (const qf of queryFiles) {
    assets.push({
      src: resolve(repoRoot, "queries", qf),
      dst: resolve(__dirname, "dist/queries", qf),
    });
  }

  for (const { src, dst } of assets) {
    if (existsSync(src)) {
      cpSync(src, dst);
      console.log(`Copied: ${src}`);
    } else {
      console.warn(`Warning: ${src} not found, skipping`);
    }
  }

  console.log("Build complete.");
}
