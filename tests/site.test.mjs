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
  const deliverablesTable = html.match(/<table>[\s\S]*?<\/table>/)?.[0] || "";

  assert.match(html, /<body class="page-technical">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /Capacidad técnica, integrada a tu equipo\./);
  assert.match(html, /Del criterio de diseño a una documentación coherente\./);
  assert.match(html, /<h3>Modelo arquitectónico<\/h3>[\s\S]*?<h3>Desarrollo<\/h3>[\s\S]*?<h3>Documentación<\/h3>/);
  assert.match(html, /Cada entrega debe conservar la lógica del proyecto\./);
  assert.equal((deliverablesTable.match(/<thead>[\s\S]*?<\/thead>/)?.[0].match(/scope="col"/g) || []).length, 3);
  assert.equal((deliverablesTable.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) || []).length, 5);
  assert.doesNotMatch(deliverablesTable, /Salida/);
  assert.ok(html.indexOf("Desarrollo arquitectónico") < html.indexOf("modelado BIM"));
  assert.ok(html.indexOf('class="technical-hero"') < html.indexOf('class="technical-method"'));
  assert.ok(html.indexOf('class="technical-method"') < html.indexOf('class="technical-deliverables"'));
  assert.ok(html.indexOf('class="technical-deliverables"') < html.indexOf('class="technical-case-study"'));
  assert.doesNotMatch(html, /technical-intro|technical-pillars|class="deliverables"|class="technical-case"/);
  assert.match(standardFooter, /ARQUITECTURA CLARA\. DECISIONES CONSTRUIBLES\./);
  assert.match(standardFooter, />Privacidad</);
  assert.match(css, /\.page-technical \.technical-hero\s*\{[\s\S]*?100svh/);
  assert.match(css, /\.page-technical \.technical-hero__media\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?technical-deliverables tbody td[\s\S]*?display:\s*grid/);
});

