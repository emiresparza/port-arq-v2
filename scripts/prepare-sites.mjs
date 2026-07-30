import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");

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
  publicEntries.map((entry) =>
    fs.cp(path.join(root, entry), path.join(client, entry), { recursive: true })
  )
);

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

console.log(`Salida Sites preparada: ${publicEntries.length} entradas estáticas.`);
