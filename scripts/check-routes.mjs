import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routes = [
  "/",
  "/proyectos/",
  ...projects.map((project) => `/proyectos/${project.slug}/`),
  "/servicios/",
  "/oficina-tecnica/",
  "/estudio/",
  "/contacto/"
];

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const candidate = path.extname(relative) ? relative : path.join(relative, "index.html");
  const filePath = path.resolve(root, candidate);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    response.end(fs.readFileSync(path.join(root, "404.html")));
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const failures = [];

for (const route of routes) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`);
  const html = await response.text();
  if (response.status !== 200 || !/<h1(?:\s|>)/.test(html)) {
    failures.push(`${route} (${response.status})`);
  }
}

const missing = await fetch(`http://127.0.0.1:${port}/ruta-inexistente/`);
if (missing.status !== 404) failures.push(`/ruta-inexistente/ (${missing.status})`);

server.close();

if (failures.length) {
  console.error(`Rutas con error: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`Rutas correctas: ${routes.length} respuestas 200 y página 404 verificada.`);
