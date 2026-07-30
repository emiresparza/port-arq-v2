import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";
import { legacyProjectMap, legacyProjectTarget } from "../content/legacy-routes.mjs";
import { onRequest as legacyProjectRedirect } from "../functions/proyecto.js";
import { onRequest as legacyProjectHtmlRedirect } from "../functions/proyecto.html.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hasNestedAnchors(html) {
  let depth = 0;
  for (const match of html.matchAll(/<\/?a\b[^>]*>/g)) {
    if (match[0].startsWith("</")) depth -= 1;
    else {
      if (depth > 0) return true;
      depth += 1;
    }
  }
  return false;
}

test("la arquitectura pública contiene todas las rutas requeridas", () => {
  const routes = [
    "index.html",
    "proyectos/index.html",
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html",
    "privacidad/index.html",
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
    assert.match(html, /Decisión/);
    assert.match(html, /Desarrollo/);
    assert.match(html, /Galería/);
    assert.match(html, /Proyectos relacionados/);
  });
});

test("la home conserva SEO y aplica la composición editorial de referencia", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const expectedH1 = "<h1><span>Arquitectura</span><span>diseñada para</span><span>construirse</span><span>mejor.</span></h1>";
  const carouselLinks = [...html.matchAll(/<article class="project-carousel__slide"[\s\S]*?<a href="(\/proyectos\/[^"]+\/)"/g)]
    .map((match) => match[1]);

  assert.ok(html.includes(expectedH1));
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.ok(html.indexOf('class="hero__media"') < html.indexOf('class="hero__contrast"'));
  assert.ok(html.indexOf('class="hero__contrast"') < html.indexOf('class="hero__dither"'));
  assert.ok(html.indexOf('class="hero__dither"') < html.indexOf('class="hero__content hero__grid"'));
  assert.ok(html.indexOf('class="editorial-ticker"') < html.indexOf('class="manifesto"'));
  assert.match(html, /class="hero__image"[\s\S]*?loading="eager"[\s\S]*?fetchpriority="high"/);
  assert.equal(carouselLinks.length, projects.length);
  assert.equal(new Set(carouselLinks).size, projects.length);
  carouselLinks.forEach((href) => {
    const slug = href.split("/").filter(Boolean).at(-1);
    assert.ok(projects.some((project) => project.slug === slug), href);
  });
  assert.ok(html.includes('aria-roledescription="carrusel"'));
  assert.ok(html.includes('aria-label="Todos los proyectos"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(!html.includes("data-carousel-meta"));
  assert.ok(!html.includes("data-meta="));
  assert.ok(html.includes('class="button button--primary button--compact home-projects__cta"'));
  assert.ok(!html.includes("hero__title-field"));
  assert.ok(html.includes('<span class="footer-wordmark">EEAD</span>'));
  assert.ok(!hasNestedAnchors(html));
  assert.match(html, /<title>EEAD — Arquitectura e interiorismo en Temuco<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/eead\.cl\/">/);
  assert.match(html, /"@type":"ProfessionalService"/);
});

test("el hero incorpora movimiento limitado, dither fijo y ticker accesible", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const javascript = fs.readFileSync(path.join(root, "main.js"), "utf8");

  assert.ok(html.includes("data-hero-motion"));
  assert.ok(html.includes("data-hero-scroll"));
  assert.ok(html.includes("data-hero-pointer"));
  const tickerGroups = [...html.matchAll(/<div class="editorial-ticker__group" aria-hidden="true">([\s\S]*?)<\/div>/g)]
    .map((match) => match[1]);
  assert.equal(tickerGroups.length, 2);
  assert.equal(tickerGroups[0], tickerGroups[1]);
  assert.match(html, /editorial-ticker__viewport" aria-hidden="true"/);
  assert.match(html, /<p class="sr-only">Arquitectura e interiorismo\./);

  assert.match(css, /\/\* hero-contrast:start \*\//);
  assert.match(css, /\/\* hero-dither:start \*\//);
  assert.match(css, /@keyframes eead-ticker/);
  assert.match(css, /animation:\s*eead-ticker 28s linear infinite/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*?editorial-ticker__track[\s\S]*?animation:\s*none !important/);

  assert.match(javascript, /IntersectionObserver/);
  assert.match(javascript, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(javascript, /pointerleave/);
  assert.match(javascript, /\* 0\.06/);
  assert.match(javascript, /currentPointerX \* 14/);
  assert.match(javascript, /currentPointerY \* 10/);
  assert.match(javascript, /targetScrollY = viewportHeight \* \(-0\.015 \+ \(progress \* 0\.05\)\)/);
});

test("Syne 800 se carga localmente y solo se aplica al wordmark del footer", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const syneDeclarations = css.match(/font-family:\s*"Syne"/g) || [];

  assert.ok(fs.existsSync(path.join(root, "assets/fonts/syne-latin-800-normal.woff2")));
  assert.equal(syneDeclarations.length, 2);
  assert.match(css, /\.footer-wordmark\s*\{[\s\S]*?font-family:\s*"Syne", sans-serif;/);
  assert.match(css, /\.manifesto::before,[\s\S]*?radial-gradient/);
});

test("el carrusel usa controles nativos accesibles sin autoplay ni dependencias", () => {
  const javascript = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  assert.match(javascript, /data-carousel-viewport/);
  assert.match(javascript, /ArrowLeft/);
  assert.match(javascript, /ArrowRight/);
  assert.match(javascript, /scrollend/);
  assert.match(javascript, /prefers-reduced-motion/);
  assert.match(javascript, /data-carousel-clone/);
  assert.match(javascript, /setAttribute\("aria-hidden", "true"\)/);
  assert.match(javascript, /setAttribute\("inert", ""\)/);
  assert.match(javascript, /removeAttribute\("href"\)/);
  assert.match(javascript, /const wrapIndex/);
  assert.doesNotMatch(javascript, /previousButton\.disabled|nextButton\.disabled/);
  assert.doesNotMatch(javascript, /setInterval/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /flex-basis:\s*84vw/);
});

test("cada página indexable tiene un title y canonical únicos", () => {
  const files = [
    "index.html",
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html",
    "privacidad/index.html"
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
    'href="mailto:emiresparza@gmail.com"',
    'href="https://wa.me/56987283154"',
    'href="/privacidad/"',
    'aria-live="polite"'
  ].forEach((value) => assert.ok(html.includes(value), value));
});

test("las páginas HTML legacy ya no se publican", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(!home.includes(">Blog<"));
  ["projects.html", "proyecto.html", "nosotros.html", "blog.html", "post.html"].forEach((file) => {
    assert.ok(!fs.existsSync(path.join(root, file)), file);
  });
});

test("el mapa legacy cubre los 35 IDs históricos con destinos válidos", () => {
  assert.equal(Object.keys(legacyProjectMap).length, 35);
  const activeSlugs = new Set(projects.map((project) => project.slug));
  Object.entries(legacyProjectMap).forEach(([id, slug]) => {
    assert.match(id, /^[a-z0-9-]+$/);
    if (slug) assert.ok(activeSlugs.has(slug), `${id} -> ${slug}`);
    assert.match(legacyProjectTarget(id), /^\/proyectos\/(?:[a-z0-9-]+\/)?$/);
  });
});

test("las Functions de Cloudflare responden 301 para ambos endpoints legacy", () => {
  for (const id of Object.keys(legacyProjectMap)) {
    const expected = `https://eead.cl${legacyProjectTarget(id)}`;
    for (const handler of [legacyProjectRedirect, legacyProjectHtmlRedirect]) {
      const response = handler({
        request: new Request(`https://eead.cl/proyecto?id=${id}`)
      });
      assert.equal(response.status, 301);
      assert.equal(response.headers.get("location"), expected);
    }
  }
});
