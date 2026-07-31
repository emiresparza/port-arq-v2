import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { projects } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const optimizedRoot = path.join(root, "assets", "img", "optimized");
const fontSource = path.join(root, "node_modules", "@fontsource-variable", "manrope", "files", "manrope-latin-wght-normal.woff2");
const fontDestination = path.join(root, "assets", "fonts", "manrope-latin-variable.woff2");
fs.mkdirSync(path.dirname(fontDestination), { recursive: true });
fs.copyFileSync(fontSource, fontDestination);

const brandSourceDirectory = path.join(root, "assets", "Logos");
const brandDirectory = path.join(root, "assets", "brand");
const brandFullSource = path.join(brandSourceDirectory, "Logo _ EEAD Full.svg");
const brandSymbolSource = path.join(brandSourceDirectory, "Logo _ EEAD Solo Simbolo o Favicon.svg");
const brandFullDestination = path.join(brandDirectory, "eead-full.svg");
const brandSymbolDestination = path.join(brandDirectory, "eead-symbol.svg");
fs.mkdirSync(brandDirectory, { recursive: true });
fs.copyFileSync(brandFullSource, brandFullDestination);
fs.copyFileSync(brandSymbolSource, brandSymbolDestination);

const faviconPath = path.join(root, "assets", "favicon.png");
await sharp(brandSymbolSource)
  .resize(180, 180)
  .png({ palette: true })
  .toFile(faviconPath);

const sources = new Set(
  [
    "/assets/img/oficina-tecnica/hero-oficina-tecnica.png",
    "/assets/img/estudio/estudio-eead-hero.jpg",
    "/assets/img/estudio/emir-esparza-perfil.png",
    ...projects.flatMap((project) => [
      project.cover,
      ...project.images.map(([src]) => src)
    ])
  ]
);

const targetWidths = (sourceWidth) => {
  const widths = [480, 640, 800, 960, 1200, 1600, 1920].filter((width) => width < sourceWidth);
  widths.push(Math.min(sourceWidth, 1920));
  return [...new Set(widths)].sort((a, b) => a - b);
};

const outputPath = (publicPath, width, extension) => {
  const relative = publicPath
    .replace(/^\/assets\/img\//, "")
    .replace(/\.[^.]+$/, `-${width}.${extension}`);
  return path.join(root, "assets", "img", "optimized", relative);
};

let generated = 0;
let reused = 0;
let removed = 0;
const expectedOutputs = new Set();

for (const publicPath of sources) {
  const sourcePath = path.join(root, publicPath.replace(/^\//, ""));
  const metadata = await sharp(sourcePath).metadata();

  if (!metadata.width) {
    throw new Error(`No fue posible leer ${publicPath}`);
  }

  for (const width of targetWidths(metadata.width)) {
    for (const extension of ["webp", "avif"]) {
      const destination = outputPath(publicPath, width, extension);
      expectedOutputs.add(path.resolve(destination).toLowerCase());
      fs.mkdirSync(path.dirname(destination), { recursive: true });

      const isCurrent =
        fs.existsSync(destination) &&
        fs.statSync(destination).mtimeMs >= fs.statSync(sourcePath).mtimeMs;

      if (isCurrent) {
        reused += 1;
        continue;
      }

      const pipeline = sharp(sourcePath)
        .rotate()
        .resize({ width, withoutEnlargement: true });

      if (extension === "webp") {
        await pipeline.webp({ quality: 80, effort: 5 }).toFile(destination);
      } else {
        await pipeline.avif({ quality: 52, effort: 5 }).toFile(destination);
      }
      generated += 1;
    }
  }
}

const pruneGeneratedImages = (directory) => {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      pruneGeneratedImages(entryPath);
      if (fs.readdirSync(entryPath).length === 0) fs.rmdirSync(entryPath);
    } else if (!expectedOutputs.has(path.resolve(entryPath).toLowerCase())) {
      fs.unlinkSync(entryPath);
      removed += 1;
    }
  }
};

pruneGeneratedImages(optimizedRoot);

console.log(`Imágenes: ${generated} variantes generadas, ${reused} reutilizadas y ${removed} obsoletas eliminadas.`);
