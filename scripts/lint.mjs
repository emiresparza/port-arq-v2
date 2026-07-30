import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const javascriptFiles = [
  "main.js",
  "scripts/build.mjs",
  "scripts/optimize-images.mjs",
  "scripts/check-routes.mjs",
  "scripts/serve.mjs",
  "scripts/validate.mjs",
  "scripts/lint.mjs",
  "content/projects.mjs",
  "tests/site.test.mjs"
];

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
}

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
if (/linear-gradient|radial-gradient|conic-gradient/.test(css)) {
  console.error("styles.css: la dirección visual no permite gradientes.");
  process.exit(1);
}

if (/cursor:\s*none/.test(css)) {
  console.error("styles.css: no se permite ocultar el cursor del sistema.");
  process.exit(1);
}

console.log(`Lint correcto: ${javascriptFiles.length} archivos JavaScript y reglas visuales verificadas.`);
