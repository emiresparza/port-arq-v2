import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  legacyProjectTarget,
  legacyStaticRedirects
} from "../content/legacy-routes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = decodeURIComponent(requestUrl.pathname);
  const staticRedirect = legacyStaticRedirects.get(pathname);
  const isLegacyProjectRoute = pathname === "/proyecto" || pathname === "/proyecto.html";
  const redirectTarget = staticRedirect || (isLegacyProjectRoute
    ? legacyProjectTarget(requestUrl.searchParams.get("id") || "")
    : "");

  if (redirectTarget) {
    response.writeHead(301, {
      location: redirectTarget,
      "cache-control": "public, max-age=3600"
    });
    response.end();
    return;
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const candidate = path.extname(relative) ? relative : path.join(relative, "index.html");
  let filePath = path.resolve(root, candidate);
  let status = 200;

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, "404.html");
    status = 404;
  }

  const extension = path.extname(filePath).toLowerCase();
  const type = contentTypes[extension] || "application/octet-stream";
  const headers = {
    "content-type": type,
    "cache-control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
  };
  const acceptsGzip = /\bgzip\b/.test(request.headers["accept-encoding"] || "");
  const compressible = /^(text\/|application\/(?:javascript|json|xml))/.test(type);
  const stream = fs.createReadStream(filePath);

  if (acceptsGzip && compressible) {
    headers["content-encoding"] = "gzip";
    headers.vary = "Accept-Encoding";
    response.writeHead(status, headers);
    stream.pipe(zlib.createGzip()).pipe(response);
    return;
  }

  response.writeHead(status, headers);
  stream.pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`EEAD disponible en http://127.0.0.1:${port}`);
});
