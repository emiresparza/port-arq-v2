import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const indexableFiles = [
  "index.html",
  "proyectos/index.html",
  ...projects.map((project) => `proyectos/${project.slug}/index.html`),
  "servicios/index.html",
  "oficina-tecnica/index.html",
  "estudio/index.html",
  "contacto/index.html"
];

const allHtmlFiles = [
  ...indexableFiles,
  "404.html",
  "projects.html",
  "proyecto.html",
  "nosotros.html",
  "blog.html",
  "post.html"
];

function report(condition, message) {
  if (!condition) errors.push(message);
}

function resolvePublicPath(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return path.join(root, "index.html");
  const relative = decodeURIComponent(clean).replace(/^\//, "");
  if (path.extname(relative)) return path.join(root, relative);
  return path.join(root, relative, "index.html");
}

for (const relativePath of allHtmlFiles) {
  const filePath = path.join(root, relativePath);
  report(fs.existsSync(filePath), `Falta ${relativePath}`);
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, "utf8");
  const isIndexable = indexableFiles.includes(relativePath);

  if (isIndexable || relativePath === "404.html") {
    report((html.match(/<h1(?:\s|>)/g) || []).length === 1, `${relativePath}: debe tener exactamente un H1`);
    report(/<meta name="description" content="[^"]{50,}">/.test(html), `${relativePath}: falta una description útil`);
    report(/<link rel="canonical" href="https:\/\/eead\.cl\/[^"]*">/.test(html), `${relativePath}: canonical inválido`);
    report(/<meta property="og:title" content="[^"]+">/.test(html), `${relativePath}: falta og:title`);
    report(/<meta property="og:description" content="[^"]+">/.test(html), `${relativePath}: falta og:description`);
    report(/<meta property="og:image" content="https:\/\/eead\.cl\/[^"]+">/.test(html), `${relativePath}: falta og:image`);
    report(/<script type="application\/ld\+json">.+<\/script>/.test(html), `${relativePath}: falta JSON-LD`);
    report(!/placeholder\s*=/.test(html), `${relativePath}: contiene placeholder`);
  }

  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    const attributes = match[1];
    report(/\bsrc="[^"]+"/.test(attributes), `${relativePath}: imagen sin src`);
    report(/\bwidth="\d+"/.test(attributes), `${relativePath}: imagen sin width`);
    report(/\bheight="\d+"/.test(attributes), `${relativePath}: imagen sin height`);
    report(/\bloading="(?:lazy|eager)"/.test(attributes), `${relativePath}: imagen sin estrategia de carga`);
    report(/\balt="[^"]*"/.test(attributes), `${relativePath}: imagen sin atributo alt`);

    if (!/\bdata-brand-image\b/.test(attributes)) {
      report(/\bsrcset="[^"]+"/.test(attributes), `${relativePath}: imagen sin srcset`);
      report(/\bsizes="[^"]+"/.test(attributes), `${relativePath}: imagen sin sizes`);
      report(/\balt="[^"]+"/.test(attributes), `${relativePath}: imagen sin alt descriptivo`);
    }

    const src = attributes.match(/\bsrc="([^"]+)"/)?.[1];
    if (src?.startsWith("/")) {
      const decodedSrc = decodeURIComponent(src);
      report(fs.existsSync(path.join(root, decodedSrc.replace(/^\//, ""))), `${relativePath}: no existe la imagen ${src}`);
    }
  }

  for (const match of html.matchAll(/<source\b([^>]+)>/g)) {
    const srcset = match[1].match(/\bsrcset="([^"]+)"/)?.[1] || "";
    for (const candidate of srcset.split(",")) {
      const source = candidate.trim().split(/\s+/)[0];
      if (source.startsWith("/")) {
        const decodedSource = decodeURIComponent(source);
        report(fs.existsSync(path.join(root, decodedSource.replace(/^\//, ""))), `${relativePath}: no existe la variante ${source}`);
      }
    }
  }

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (
      !href.startsWith("/") ||
      href.startsWith("//") ||
      href.startsWith("/#") ||
      href.startsWith("/mailto:")
    ) {
      continue;
    }
    report(fs.existsSync(resolvePublicPath(href)), `${relativePath}: enlace roto ${href}`);
  }
}

const publicHtml = indexableFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
report(!publicHtml.includes("Emir Esparza Arquitectura y Diseño"), "La denominación pública anterior todavía aparece");
report(!publicHtml.includes(">EEF.<"), "La marca EEF todavía aparece");
report(!publicHtml.includes(">Blog<"), "Blog todavía aparece en la navegación pública");

const studio = fs.readFileSync(path.join(root, "estudio/index.html"), "utf8");
const pagesOutsideStudio = indexableFiles
  .filter((file) => file !== "estudio/index.html")
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
report(studio.includes("Emir Esparza"), "Estudio debe identificar al fundador y director");
report(!pagesOutsideStudio.includes("Emir Esparza"), "El nombre del director solo debe aparecer en Estudio");

if (errors.length) {
  console.error(`Validación fallida (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validación correcta: ${indexableFiles.length} páginas indexables, ${projects.length} proyectos y enlaces internos verificados.`);
