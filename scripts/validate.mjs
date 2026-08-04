import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const directorName = ["Emir", "Esparza"].join(" ");
const indexableFiles = [
  "index.html",
  "proyectos/index.html",
  ...projects.map((project) => `proyectos/${project.slug}/index.html`),
  "servicios/index.html",
  "oficina-tecnica/index.html",
  "estudio/index.html",
  "contacto/index.html",
  "privacidad/index.html"
];

const allHtmlFiles = [
  ...indexableFiles,
  "404.html"
];
const legacyHtmlFiles = ["projects.html", "proyecto.html", "nosotros.html", "blog.html", "post.html"];
const oldProjectPaths = [
  "/proyectos/big-dreams/",
  "/proyectos/casa-alicia/",
  "/proyectos/casa-cg/",
  "/proyectos/oficina-gl/",
  "/proyectos/render-pocuro/",
  "/proyectos/zenteno/"
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
  }

  if (isIndexable) {
    const pathname = relativePath === "index.html" ? "/" : `/${relativePath.replace(/index\.html$/, "")}`;
    const canonical = `https://eead.cl${pathname}`;
    report((html.match(/<link rel="canonical"/g) || []).length === 1, `${relativePath}: debe tener un canonical`);
    report(html.includes(`<link rel="canonical" href="${canonical}">`), `${relativePath}: canonical no coincide con su ruta`);
    report(html.includes(`<meta property="og:url" content="${canonical}">`), `${relativePath}: og:url no coincide con canonical`);
    report(!oldProjectPaths.some((oldPath) => html.includes(`href="${oldPath}`)), `${relativePath}: contiene enlace interno a un slug antiguo`);

    const jsonText = html.match(/<script type="application\/ld\+json">(.+)<\/script>/)?.[1];
    try {
      const data = JSON.parse(jsonText);
      report(JSON.stringify(data).includes(canonical), `${relativePath}: JSON-LD no contiene su URL canónica`);
      if (pathname !== "/") {
        const graph = Array.isArray(data) ? data : [data];
        report(graph.some((item) => item?.["@type"] === "BreadcrumbList"), `${relativePath}: falta BreadcrumbList`);
      }
    } catch {
      report(false, `${relativePath}: JSON-LD inválido`);
    }
  }

  for (const match of html.matchAll(/<(?:input|textarea)\b([^>]*\bplaceholder="[^"]*"[^>]*)>/g)) {
    const attributes = match[1];
    const id = attributes.match(/\bid="([^"]+)"/)?.[1];
    report(Boolean(id), `${relativePath}: campo con placeholder sin id`);
    if (id) {
      report(
        new RegExp(`<label\\s+for="${id}"`).test(html),
        `${relativePath}: el placeholder de #${id} no tiene un label visible asociado`
      );
    }
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

for (const legacyFile of legacyHtmlFiles) {
  report(!fs.existsSync(path.join(root, legacyFile)), `${legacyFile} no debe seguir entregando HTML con estado 200`);
}

const publicHtml = indexableFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
report(!publicHtml.includes(`${directorName} Arquitectura y Diseño`), "La denominación pública anterior todavía aparece");
report(!publicHtml.includes(">EEF.<"), "La marca EEF todavía aparece");
report(!publicHtml.includes(">Blog<"), "Blog todavía aparece en la navegación pública");
report(!oldProjectPaths.some((oldPath) => publicHtml.includes(oldPath)), "Una URL antigua todavía aparece en HTML indexable");

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = indexableFiles.map((file) => `https://eead.cl${file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`}`);
report(new Set(sitemapUrls).size === sitemapUrls.length, "sitemap.xml contiene URLs duplicadas");
report(sitemapUrls.length === expectedUrls.length && expectedUrls.every((url) => sitemapUrls.includes(url)), "sitemap.xml no coincide con las rutas indexables");
report(!oldProjectPaths.some((oldPath) => sitemap.includes(oldPath)), "sitemap.xml contiene una URL antigua");

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
report(robots.includes("Sitemap: https://eead.cl/sitemap.xml"), "robots.txt no declara el sitemap canónico");
report(!/Disallow:\s*\/(?:assets|proyectos|servicios)/.test(robots), "robots.txt bloquea recursos o rutas públicas");

const studio = fs.readFileSync(path.join(root, "estudio/index.html"), "utf8");
const pagesOutsideStudio = indexableFiles
  .filter((file) => file !== "estudio/index.html" && !file.startsWith("proyectos/"))
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
report(studio.includes(directorName), "Estudio debe identificar al fundador y director");
report(!pagesOutsideStudio.includes(directorName), "El nombre del director solo debe aparecer en Estudio y en los créditos de proyectos");

if (errors.length) {
  console.error(`Validación fallida (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validación correcta: ${indexableFiles.length} páginas indexables, ${projects.length} proyectos y enlaces internos verificados.`);
