import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la arquitectura pública contiene todas las rutas requeridas", () => {
  const routes = [
    "index.html",
    "proyectos/index.html",
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html",
    "404.html"
  ];
  routes.forEach((route) => assert.ok(fs.existsSync(path.join(root, route)), route));
});

test("cada proyecto tiene una ruta estática con contenido editorial inicial", () => {
  assert.ok(projects.length >= 8 && projects.length <= 12);

  projects.forEach((project) => {
    const file = path.join(root, "proyectos", project.slug, "index.html");
    assert.ok(fs.existsSync(file), project.slug);
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, new RegExp(`<h1>${project.title}</h1>`));
    assert.match(html, /El problema/);
    assert.match(html, /Decisión arquitectónica/);
    assert.match(html, /Desarrollo/);
    assert.match(html, /Galería/);
    assert.match(html, /Proyectos relacionados/);
  });
});

test("cada página indexable tiene un title y canonical únicos", () => {
  const files = [
    "index.html",
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html"
  ];
  const titles = new Set();
  const canonicals = new Set();

  files.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.ok(title, file);
    assert.ok(canonical, file);
    assert.ok(!titles.has(title), `title repetido: ${title}`);
    assert.ok(!canonicals.has(canonical), `canonical repetido: ${canonical}`);
    titles.add(title);
    canonicals.add(canonical);
  });
});

test("el formulario incluye campos, estados accesibles y dos motivos", () => {
  const html = fs.readFileSync(path.join(root, "contacto/index.html"), "utf8");
  [
    'name="nombre"',
    'name="correo"',
    'name="telefono"',
    'name="tipo_encargo"',
    'name="ubicacion"',
    'name="etapa_actual"',
    'name="mensaje"',
    "Quiero desarrollar un proyecto",
    "Necesito apoyo técnico",
    'aria-live="polite"'
  ].forEach((value) => assert.ok(html.includes(value), value));
});

test("Blog queda fuera de navegación e indexación", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const legacyBlog = fs.readFileSync(path.join(root, "blog.html"), "utf8");
  assert.ok(!home.includes(">Blog<"));
  assert.match(legacyBlog, /noindex, follow/);
});
