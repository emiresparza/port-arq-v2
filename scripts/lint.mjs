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
  "content/legacy-routes.mjs",
  "functions/proyecto.js",
  "functions/proyecto.html.js",
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
const authorizedVisualBlocks = [
  {
    name: "dither-pattern",
    validates: (block) => /radial-gradient/.test(block) && /mask-image:\s*linear-gradient/.test(block)
  },
  {
    name: "hero-contrast",
    validates: (block) => (block.match(/linear-gradient/g) || []).length === 2 && /rgba\(67,\s*67,\s*67/.test(block)
  },
  {
    name: "hero-dither",
    validates: (block) => /radial-gradient/.test(block) && /mask-image:\s*linear-gradient/.test(block)
  },
  {
    name: "services-hero-contrast",
    validates: (block) => (block.match(/linear-gradient/g) || []).length === 1 && /rgba\(15,\s*15,\s*15/.test(block)
  },
  {
    name: "services-hero-mobile-contrast",
    validates: (block) => (block.match(/linear-gradient/g) || []).length === 1 && /rgba\(15,\s*15,\s*15/.test(block)
  },
  {
    name: "studio-hero-contrast",
    validates: (block) => (block.match(/linear-gradient/g) || []).length === 2 && /rgba\(15,\s*15,\s*15/.test(block)
  }
];

let cssWithoutAuthorizedVisuals = css;
for (const { name, validates } of authorizedVisualBlocks) {
  const expression = new RegExp(`/\\* ${name}:start \\*/([\\s\\S]*?)/\\* ${name}:end \\*/`, "g");
  const blocks = [...css.matchAll(expression)];
  if (blocks.length !== 1 || !validates(blocks[0][1])) {
    console.error(`styles.css: el bloque visual ${name} no cumple su implementación autorizada.`);
    process.exit(1);
  }
  cssWithoutAuthorizedVisuals = cssWithoutAuthorizedVisuals.replace(expression, "");
}

if (/linear-gradient|radial-gradient|conic-gradient/.test(cssWithoutAuthorizedVisuals)) {
  console.error("styles.css: se detectó un gradiente fuera de los bloques visuales autorizados.");
  process.exit(1);
}

if (/cursor:\s*none/.test(css)) {
  console.error("styles.css: no se permite ocultar el cursor del sistema.");
  process.exit(1);
}

console.log(`Lint correcto: ${javascriptFiles.length} archivos JavaScript y reglas visuales verificadas.`);