test("Servicios presenta cuatro áreas en el orden y las rutas acordadas", () => {
  const html = fs.readFileSync(path.join(root, "servicios/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";
  const serviceTitles = [...main.matchAll(/<article class="service-row"[\s\S]*?<h3>([^<]+)<\/h3>/g)]
    .map((match) => match[1]);

  assert.deepEqual(serviceTitles, [
    "Arquitectura + interiores",
    "Workspaces",
    "Visualización + render",
    "Oficina técnica externa"
  ]);
  assert.match(main, /class="services-hero__media"/);
  assert.match(main, /ChatGPT%20Image%2027%20may%202026%2C%2011_34_21%20p\.m\.-1671\.avif/);
  assert.match(main, /Resolver el proyecto<br>antes de construir\./);
  assert.match(main, /Arquitectura, documentación BIM y visualización integradas en un mismo proceso para coordinar decisiones, reducir errores y llegar a obra con mayor claridad\./);
  assert.doesNotMatch(main, /Ver capacidades/);
  assert.match(main, /class="button button--primary" href="\/contacto\/">Conversar sobre un proyecto<\/a>/);
  assert.match(main, /id="capacidades"/);
  assert.doesNotMatch(main, /Tres capacidades/);
  assert.doesNotMatch(main, /ÁREAS DE TRABAJO|ALCANCE HABITUAL|technical-support|Capacidad técnica sin ampliar/);
  assert.match(main, /<span>Cuatro áreas\.<\/span>[\s\S]*?<span>Una misma<\/span>[\s\S]*?<span>forma de trabajar\.<\/span>/);
  assert.match(main, /class="button service-row__link" href="\/proyectos\/">Ver arquitectura e interiores<\/a>/);
  assert.match(main, /class="button service-row__link" href="\/contacto\/">Ver workspaces<\/a>/);
  assert.match(main, /class="button service-row__link" href="\/proyectos\/render-pocuro\/">Ver visualización<\/a>/);
  assert.match(main, /class="button service-row__link" href="\/oficina-tecnica\/">Conocer oficina técnica<\/a>/);
  assert.match(main, /class="project-cta"[\s\S]*?class="button button--primary" href="\/contacto\/">Solicitar una conversación<\/a>[\s\S]*?class="button button--primary" href="\/proyectos\/">Ver proyectos<\/a>/);
  assert.match(main, /<span>Definamos qué<\/span>[\s\S]*?<span>necesita resolver<\/span>[\s\S]*?<span>tu proyecto\.<\/span>/);
  assert.equal((main.match(/<figure class="service-row__media">/g) || []).length, 4);
  assert.match(main, /project-details\/antu\/img-0-[0-9]+\.avif/);
  assert.match(main, /Homeoffice%20CG\/Renders\/A3-[0-9]+\.avif/);
  assert.match(main, /Render%20Pocuro\/PNG%20_%20Sala%20Multiuso\/SA3-[0-9]+\.avif/);
  assert.match(main, /project-details\/Zenteno\/Render\/E-[0-9]+\.avif/);
  assert.match(css, /\.page-services \.services-matrix__rows\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  assert.match(css, /\.page-services \.service-row:nth-child\(even\)\s*\{[\s\S]*?border-left:\s*2px solid var\(--line\)/);
  assert.match(css, /\.page-services \.service-row__content\s*\{[\s\S]*?align-self:\s*stretch[\s\S]*?justify-content:\s*space-between/);
  assert.match(css, /\.page-services \.project-cta__inner\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.page-services \.services-matrix__rows\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*?border-left:\s*0/);
});

test("Estudio reproduce la composición editorial breve del mockup", () => {
  const html = fs.readFileSync(path.join(root, "estudio/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";

  assert.match(html, /<html lang="es-CL">/);
  assert.match(html, /<body class="page-studio">/);
  assert.match(html, /<a href="\/estudio\/" aria-current="page">Estudio<\/a>/);
  assert.equal((main.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.equal((main.match(/<section\b/g) || []).length, 3);
  assert.equal((main.match(/>ESTUDIO<\/p>/g) || []).length, 1);
  assert.doesNotMatch(main, />EQUIPO<\/p>/);
  assert.match(main, /<span>Una oficina pequeña\.<\/span>[\s\S]*?<span>Una forma integral de<\/span>[\s\S]*?<span>resolver arquitectura\.<\/span>/);
  assert.match(main, /EEAD es un estudio de arquitectura con base en Temuco\. Diseñamos, visualizamos y desarrollamos proyectos con una mirada integral para transformar ideas en decisiones claras, precisas y construibles\./);
  assert.match(main, /Diseño, visualización[\s\S]*?y desarrollo técnico[\s\S]*?como parte de un[\s\S]*?mismo proceso\./);
  assert.match(main, /Trabajamos proyectos residenciales, interiores y encargos de hospitalidad desde una lógica de continuidad\./);
  assert.match(main, /<h2 id="studio-director-title">Emir Esparza<\/h2>/);
  assert.match(main, /Arquitecto UM[\s\S]*?Mg \(c\) Tec\. Aplicadas a la Construcción[\s\S]*?Director EEAD/);
  assert.match(main, /Arquitecto e interiorista\. Dirige EEAD desde Temuco, integrando diseño, visualización y desarrollo técnico/);
  assert.match(main, /alt="Mesa de trabajo con planos de arquitectura, lámpara, anteojos y material de proyecto\."/);
  assert.match(main, /alt="Retrato de Emir Esparza, arquitecto y director de EEAD\."/);
  assert.match(main, /<span>Conversemos sobre lo que<\/span>[\s\S]*?<span>tu proyecto necesita resolver\.<\/span>/);
  assert.match(main, /class="button button--primary" href="\/contacto\/">Iniciar conversación<\/a>/);
  assert.ok(main.indexOf('class="studio-hero"') < main.indexOf('class="studio-overview"'));
  assert.ok(main.indexOf('class="studio-overview"') < main.indexOf('class="studio-director"'));
  assert.ok(main.indexOf('class="studio-director"') < main.indexOf('class="studio-cta"'));
  assert.doesNotMatch(main, /Enfoque|Principios|Cómo trabajamos|studio-approach|studio-direction|studio-principles/);
  assert.match(css, /\.page-studio \.studio-hero\s*\{[\s\S]*?height:\s*78svh/);
  assert.match(css, /studio-hero-contrast:start[\s\S]*?linear-gradient/);
  assert.match(css, /\.page-studio \.studio-hero__image\s*\{[\s\S]*?object-fit:\s*cover[\s\S]*?object-position:\s*50% 58%/);
  assert.match(css, /\.page-studio \.studio-overview > \.studio-shell > p\s*\{[\s\S]*?border-left:\s*1px solid/);
  assert.match(css, /\.page-studio \.studio-director__portrait\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1[\s\S]*?border-radius:\s*50%/);
  assert.match(css, /\.page-studio \.studio-director__image\s*\{[\s\S]*?object-fit:\s*cover/);
  assert.match(css, /\.page-studio \.studio-cta \.button\s*\{[\s\S]*?background:\s*var\(--accent\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-director__portrait\s*\{[\s\S]*?order:\s*1/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-overview > \.studio-shell > p\s*\{[\s\S]*?border-left:\s*0/);
});

test("la home conserva SEO y aplica la composición editorial de referencia", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const expectedH1 = "<h1><span>Arquitectura</span><span>diseñada para</span><span>construirse</span><span>mejor.</span></h1>";
  const carouselLinks = [...html.matchAll(/<article class="project-carousel__slide"[\s\S]*?<a href="(\/proyectos\/[^"]+\/)"/g)]
    .map((match) => match[1]);

  assert.ok(html.includes(expectedH1));
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.ok(!html.includes("Arquitectura e interiorismo · Temuco, Chile"));
  assert.equal((html.match(/class="hero__emphasis"/g) || []).length, 12);
  assert.ok(html.includes("Somos un estudio de <span class=\"hero__emphasis\">Arquitectura</span>"));
  assert.ok(!html.includes('class="manifesto__label"'));
  assert.ok(html.includes("<h2 id=\"manifiesto-eead\"><span>Diseño y Técnica,</span><span>juntos desde el inicio</span></h2>"));
  assert.equal((html.match(/<div class="manifesto__copy">[\s\S]*?<\/div>/)?.[0].match(/<p>/g) || []).length, 3);
  assert.ok(html.includes("Porque una buena arquitectura no solo debe verse bien. También debe estar bien resuelta."));
  assert.match(
    html,
    /<div class="home-hero-shell">[\s\S]*?<section class="hero"[\s\S]*?<section class="editorial-ticker"[\s\S]*?<\/div>\s*<section class="manifesto"/
  );
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

test("la home presenta cuatro áreas de servicio y conecta directamente con el cierre", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const services = html.match(/<section class="home-services"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(services, /<p class="eyebrow">Servicios<\/p>/);
  assert.match(services, /Cuatro áreas, Una misma forma de trabajar\./);
  assert.equal((services.match(/<article>/g) || []).length, 4);
  assert.deepEqual(
    [...services.matchAll(/<h3>([^<]+)<\/h3>/g)].map((match) => match[1]),
    [
      "Arquitectura + Interiores",
      "Workspaces",
      "Visualización + Render",
      "Oficina Técnica Externa"
    ]
  );
  assert.equal((services.match(/class="button button--primary button--compact"/g) || []).length, 4);
  assert.match(services, /href="\/contacto\/">Explorar workspaces<\/a>/);
  assert.doesNotMatch(html, /class="technical-strip"/);
  assert.doesNotMatch(html, /03 \/ Documentación/);
  assert.ok(html.indexOf('class="home-services"') < html.indexOf('class="home-closure"'));
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
  assert.match(css, /\.page-home \.home-hero-shell\s*\{[\s\S]*?min-height:\s*100svh;[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /@supports \(height:\s*100dvh\)[\s\S]*?\.page-home \.home-hero-shell\s*\{[\s\S]*?min-height:\s*100dvh/);
  assert.match(css, /\.page-home \.hero\s*\{[\s\S]*?display:\s*flex;[\s\S]*?min-height:\s*0;[\s\S]*?flex:\s*1 1 auto/);
  assert.match(css, /\.page-home \.hero__grid\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?flex:\s*1 0 auto;[\s\S]*?align-items:\s*center/);
  assert.match(css, /\.page-home \.editorial-ticker\s*\{[\s\S]*?flex:\s*0 0 auto/);
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

test("todas las páginas comparten el footer editorial actualizado", () => {
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
    assert.match(footer, /ARQUITECTURA CLARA\. DECISIONES CONSTRUIBLES\./);
    assert.match(footer, />Privacidad</);
    return footer;
  });

  assert.equal(new Set(footers).size, 1);
  assert.match(css, /\.footer-wordmark\s*\{[\s\S]*?font-family:\s*"Syne"/);
  assert.match(css, /\.site-footer\s*\{[\s\S]*?text-transform:\s*uppercase/);
});

test("todos los navbar blancos usan la variante tipográfica en mayúsculas", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const whitePages = [
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html",
    "privacidad/index.html",
    "404.html"
  ];

  assert.match(
    css,
    /body:not\(\.page-home\) \.site-nav a,\s*body:not\(\.page-home\) \.menu-toggle\s*\{[\s\S]*?text-transform:\s*uppercase/
  );

  whitePages.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /<nav class="site-nav"/, file);
    assert.doesNotMatch(html, /<body class="page-home">/, file);
  });
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

test("Contacto usa una sección compacta y un formulario accesible de cinco campos", () => {
  const html = fs.readFileSync(path.join(root, "contacto/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const javascript = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const form = html.match(/<form class="contact-form"[\s\S]*?<\/form>/)?.[0] || "";
  const submittedNames = [...form.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((name) => !name.startsWith("_"));

  assert.deepEqual(submittedNames, [
    "nombre",
    "correo",
    "tipo_encargo",
    "ubicacion",
    "mensaje"
  ]);

  [
    '<body class="page-contact">',
    "<title>Contacto — EEAD Arquitectura e interiorismo</title>",
    "<p class=\"eyebrow\">CONTACTO</p>",
    "Conversemos sobre tu proyecto.",
    "Cuéntanos qué necesitas resolver, dónde se ubica el proyecto y en qué etapa se encuentra. Con esa información podremos orientarte sobre los próximos pasos.",
    'id="contact-channels-title">CANALES DIRECTOS</h2>',
    'id="contact-form-title">CUÉNTANOS TU ENCARGO</h2>',
    'action="https://formsubmit.co/ajax/emiresparza@gmail.com"',
    "Arquitectura e interiorismo",
    "Oficina técnica / BIM",
    "Visualización arquitectónica",
    "<option>Otro</option>",
    'placeholder="Comuna, ciudad o región"',
    'placeholder="Describa brevemente el proyecto, su etapa actual y cualquier plazo o condición relevante."',
    'href="mailto:emiresparza@gmail.com"',
    'href="https://wa.me/56987283154"',
    'class="contact-channel__arrow" aria-hidden="true">↗</span>',
    'href="/privacidad/"',
    'name="_honey"',
    'data-submit-label>ENVIAR CONSULTA</span>',
    'aria-live="polite"',
    'aria-atomic="true"'
  ].forEach((value) => assert.ok(html.includes(value), value));

  [
    "Antes de enviar",
    "Base</dt>",
    "Cobertura</dt>",
    "Respuesta</dt>",
    "¿Cómo podemos ayudarle?",
    'name="motivo"',
    'name="telefono"',
    'name="etapa_actual"'
  ].forEach((value) => assert.ok(!html.includes(value), value));

  ["nombre", "correo", "tipo-encargo", "ubicacion", "mensaje"].forEach((id) => {
    assert.match(form, new RegExp(`<label for="${id}">`));
    assert.match(form, new RegExp(`id="${id}"`));
  });

  assert.match(css, /\.contact-page__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(12/);
  assert.match(css, /\.contact-page__intro\s*\{[\s\S]*?grid-column:\s*1 \/ span 5/);
  assert.match(css, /\.contact-page__form-area\s*\{[\s\S]*?grid-column:\s*7 \/ 13/);
  assert.match(css, /\.page-contact \.field input,[\s\S]*?background:\s*transparent/);
  assert.match(css, /\.page-contact \.field input:focus-visible,[\s\S]*?var\(--accent\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-contact \.form-grid,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(min-width: 1101px\)[\s\S]*?\.contact-page__intro\s*\{[\s\S]*?position:\s*sticky/);
  assert.doesNotMatch(css, /\.contact-page\s*\{[\s\S]*?min-height:\s*100/);

  assert.match(javascript, /let isSubmitting = false/);
  assert.match(javascript, /if \(isSubmitting\) return/);
  assert.match(javascript, /new AbortController\(\)/);
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
