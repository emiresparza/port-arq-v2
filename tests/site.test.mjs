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

test("cada proyecto usa una ficha editorial compacta y conserva su navegación", () => {
  assert.ok(projects.length >= 8 && projects.length <= 12);
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  projects.forEach((project) => {
    const file = path.join(root, "proyectos", project.slug, "index.html");
    assert.ok(fs.existsSync(file), project.slug);
    const html = fs.readFileSync(file, "utf8");
    const description = html.match(/<p class="project-description">([\s\S]*?)<\/p>/)?.[1] || "";
    const facts = [...html.matchAll(/<dl class="project-meta">[\s\S]*?<\/dl>/g)]
      .flatMap((match) => [...match[0].matchAll(/<dt>/g)]);
    const galleryItems = [...html.matchAll(/<figure class="project-gallery-item /g)];
    const relatedCards = html.match(/<div class="related-grid">([\s\S]*?)<\/div>\s*<\/section>/)?.[1]
      .match(/<article class="project-card"/g) || [];

    assert.match(html, new RegExp(`<h1 class="project-title">${project.title}</h1>`));
    assert.match(html, /<body class="page-project-detail">/);
    assert.ok(description.split(/\s+/).filter(Boolean).length <= 200, project.slug);
    assert.ok(facts.length <= 6, project.slug);
    assert.ok(galleryItems.length <= 4, project.slug);
    assert.equal(relatedCards.length, Math.min(project.related.length, 3), project.slug);
    assert.match(html, /<nav class="project-nav project-container"/);
    assert.match(html, /rel="prev"/);
    assert.match(html, /rel="next"/);
    assert.match(html, /Secuencia visual/);
    assert.match(html, /Proyectos relacionados/);
    assert.doesNotMatch(html, /project-narrative|El problema|<figcaption>/);
  });

  assert.match(css, /\.project-hero__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(12/);
  assert.match(css, /\.project-cover\s*\{[\s\S]*?max-height:\s*70svh;[\s\S]*?aspect-ratio:\s*2 \/ 1/);
  assert.match(css, /\.related-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.project-cover\s*\{[\s\S]*?aspect-ratio:\s*4 \/ 3/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.project-nav\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /project-narrative|project-pagination|gallery-item--/);
});

test("el índice de proyectos conserva un orden curado y una grilla editorial regular", () => {
  const html = fs.readFileSync(path.join(root, "proyectos/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const projectLinks = [...html.matchAll(/<article class="project-card"[\s\S]*?<a href="\/proyectos\/([^/]+)\//g)]
    .map((match) => match[1]);

  assert.deepEqual(projectLinks, [
    "antu",
    "big-dreams",
    "casa-alicia",
    "casa-bv",
    "casa-cg",
    "cdl",
    "homeoffice-cg",
    "oficina-gl",
    "quincho-ss",
    "render-pocuro",
    "zenteno"
  ]);
  assert.match(html, /<body class="page-projects">/);
  assert.match(css, /\.page-projects \.project-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.page-projects \.project-grid\s*\{[\s\S]*?repeat\(2/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-projects \.project-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /project-grid--editorial|project-card--featured/);
});

test("la oficina técnica conserva una estructura editorial compacta y responsive", () => {
  const html = fs.readFileSync(path.join(root, "oficina-tecnica/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const standardFooter = html.slice(html.indexOf('<footer class="site-footer">'));

  assert.match(html, /<body class="page-technical">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /Capacidad técnica externa, integrada a tu equipo\./);
  assert.match(html, /Orden técnico para proyectos en desarrollo\./);
  assert.match(html, /Cada entrega debe tener fuente, revisión y salida\./);
  assert.equal((html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) || []).length, 4);
  assert.ok(html.indexOf('class="technical-hero"') < html.indexOf('class="technical-method"'));
  assert.ok(html.indexOf('class="technical-method"') < html.indexOf('class="technical-deliverables"'));
  assert.ok(html.indexOf('class="technical-deliverables"') < html.indexOf('class="technical-case-study"'));
  assert.doesNotMatch(html, /technical-intro|technical-pillars|class="deliverables"|class="technical-case"/);
  assert.match(standardFooter, /Proyectos claros, precisos y construibles\./);
  assert.match(standardFooter, />Privacidad</);
  assert.match(css, /\.page-technical \.technical-hero\s*\{[\s\S]*?72vh/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?technical-deliverables tbody td[\s\S]*?display:\s*grid/);
});

test("Estudio usa una narrativa editorial compacta sobre la retícula compartida", () => {
  const html = fs.readFileSync(path.join(root, "estudio/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";
  const principles = html.match(/<div class="studio-principles__grid">([\s\S]*?)<\/div>/)?.[1] || "";

  assert.match(html, /<html lang="es-CL">/);
  assert.match(html, /<body class="page-studio">/);
  assert.match(html, /<a href="\/estudio\/" aria-current="page">Estudio<\/a>/);
  assert.equal((main.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.equal((main.match(/<section\b/g) || []).length, 3);
  assert.equal((principles.match(/<article>/g) || []).length, 3);
  assert.match(main, /Una oficina pequeña\./);
  assert.match(main, /Una forma integral de resolver arquitectura\./);
  assert.match(main, /La arquitectura se vuelve simple cuando las decisiones están resueltas\./);
  assert.match(main, /Arquitecto especializado en diseño, visualización y coordinación BIM\./);
  assert.match(main, /Conversemos sobre lo que necesita resolver\./);
  assert.match(main, /href="\/contacto\/">Iniciar conversación<\/a>/);
  assert.ok(main.indexOf('class="studio-hero"') < main.indexOf('class="studio-approach"'));
  assert.ok(main.indexOf('class="studio-approach"') < main.indexOf('class="studio-direction"'));
  assert.ok(main.indexOf('class="studio-direction"') < main.indexOf('class="studio-cta"'));
  assert.doesNotMatch(main, /studio-statement|studio-director|studio-values|contact-band|manifesto/);
  assert.match(css, /\.page-studio \.studio-hero__grid,[\s\S]*?grid-template-columns:\s*repeat\(12/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.page-studio \.studio-hero__grid,[\s\S]*?repeat\(8/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-hero__grid,[\s\S]*?repeat\(4/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-principles__grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /\.page-studio[\s\S]*?min-height:\s*100(?:s?vh|%)/);
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

test("todas las páginas comparten el footer editorial original", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const files = [
    "index.html",
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html",
    "privacidad/index.html",
    "404.html"
  ];
  const footers = files.map((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, file);
    assert.match(footer, /Proyectos claros, precisos y construibles\./);
    assert.match(footer, />Privacidad</);
    return footer;
  });

  assert.equal(new Set(footers).size, 1);
  assert.match(css, /\.footer-wordmark\s*\{[\s\S]*?font-family:\s*"Syne"/);
  assert.match(css, /\.site-footer\s*\{[\s\S]*?text-transform:\s*uppercase/);
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
