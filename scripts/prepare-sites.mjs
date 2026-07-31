import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");
const assets = path.join(root, "assets");
const clientAssets = path.join(client, "assets");
const projectDetails = path.join(assets, "img", "project-details");

const publicEntries = [
  "404.html",
  "_redirects",
  "_routes.json",
  "assets",
  "contacto",
  "estudio",
  "index.html",
  "main.js",
  "oficina-tecnica",
  "privacidad",
  "proyectos",
  "robots.txt",
  "servicios",
  "sitemap.xml",
  "styles.css"
];

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(client, { recursive: true });
await fs.mkdir(server, { recursive: true });

await Promise.all(
  publicEntries.filter((entry) => entry !== "assets").map((entry) =>
    fs.cp(path.join(root, entry), path.join(client, entry), { recursive: true })
  )
);

await fs.cp(assets, clientAssets, {
  recursive: true,
  filter: (source) =>
    source !== projectDetails &&
    !source.startsWith(`${projectDetails}${path.sep}`)
});

async function htmlFiles(entry) {
  const stats = await fs.stat(entry);
  if (stats.isFile()) return path.extname(entry) === ".html" ? [entry] : [];

  const children = await fs.readdir(entry, { withFileTypes: true });
  const nested = await Promise.all(
    children.map((child) => htmlFiles(path.join(entry, child.name)))
  );
  return nested.flat();
}

const htmlSources = (
  await Promise.all(
    publicEntries
      .filter((entry) => entry !== "assets")
      .map((entry) => htmlFiles(path.join(root, entry)))
  )
).flat();

const referencedProjectImages = new Set();
for (const htmlFile of htmlSources) {
  const html = await fs.readFile(htmlFile, "utf8");
  for (const match of html.matchAll(/(?:https:\/\/eead\.cl)?(\/assets\/img\/project-details\/[^"'<>\\\s]+)/g)) {
    referencedProjectImages.add(decodeURIComponent(match[1]));
  }
}

for (const publicPath of referencedProjectImages) {
  const relativePath = publicPath.replace(/^\/assets\//, "");
  const source = path.join(assets, relativePath);
  const target = path.join(clientAssets, relativePath);
  const relativeSource = path.relative(projectDetails, source);

  if (relativeSource.startsWith("..") || path.isAbsolute(relativeSource)) {
    throw new Error(`Recurso fuera del directorio permitido: ${publicPath}`);
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

await fs.writeFile(
  path.join(server, "index.js"),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
`,
  "utf8"
);

console.log(
  `Salida Sites preparada: ${publicEntries.length} entradas estáticas y ` +
  `${referencedProjectImages.size} originales de proyecto referenciados.`
);
