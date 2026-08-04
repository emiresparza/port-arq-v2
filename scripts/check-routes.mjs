import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";
import {
  legacyProjectMap,
  legacyProjectTarget,
  legacyStaticRedirects
} from "../content/legacy-routes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routes = [
  "/",
  "/proyectos/",
  ...projects.map((project) => `/proyectos/${project.slug}/`),
  "/servicios/",
  "/oficina-tecnica/",
  "/estudio/",
  "/contacto/",
  "/privacidad/"
];

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = requestUrl.pathname;
  const staticRedirect = legacyStaticRedirects.get(pathname);
  const isLegacyProjectRoute = pathname === "/proyecto" || pathname === "/proyecto.html";
  const redirectTarget = staticRedirect || (isLegacyProjectRoute
    ? legacyProjectTarget(requestUrl.searchParams.get("id") || "")
    : "");

  if (redirectTarget) {
    response.writeHead(301, { location: staticRedirect ? `${redirectTarget}${requestUrl.search}` : redirectTarget });
    response.end();
    return;
  }

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

for (const [from, target] of legacyStaticRedirects) {
  const response = await fetch(`http://127.0.0.1:${port}${from}`, { redirect: "manual" });
  if (response.status !== 301 || response.headers.get("location") !== target) {
    failures.push(`${from} (${response.status} -> ${response.headers.get("location")})`);
  }

  const tracked = await fetch(`http://127.0.0.1:${port}${from}?utm_source=legacy`, { redirect: "manual" });
  if (tracked.status !== 301 || tracked.headers.get("location") !== `${target}?utm_source=legacy`) {
    failures.push(`${from}?utm_source=legacy (${tracked.status} -> ${tracked.headers.get("location")})`);
  }
}

for (const id of Object.keys(legacyProjectMap)) {
  const target = legacyProjectTarget(id);
  for (const pathname of ["/proyecto", "/proyecto.html"]) {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}?id=${id}`, { redirect: "manual" });
    if (response.status !== 301 || response.headers.get("location") !== target) {
      failures.push(`${pathname}?id=${id} (${response.status} -> ${response.headers.get("location")})`);
    }
  }
}

server.close();

if (failures.length) {
  console.error(`Rutas con error: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`Rutas correctas: ${routes.length} respuestas 200, ${legacyStaticRedirects.size + Object.keys(legacyProjectMap).length * 2} redirecciones 301 y página 404 verificada.`);
