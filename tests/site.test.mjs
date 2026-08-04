import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../content/projects.mjs";
import { legacyProjectMap, legacyProjectTarget, legacyStaticRedirects } from "../content/legacy-routes.mjs";
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
  assert.equal(projects.length, 15);
  assert.ok(projects.every((project) => project.title === project.title.toLocaleUpperCase("es")));
  assert.deepEqual([...new Set(projects.map((project) => project.category))].sort(), [
    "Arquitectura",
    "Interiorismo",
    "Oficina Técnica Externa",
    "Visualización",
    "Workspaces"
  ]);
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const ctaByCategory = {
    Arquitectura: ["arquitectura-interiorismo", "Conversemos sobre tu proyecto"],
    Interiorismo: ["arquitectura-interiorismo", "Conversemos sobre tu proyecto"],
    Workspaces: ["workspaces", "Conversemos sobre tu espacio de trabajo"],
    "Oficina Técnica Externa": ["oficina-tecnica", "Solicitar apoyo técnico"],
    Visualización: ["visualizacion", "Cotizar visualización"]
  };

  projects.forEach((project) => {
    const file = path.join(root, "proyectos", project.slug, "index.html");
    assert.ok(fs.existsSync(file), project.slug);
    const html = fs.readFileSync(file, "utf8");
    const description = html.match(/<p class="project-description">([\s\S]*?)<\/p>/)?.[1] || "";
    const facts = [...html.matchAll(/<dl class="project-meta">[\s\S]*?<\/dl>/g)]
      .flatMap((match) => [...match[0].matchAll(/<dt>/g)]);
    const factLabels = [...html.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1]);
    const galleryItems = [...html.matchAll(/<figure class="project-gallery-item /g)];
    const relatedMarkup = html.match(/<div class="related-grid">([\s\S]*?)<\/div>\s*<\/section>/)?.[1] || "";
    const relatedCards = relatedMarkup.match(/<article class="project-card"/g) || [];
    const relatedSlugs = [...relatedMarkup.matchAll(/href="\/proyectos\/([^/]+)\//g)].map((match) => match[1]);

    assert.match(html, new RegExp(`<h1 class="project-title">${project.title}</h1>`));
    assert.match(html, /<body class="page-project-detail">/);
    assert.match(html, /<a class="project-back" href="\/proyectos\/" aria-label="Volver a proyectos">\s*<span class="project-back__arrow" aria-hidden="true">←<\/span>\s*<\/a>/);
    assert.ok(description.split(/\s+/).filter(Boolean).length <= 200, project.slug);
    assert.ok(facts.length >= 4 && facts.length <= 6, project.slug);
    assert.deepEqual(factLabels, [
      "Ubicación",
      "Estado",
      "Tipología",
      ...(project.developedBy ? ["Desarrollo"] : []),
      ...(project.client ? ["Cliente"] : []),
      "Alcance"
    ], project.slug);
    assert.equal(galleryItems.length, (project.gallerySelection || project.images.map((_, index) => index))
      .filter((index) => project.images[index]?.[0] !== project.cover).length, project.slug);
    assert.equal(relatedCards.length, 3, project.slug);
    assert.equal(new Set(relatedSlugs).size, 3, project.slug);
    relatedSlugs.forEach((slug) => {
      const related = projects.find((candidate) => candidate.slug === slug);
      assert.notEqual(slug, project.slug);
      assert.ok(related, `${project.slug}: ${slug}`);
    });
    assert.match(html, /<nav class="project-nav project-container"/);
    const [service, ctaLabel] = ctaByCategory[project.category];
    assert.match(
      html,
      new RegExp(`class="project-end-cta project-container"[\\s\\S]*?href="/contacto/\\?servicio=${service}&amp;proyecto=${project.slug}"[^>]*>${ctaLabel}</a>`)
    );
    assert.equal(
      (html.match(new RegExp(`href="/contacto/\\?servicio=${service}&amp;proyecto=${project.slug}"[^>]*>${ctaLabel}</a>`, "g")) || []).length,
      2,
      project.slug
    );
    assert.ok(html.indexOf('class="project-end-cta') < html.indexOf('class="project-nav'), project.slug);
    assert.equal((html.match(/class="project-end-cta/g) || []).length, 1, project.slug);
    assert.match(html, /rel="prev"/);
    assert.match(html, /rel="next"/);
    assert.doesNotMatch(html, />Galería<|Secuencia visual/);
    if (project.cover) {
      assert.match(html, /class="project-cover project-container">[\s\S]*?loading="eager"[\s\S]*?fetchpriority="high"/);
      assert.match(html, /<figure class="project-gallery-item is-main">/);
    } else {
      assert.doesNotMatch(html, /class="project-cover project-container"/);
    }
    assert.match(html, /Proyectos relacionados/);
    assert.doesNotMatch(html, /project-narrative|El problema|<figcaption>/);
  });

  assert.match(css, /\.project-hero__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  assert.doesNotMatch(css, /\.project-cover\s*\{[^}]*?(?:height|max-height|aspect-ratio)\s*:/);
  assert.match(css, /\.related-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /\.project-description \+ \.button\s*\{[\s\S]*?margin-top:\s*clamp\(20px, 2vw, 24px\)/);
  assert.match(css, /\.project-end-cta\s*\{[\s\S]*?margin-top:\s*clamp\(40px, 5vw, 64px\);[\s\S]*?margin-bottom:\s*clamp\(32px, 4vw, 48px\)/);
  assert.match(css, /\.page-project-detail \.project-end-cta \.button\s*\{[\s\S]*?width:\s*100%;[\s\S]*?justify-content:\s*center/);
  assert.match(css, /\.page-project-detail \.project-end-cta \.button::after\s*\{[\s\S]*?margin-left:\s*0/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.project-gallery-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /project-narrative|project-pagination|gallery-item--/);
});

test("cada ficha muestra solo los créditos entregados", () => {
  projects.forEach((project) => {
    const html = fs.readFileSync(path.join(root, "proyectos", project.slug, "index.html"), "utf8");
    assert.ok(html.includes(`<dt>Desarrollo</dt><dd>${project.developedBy}</dd>`), project.slug);
    if (project.client) assert.ok(html.includes(`<dt>Cliente</dt><dd>${project.client}</dd>`), project.slug);
    else assert.doesNotMatch(html, /<dt>Cliente<\/dt>/, project.slug);
  });
});

test("el índice de proyectos conserva un orden curado y una grilla editorial regular", () => {
  const html = fs.readFileSync(path.join(root, "proyectos/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const projectLinks = [...html.matchAll(/<article class="project-card"[\s\S]*?<a href="\/proyectos\/([^/]+)\//g)]
    .map((match) => match[1]);

  assert.deepEqual(projectLinks, [
    "antu",
    "render-bd",
    "casa-al",
    "casa-bv",
    "casa-ca",
    "cdl",
    "homeoffice-cg",
    "oficina-le",
    "quincho-ss",
    "laderas-del-sur",
    "zen416",
    "oficina-tr",
    "casa-ba",
    "taller-salfa",
    "casa101"
  ]);
  assert.match(html, /<body class="page-projects">/);
  assert.doesNotMatch(html, /Archivo seleccionado|Listado de proyectos|Arquitectura, interiorismo, desarrollo técnico/);
  assert.match(html, /<h1>Proyectos<\/h1>/);
  assert.deepEqual(
    [...html.matchAll(/data-filter="([^"]+)"/g)].map((match) => match[1]),
    ["Todos", "Arquitectura", "Interiorismo", "Visualización", "Workspaces", "Oficina Técnica"]
  );
  assert.equal((html.match(/<article class="project-card"/g) || []).length, projects.length);
  assert.match(html, /<h2 class="project-card__title">ANTU<\/h2>[\s\S]*?<div class="project-card__meta">\s*<p><span>Arquitectura<\/span><span>Temuco<\/span><\/p>/);
  assert.match(html, /project-card__media project-card__media--empty">\s*<h2 class="project-card__title">CASA101<\/h2>/);
  projects.forEach((project) => {
    const titleMarkup = html.match(new RegExp(`href="\\/proyectos\\/${project.slug}\\/"[\\s\\S]*?<h2 class="project-card__title">([\\s\\S]*?)<\\/h2>`))?.[1] || "";
    const breakCount = (titleMarkup.match(/<br>/g) || []).length;
    assert.equal(breakCount, project.title.trim().split(/\s+/).length > 2 ? 1 : 0, project.slug);
  });
  assert.match(html, /data-categories="Workspaces"/);
  assert.match(html, /data-categories="Oficina Técnica Externa\|Oficina Técnica"/);
  assert.match(css, /\.page-projects \.project-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /\.page-projects \.project-card__title\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?font-size:\s*clamp\(1\.8rem, 3\.4vw, 3\.6rem\)/);
  assert.match(css, /\.page-projects \.project-card__meta p > span\s*\{[\s\S]*?display:\s*block/);
  assert.match(css, /\.page-projects \.project-card__meta p > span:first-child\s*\{[\s\S]*?font-weight:\s*700/);
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.page-projects \.project-grid\s*\{[\s\S]*?repeat\(2/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-projects \.project-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /project-grid--editorial|project-card--featured/);
});

test("la oficina técnica replica la composición editorial solicitada y reutiliza el carrusel", () => {
  const html = fs.readFileSync(path.join(root, "oficina-tecnica/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const standardFooter = html.slice(html.indexOf('<footer class="site-footer">'));
  const carousel = html.match(/<section class="technical-projects"[\s\S]*?<\/section>/)?.[0] || "";
  const carouselLinks = [...carousel.matchAll(/<a href="(\/proyectos\/[^\"]+\/)"/g)].map((match) => match[1]);

  assert.match(html, /<body class="page-technical">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /<span>Capacidad técnica,<\/span> <span>integrada a tu equipo\.<\/span>/);
  assert.match(html, /<h3>Modelo arquitectónico<\/h3>[\s\S]*?<h3>Desarrollo<\/h3>[\s\S]*?<h3>Documentación<\/h3>/);
  assert.doesNotMatch(html, /ENTREGABLES|technical-deliverables|Cada entrega debe conservar/);
  assert.ok(html.indexOf('class="hero site-hero site-hero--technical"') < html.indexOf('class="technical-method"'));
  assert.ok(html.indexOf('class="technical-method"') < html.indexOf('class="technical-projects"'));
  assert.equal((html.match(/href="\/contacto\/\?servicio=oficina-tecnica"[^>]*>Solicitar apoyo técnico<\/a>/g) || []).length, 2);
  assert.match(html, /<p class="eyebrow">PROYECTOS<\/p>[\s\S]*?<h2 id="technical-projects-title">Trabajo reciente<\/h2>/);
  assert.match(html, /class="project-carousel" data-carousel/);
  assert.deepEqual(carouselLinks, ["/proyectos/laderas-del-sur/", "/proyectos/casa-ba/", "/proyectos/taller-salfa/"]);
  assert.match(carousel, /aria-label="Oficina técnica externa"/);
  assert.match(carousel, /data-title="LADERAS DEL SUR" data-location="Temuco" data-active/);
  assert.match(carousel, /data-carousel-title>LADERAS DEL SUR<\/strong>[\s\S]*?data-carousel-location>Temuco<\/span>/);
  assert.doesNotMatch(html, /Ver caso relacionado|DESARROLLO DE PROYECTO|Del criterio de diseño|CASO RELACIONADO|technical-case-study|Axonometría general/);
  assert.match(standardFooter, /Arquitectura simple\./);
  assert.match(standardFooter, />Privacidad</);
  assert.match(css, /--site-hero-height:\s*max\(720px, calc\(100svh - var\(--hero-ticker-height\)\)\)/);
  assert.match(css, /\.site-hero \.hero__media\s*\{[\s\S]*?position|\.site-hero \.hero__media,[\s\S]*?position:\s*absolute/);
  assert.match(css, /\.page-technical \.technical-method__pillars\s*\{[\s\S]*?grid-column:\s*1 \/ 13;[\s\S]*?repeat\(3/);
  assert.match(css, /\.page-technical \.technical-method__pillars h3\s*\{[\s\S]*?margin:\s*clamp\(21\.6px, 2\.2vw, 33\.6px\) 0 18px;[\s\S]*?text-transform:\s*uppercase/);
  assert.match(css, /\.page-technical \.technical-method__pillars article:hover\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, 0\.08\)/);
  assert.match(css, /\.page-technical \.technical-method__pillars article:hover span,[\s\S]*?article:hover h3\s*\{[\s\S]*?translateX\(6px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.page-technical \.technical-method__pillars article,[\s\S]*?transition:\s*none/);
  assert.doesNotMatch(css, /technical-deliverables/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-technical \.technical-method__pillars\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test("Servicios presenta cuatro áreas en el orden y las rutas acordadas", () => {
  const html = fs.readFileSync(path.join(root, "servicios/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const optimizer = fs.readFileSync(path.join(root, "scripts/optimize-images.mjs"), "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";
  const serviceTitles = [...main.matchAll(/<article class="service-row"[\s\S]*?<h3>([^<]+)<\/h3>/g)]
    .map((match) => match[1]);
  const serviceDescriptions = [...main.matchAll(/<div class="service-row__description">([\s\S]*?)<\/div>/g)];

  assert.deepEqual(serviceTitles, [
    "Arquitectura + interiores",
    "Workspaces",
    "Visualización + render",
    "Oficina técnica externa"
  ]);
  assert.equal(serviceDescriptions.length, 4);
  assert.ok(serviceDescriptions.every(([, description]) => description.includes("<strong><u>")));
  assert.match(main, /class="hero site-hero site-hero--services"/);
  assert.match(main, /assets\/img\/optimized\/Servicios\/EEAD%20Hero%20Servicios-[0-9]+\.avif/);
  assert.match(main, /alt="Vivienda contemporánea de hormigón y madera integrada al paisaje"/);
  assert.match(optimizer, /\/assets\/img\/Servicios\/EEAD Hero Servicios\.png/);
  assert.match(main, /<span>Resolver el proyecto<\/span> <span>antes de construir\.<\/span>/);
  assert.match(main, /<strong><u>Arquitectura<\/u><\/strong>, <strong><u>documentación BIM<\/u><\/strong> y <strong><u>visualización<\/u><\/strong> integradas en un mismo proceso para <strong><u>coordinar decisiones<\/u><\/strong>, <strong><u>reducir errores<\/u><\/strong> y llegar a obra con <strong><u>mayor claridad<\/u><\/strong>\./);
  assert.doesNotMatch(main, /Ver capacidades/);
  assert.match(main, /href="\/contacto\/\?motivo=proyecto"[^>]*>Conversemos sobre tu proyecto<\/a>/);
  assert.match(main, /id="capacidades"/);
  assert.doesNotMatch(main, /Tres capacidades/);
  assert.doesNotMatch(main, /ÁREAS DE TRABAJO|ALCANCE HABITUAL|technical-support|Capacidad técnica sin ampliar/);
  assert.match(main, /<span>Cuatro áreas\.<\/span>[\s\S]*?<span>Una misma<\/span>[\s\S]*?<span>forma de trabajar\.<\/span>/);
  assert.match(main, /href="\/contacto\/\?servicio=arquitectura-interiorismo"[^>]*>Conversemos sobre tu proyecto<\/a>/);
  assert.match(main, /href="\/contacto\/\?servicio=workspaces"[^>]*>Conversemos sobre tu espacio de trabajo<\/a>/);
  assert.match(main, /href="\/contacto\/\?servicio=visualizacion"[^>]*>Cotizar visualización<\/a>/);
  assert.match(main, /href="\/contacto\/\?servicio=oficina-tecnica"[^>]*>Solicitar apoyo técnico<\/a>/);
  assert.doesNotMatch(main, /Ver visualización|Laderas del Sur<\/a>/i);
  assert.match(main, /class="project-cta"[\s\S]*?href="\/contacto\/\?motivo=proyecto"[^>]*>Conversemos sobre tu proyecto<\/a>[\s\S]*?href="\/proyectos\/">Ver proyectos<\/a>/);
  assert.match(main, /<span>Definamos qué<\/span>[\s\S]*?<span>necesita resolver<\/span>[\s\S]*?<span>tu proyecto\.<\/span>/);
  assert.equal((main.match(/<figure class="service-row__media">/g) || []).length, 4);
  assert.match(main, /project-details\/antu\/img-0-[0-9]+\.avif/);
  assert.match(main, /Homeoffice%20CG\/Renders\/A3-[0-9]+\.avif/);
  assert.match(main, /Render%20Pocuro\/PNG%20_%20Sala%20Multiuso\/SA3-[0-9]+\.avif/);
  assert.match(main, /project-details\/Zenteno\/Render\/E-[0-9]+\.avif/);
  assert.match(css, /\.page-services \.services-matrix__rows\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  assert.match(css, /\.page-services \.service-row:nth-child\(even\)\s*\{[\s\S]*?border-left:\s*2px solid var\(--line\)/);
  assert.match(css, /\.page-services \.service-row__content\s*\{[\s\S]*?align-self:\s*stretch[\s\S]*?justify-content:\s*space-between/);
  assert.match(css, /\.page-services \.button\.service-row__link\s*\{[\s\S]*?border:\s*0/);
  assert.match(css, /\.page-services \.project-cta__inner\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.page-services \.services-matrix__rows\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*?border-left:\s*0/);
});

test("Estudio presenta oficina, dirección y red con composición editorial responsive", () => {
  const html = fs.readFileSync(path.join(root, "estudio/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || "";
  const studioCss = css.slice(css.indexOf("/* Estudio — estructura institucional */"));

  assert.match(html, /<html lang="es-CL">/);
  assert.match(html, /<body class="page-studio">/);
  assert.match(html, /<a href="\/estudio\/" aria-current="page">Estudio<\/a>/);
  assert.equal((main.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.equal((main.match(/<section\b/g) || []).length, 3);
  assert.doesNotMatch(main, />ESTUDIO<\/h2>|>DIRECCIÓN<\/h2>|ÁREAS DE TRABAJO<\/h2>/);
  assert.match(main, /<span>Una oficina pequeña\.<\/span>[\s\S]*?<span>Una forma integral de<\/span>[\s\S]*?<span>resolver arquitectura\.<\/span>/);
  assert.match(main, /EEAD es una oficina de <strong><u>arquitectura e interiorismo<\/u><\/strong> que trabaja cada proyecto con <strong><u>cercanía, criterio y precisión técnica<\/u><\/strong>\./);
  assert.match(main, /Creemos que la arquitectura correcta es simple: <strong><u>debe resolverse antes de construir<\/u><\/strong>\./);
  assert.match(main, /Cada decisión busca aportar <strong><u>claridad al cliente, coherencia al proyecto y mayor control sobre el proceso<\/u><\/strong>\./);
  assert.match(main, /class="hero__copy"><div class="hero__actions"><a class="button button--primary" href="\/contacto\/\?motivo=proyecto"[^>]*>CONVERSEMOS SOBRE TU PROYECTO<\/a>/);
  assert.doesNotMatch(main.match(/class="hero site-hero site-hero--studio"[\s\S]*?<\/header>/)?.[0] || "", /class="hero__lead"/);
  assert.match(main, /<h2>Emir Esparza<\/h2>/);
  assert.match(main, /ARQUITECTO<br>MG \(C\) TECNOLOGÍAS APLICADAS A LA CONSTRUCCIÓN<br>DIRECTOR EEAD/);
  assert.match(main, /Con <strong><u>más de nueve años de experiencia<\/u><\/strong>, dirige proyectos residenciales, comerciales y de interiorismo/);
  assert.doesNotMatch(main, /Su enfoque se centra/);
  assert.match(main, /<h2 class="eyebrow">RED COLABORATIVA<\/h2>[\s\S]*?EEAD opera como una oficina compacta y especializada\./);
  assert.match(main, /conformamos equipos con <strong><u>profesionales, especialistas y consultores de confianza<\/u><\/strong>\./);
  assert.doesNotMatch(main, /studio-areas|studio-area__icon|Proyectos contextualizados|Espacios coherentes y funcionales|Modelado, coordinación y documentación|Imágenes y recorridos/);
  assert.match(main, /alt="Mesa de trabajo con planos de arquitectura, lámpara, anteojos y material de proyecto\."/);
  assert.match(main, /alt="Retrato de Emir Esparza, arquitecto y director de EEAD\."/);
  assert.match(main, /<span>Conversemos sobre<\/span>[\s\S]*?<span>lo que tu proyecto<\/span>[\s\S]*?<span>necesita resolver\.<\/span>/);
  assert.doesNotMatch(main, /Iniciar conversación/);
  assert.match(main, /class="studio-cta__actions"[\s\S]*?href="\/contacto\/\?motivo=proyecto"[^>]*>Conversemos sobre tu proyecto<\/a>[\s\S]*?href="\/proyectos\/">Ver proyectos<\/a>/);
  assert.ok(main.indexOf('class="studio-intro"') < main.indexOf('class="studio-direction"'));
  assert.ok(main.indexOf('class="studio-direction"') < main.indexOf('class="studio-cta"'));
  assert.doesNotMatch(main, /Cómo trabajamos|Arquitectura e interiores|Visualización y criterio|Desarrollo técnico/);
  assert.match(css, /\.site-hero\s*\{[\s\S]*?height:\s*var\(--site-hero-height\)/);
  assert.match(css, /\.site-hero \.hero__image\s*\{[\s\S]*?object-fit:\s*cover/);
  assert.match(css, /\.page-studio \.site-hero--studio \.hero__image\s*\{[\s\S]*?object-position:\s*center bottom/);
  assert.match(studioCss, /\.page-studio \.studio-direction__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(12/);
  assert.match(studioCss, /\.page-studio \.studio-intro__copy\s*\{[\s\S]*?grid-column:\s*1 \/ 13/);
  assert.match(studioCss, /\.page-studio \.studio-intro__lead\s*\{[\s\S]*?grid-column:\s*1 \/ 6/);
  assert.match(studioCss, /\.page-studio \.studio-intro__detail\s*\{[\s\S]*?grid-column:\s*7 \/ 12/);
  assert.match(studioCss, /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.page-studio \.studio-direction__copy:hover,[\s\S]*?transform:\s*translateX\(4px\)/);
  assert.match(studioCss, /\.page-studio \.studio-direction__copy::before\s*\{[\s\S]*?background:\s*var\(--accent\)/);
  assert.match(studioCss, /\.page-studio \.studio-network:hover\s*\{[\s\S]*?border-color:\s*var\(--accent\)/);
  assert.match(studioCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.page-studio \.studio-direction__copy,[\s\S]*?transition:\s*none/);
  assert.match(studioCss, /\.page-studio \.studio-direction > \.studio-shell\s*\{[\s\S]*?border-top:\s*0/);
  assert.match(studioCss, /\.page-studio \.studio-director__portrait\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1[\s\S]*?border-radius:\s*2px/);
  assert.match(studioCss, /\.page-studio \.studio-director__image\s*\{[\s\S]*?object-fit:\s*cover/);
  assert.match(css, /\.page-studio \.studio-cta\s*\{[\s\S]*?background:\s*#121212/);
  assert.match(css, /\.page-studio \.studio-cta__grid\s*\{[\s\S]*?justify-content:\s*center/);
  assert.match(css, /\.page-studio \.studio-cta__actions\s*\{[\s\S]*?grid-column:\s*2/);
  assert.match(css, /\.page-studio \.studio-cta__actions \.button\s*\{[\s\S]*?background:\s*var\(--accent\)/);
  assert.match(studioCss, /\.page-studio \.studio-cta h2 span\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.match(studioCss, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-direction__grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(studioCss, /@media \(max-width: 760px\)[\s\S]*?\.page-studio \.studio-director__portrait\s*\{[\s\S]*?order:\s*1/);
});

test("la home conserva SEO y aplica la composición editorial de referencia", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const expectedH1 = '<h1 id="home-title"><span>Arquitectura</span> <span>diseñada para</span> <span>construirse</span> <span>mejor.</span></h1>';
  const carouselLinks = [...html.matchAll(/<article class="project-carousel__slide"[\s\S]*?<a href="(\/proyectos\/[^"]+\/)"/g)]
    .map((match) => match[1]);

  assert.ok(html.includes(expectedH1));
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.ok(!html.includes("Arquitectura e interiorismo · Temuco, Chile"));
  assert.equal((html.match(/class="hero__emphasis"/g) || []).length, 7);
  assert.ok(html.includes("Somos un estudio de <strong class=\"hero__emphasis\">Arquitectura, Diseño e Interiorismo</strong>"));
  assert.ok(!html.includes('class="manifesto__label"'));
  assert.ok(html.includes("<h2 id=\"manifiesto-eead\"><span>Diseño y Técnica,</span><span>juntos desde el inicio</span></h2>"));
  assert.match(css, /\.page-home \.manifesto h2\s*\{[\s\S]*?line-height:\s*1\.05/);
  assert.match(css, /\.page-home \.manifesto\s*\{[\s\S]*?min-height:\s*clamp\(245px, 18\.9vw, 301px\);[\s\S]*?padding:\s*clamp\(43px, 3\.85vw, 59px\) var\(--content-edge\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-home \.manifesto\s*\{[\s\S]*?padding:\s*38px var\(--page-gutter\)/);
  assert.equal((html.match(/<div class="manifesto__copy">[\s\S]*?<\/div>/)?.[0].match(/<p>/g) || []).length, 1);
  assert.ok(html.includes("Porque una buena arquitectura no solo debe verse bien: <strong><u>debe estar pensada para construirse bien.</u></strong>"));
  assert.match(
    html,
    /<div class="home-hero-shell">[\s\S]*?<section class="hero site-hero site-hero--home"[\s\S]*?<section class="editorial-ticker"[\s\S]*?<\/div>\s*<section class="manifesto"/
  );
  assert.ok(html.indexOf('class="hero__media"') < html.indexOf('class="hero__contrast"'));
  assert.ok(html.indexOf('class="hero__contrast"') < html.indexOf('class="hero__dither"'));
  assert.ok(html.indexOf('class="hero__dither"') < html.indexOf('class="hero__content hero__grid"'));
  assert.ok(html.indexOf('class="editorial-ticker"') < html.indexOf('class="manifesto"'));
  assert.match(html, /class="hero__image"[\s\S]*?loading="eager"[\s\S]*?fetchpriority="high"/);
  assert.equal(carouselLinks.length, projects.filter((project) => project.cover).length);
  assert.equal(new Set(carouselLinks).size, carouselLinks.length);
  carouselLinks.forEach((href) => {
    const slug = href.split("/").filter(Boolean).at(-1);
    assert.ok(projects.some((project) => project.slug === slug), href);
  });
  assert.ok(html.includes('aria-roledescription="carrusel"'));
  assert.ok(html.includes('aria-label="Todos los proyectos"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.match(html, /data-title="CASA AL" data-location="Cunco" data-active/);
  assert.match(html, /<strong data-carousel-title>CASA AL<\/strong>[\s\S]*?<span data-carousel-location>Cunco<\/span>/);
  assert.ok(!html.includes("data-carousel-meta"));
  assert.ok(!html.includes("data-meta="));
  assert.ok(html.includes('class="button button--primary button--compact home-projects__cta"'));
  assert.ok(!html.includes("hero__title-field"));
  assert.ok(html.includes('<span class="footer-wordmark">EEAD</span>'));
  assert.ok(!hasNestedAnchors(html));
  assert.match(html, /<title>EEAD \| Arquitectura e interiorismo en Temuco<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/eead\.cl\/">/);
  assert.match(html, /"@type":"ProfessionalService"/);
});

test("la home presenta cuatro áreas de servicio y conecta directamente con el cierre", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
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
  assert.match(css, /\.page-home \.home-services__chapters span\s*\{[\s\S]*?font-size:\s*clamp\(1\.2rem, 1\.7vw, 1\.65rem\)/);
  [
    "Diseñamos <strong>Viviendas, Refugios, Lofts, Remodelaciones, Interiorismo y Proyectos de Hospitality</strong> desde una mirada integral.",
    "Nuestras propuestas responden <strong>al uso, a la materialidad y a la forma</strong> en que será construida.",
    "Nuestra especialidad, <strong>Oficinas y Espacios de trabajo en casa</strong> que integran <strong>Identidad, Ergonomia, Tecnología y Funcionalidad.</strong>",
    "Organizamos cada elemento para mejorar tu <strong>concentración, bienestar y aprovechar cada espacio,</strong>",
    "Creamos <strong>Imágenes, Renders y Modelos 3D</strong> para comprender, evaluar y comunicar tu proyecto antes de construirlo.",
    "permite <strong>conocer tu proyecto</strong> antes de su ejecución",
    "Apoyamos a <strong>Arquitectos, Constructoras, Inmobiliarias e Ingenieros</strong> en el Desarrollo, Representación y Documentación de sus proyectos.",
    "Nos incorporamos como una <strong>extensión especializada de tu equipo,</strong> aportando capacidad técnica en <strong>Dibujo, BIM, Modelado y Documentación</strong>",
    "<strong><u>ARQUITECTURA  |  INTERIORISMO  |  REMODELACIONES  |  HOSPITALITY</u></strong>",
    "<strong><u>OFICINAS | HOME OFFICE | TALLERES | ESPACIOS DE PRODUCTIVIDAD</u></strong>",
    "<strong><u>MODELADO 3D  |  RENDERS  | VIDEOS  |  IMÁGENES COMERCIALES  |  BRANDING INMOBILIARIO</u></strong>",
    "<strong><u>APOYO ESPECIALIZADO  |  DOCUMENTACIÓN  |  DIBUJO TÉCNICO  |  MODELADO  |  BIM</u></strong>"
  ].forEach((copy) => assert.ok(services.includes(copy), copy));
  assert.match(services, /href="\/contacto\/\?servicio=workspaces"[^>]*>Conversemos sobre tu espacio de trabajo<\/a>/);
  assert.doesNotMatch(html, /class="technical-strip"/);
  assert.doesNotMatch(html, /03 \/ Documentación/);
  assert.ok(html.indexOf('class="home-services"') < html.indexOf('class="home-closure"'));
  assert.match(css, /\.page-home \.home-closure__action p\s*\{[\s\S]*?max-width:\s*none;[\s\S]*?white-space:\s*nowrap/);
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
  assert.equal(tickerGroups.length, 8);
  tickerGroups.forEach((group) => assert.equal(group, tickerGroups[0]));
  assert.match(tickerGroups[0], />Arquitectura Simple<\/span>/);
  assert.match(tickerGroups[0], />Araucanía<\/span>/);
  assert.match(html, /editorial-ticker__viewport" aria-hidden="true"/);
  assert.match(html, /<p class="sr-only">Arquitectura e interiorismo\. Arquitectura Simple\.[\s\S]*?Araucanía\. Chile\.<\/p>/);
  assert.match(html, /class="button button--primary" href="\/proyectos\/">Proyectos<\/a>[\s\S]*?href="\/contacto\/\?motivo=proyecto"[^>]*>Conversemos sobre tu proyecto<\/a>/);

  assert.match(css, /\/\* hero-contrast:start \*\//);
  assert.match(css, /\/\* hero-dither:start \*\//);
  assert.match(css, /\.page-home \.home-hero-shell\s*\{[\s\S]*?min-height:\s*100svh;[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /@supports \(height:\s*100dvh\)[\s\S]*?\.page-home \.home-hero-shell\s*\{[\s\S]*?min-height:\s*100dvh/);
  assert.match(css, /\.page-home \.hero\s*\{[\s\S]*?display:\s*flex;[\s\S]*?min-height:\s*0;[\s\S]*?flex:\s*1 1 auto/);
  assert.match(css, /\.page-home \.hero__grid\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?flex:\s*1 0 auto;[\s\S]*?align-items:\s*center/);
  assert.match(css, /\.page-home \.editorial-ticker\s*\{[\s\S]*?flex:\s*0 0 auto/);
  assert.match(css, /@keyframes eead-ticker/);
  assert.match(css, /animation:\s*eead-ticker 28s linear infinite/);
  assert.match(css, /\.page-home \.editorial-ticker\s*\{[\s\S]*?background:\s*var\(--surface-soft\);[\s\S]*?color:\s*#000/);
  assert.match(css, /\.page-home \.editorial-ticker__group\s*\{[\s\S]*?font-family:\s*"Manrope"[\s\S]*?font-weight:\s*300/);
  assert.match(css, /transform:\s*translate3d\(-12\.5%, 0, 0\)/);
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
    assert.match(footer, /Arquitectura simple\./);
    assert.match(footer, /mailto:hola@eead\.cl/);
    assert.match(footer, />HOLA@EEAD\.CL<\/a>/);
    assert.match(footer, /https:\/\/wa\.me\/56987283154/);
    assert.match(footer, /https:\/\/www\.instagram\.com\/eead\.cl\//);
    assert.match(footer, />@EEAD\.CL<\/a>/);
    assert.match(footer, /❤ Hecho con amor desde Temuco por [\s\S]*?>ARQit!<\/a> Diseñado por humanos\./);
    assert.doesNotMatch(footer, /ARQUITECTURA CLARA|DECISIONES CONSTRUIBLES/);
    assert.match(footer, />Privacidad</);
    return footer;
  });

  assert.equal(footers.length, files.length);
  assert.match(css, /\.footer-wordmark\s*\{[\s\S]*?font-family:\s*"Syne"/);
  assert.match(css, /\.site-footer\s*\{[\s\S]*?text-transform:\s*uppercase/);
});

test("los heroes visuales y los controles globales comparten una sola implementación", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const javascript = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const heroFiles = ["index.html", "servicios/index.html", "oficina-tecnica/index.html", "estudio/index.html"];
  const allFiles = [
    ...heroFiles,
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "contacto/index.html",
    "privacidad/index.html",
    "404.html"
  ];

  heroFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /class="hero site-hero site-hero--(?:home|services|technical|studio)" data-hero-motion/);
    ["data-hero-scroll", "data-hero-pointer", 'class="hero__contrast"', 'class="hero__dither"', 'class="hero__content hero__grid"']
      .forEach((token) => assert.ok(html.includes(token), `${file}: ${token}`));
  });

  allFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /class="floating-controls"/);
    assert.match(html, /data-scroll-top/);
    assert.match(html, /aria-label="Contactar por WhatsApp"/);
    assert.match(html, /class="floating-control__icon"[\s\S]*?<path fill="currentColor"/);
    assert.doesNotMatch(html, />WA<\/span>/);
  });

  assert.match(css, /--button-height:\s*46px/);
  assert.match(css, /\.site-hero\s*\{\s*--hero-content-gap:\s*clamp\(18px, 1\.7vw, 28px\)/);
  assert.match(css, /body \.site-hero \.hero__copy\s*\{\s*margin-top:\s*var\(--hero-content-gap\)/);
  assert.match(css, /body \.site-hero \.hero__lead\s*\{\s*margin-bottom:\s*var\(--hero-content-gap\)/);
  assert.match(css, /\.page-studio \.site-hero--studio\s*\{\s*--hero-content-gap:\s*clamp\(26px, 2\.8vw, 40px\)/);
  assert.match(css, /body \.button\.button,[\s\S]*?\.page-projects \.filters button\s*\{[\s\S]*?justify-content:\s*space-between;[\s\S]*?background:\s*var\(--accent\);[\s\S]*?color:\s*#fff/);
  assert.match(css, /body \.button\.button::after,[\s\S]*?margin-left:\s*auto;[\s\S]*?content:\s*"→"/);
  assert.match(css, /@media \(max-width: 960px\)[\s\S]*?\.menu-toggle\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?background:\s*var\(--accent\);[\s\S]*?color:\s*#fff !important/);
  assert.match(css, /\.menu-toggle::after\s*\{[\s\S]*?content:\s*"→"/);
  assert.match(css, /\.site-nav a::after\s*\{\s*bottom:\s*0/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(javascript, /window\.scrollTo\(\{ top: 0, behavior: reduceMotion\.matches \? "auto" : "smooth" \}\)/);
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
  assert.match(javascript, /location\.textContent = activeSlide\.dataset\.location/);
  assert.match(javascript, /setAttribute\("aria-hidden", "true"\)/);
  assert.match(javascript, /setAttribute\("inert", ""\)/);
  assert.match(javascript, /removeAttribute\("href"\)/);
  assert.match(javascript, /const wrapIndex/);
  assert.doesNotMatch(javascript, /previousButton\.disabled|nextButton\.disabled/);
  assert.doesNotMatch(javascript, /setInterval/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /flex-basis:\s*84vw/);
  assert.match(css, /:where\(\.page-home, \.page-technical\) \.project-carousel__caption \[data-carousel-location\]\s*\{[\s\S]*?font-size:\s*clamp\(0\.72rem,[\s\S]*?font-weight:\s*300/);
});

test("cada página indexable tiene el title SEO esperado y un canonical único", () => {
  const mainTitles = new Map([
    ["index.html", "EEAD | Arquitectura e interiorismo en Temuco"],
    ["proyectos/index.html", "EEAD | Proyectos de arquitectura e interiorismo"],
    ["servicios/index.html", "EEAD | Servicios de arquitectura, interiorismo y oficina técnica"],
    ["oficina-tecnica/index.html", "EEAD | Oficina técnica externa para arquitectura y AEC"],
    ["estudio/index.html", "EEAD | Estudio de arquitectura y diseño en Temuco"],
    ["contacto/index.html", "EEAD | Contacto estudio de arquitectura en Temuco"],
    ["privacidad/index.html", "EEAD | Política de privacidad"]
  ]);
  const typologies = {
    Arquitectura: "Arquitectura",
    Interiorismo: "Interiorismo",
    Workspaces: "Workspaces",
    Visualización: "Visualización",
    "Oficina Técnica Externa": "Oficina Técnica"
  };
  const expectedTitles = new Map([
    ...mainTitles,
    ...projects.map((project) => [
      `proyectos/${project.slug}/index.html`,
      `${project.title} | ${typologies[project.category] ?? project.category}`
    ])
  ]);
  const titles = new Set();
  const canonicals = new Set();

  expectedTitles.forEach((expectedTitle, file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.equal(title, expectedTitle, file);
    assert.doesNotMatch(title, /—|\| EEAD$/);
    assert.ok(canonical, file);
    assert.ok(!titles.has(title), `title repetido: ${title}`);
    assert.ok(!canonicals.has(canonical), `canonical repetido: ${canonical}`);
    titles.add(title);
    canonicals.add(canonical);
  });
});

test("los seis proyectos usan slugs canónicos persistidos y redirecciones directas", () => {
  const expected = new Map([
    ["RENDER BD", ["big-dreams", "render-bd"]],
    ["CASA AL", ["casa-alicia", "casa-al"]],
    ["CASA CA", ["casa-cg", "casa-ca"]],
    ["OFICINA LE", ["oficina-gl", "oficina-le"]],
    ["LADERAS DEL SUR", ["render-pocuro", "laderas-del-sur"]],
    ["ZEN416", ["zenteno", "zen416"]]
  ]);

  expected.forEach(([oldSlug, newSlug], title) => {
    assert.equal(projects.find((project) => project.title === title)?.slug, newSlug);
    assert.equal(legacyStaticRedirects.get(`/proyectos/${oldSlug}/`), `/proyectos/${newSlug}/`);
    assert.ok(fs.existsSync(path.join(root, "proyectos", newSlug, "index.html")));
    assert.ok(!fs.existsSync(path.join(root, "proyectos", oldSlug)));
  });

  const activeSlugs = new Set(projects.map((project) => project.slug));
  legacyStaticRedirects.forEach((target) => {
    const targetSlug = target.match(/^\/proyectos\/([^/]+)\/$/)?.[1];
    if (targetSlug) assert.ok(activeSlugs.has(targetSlug), target);
  });
});

test("canonical, Open Graph, Twitter y JSON-LD coinciden con cada URL pública", () => {
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

  files.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const pathname = file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
    const canonical = `https://eead.cl${pathname}`;
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1, file);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`), file);
    assert.match(html, /<meta property="og:image" content="https:\/\/eead\.cl\/[^" ]+">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);

    const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.+)<\/script>/)?.[1]);
    const graph = Array.isArray(data) ? data : [data];
    assert.ok(JSON.stringify(data).includes(canonical), file);
    if (pathname !== "/") {
      const breadcrumbs = graph.find((item) => item["@type"] === "BreadcrumbList");
      assert.ok(breadcrumbs, file);
      assert.equal(breadcrumbs.itemListElement.at(-1).item, canonical, file);
    }
  });

  const contact = fs.readFileSync(path.join(root, "contacto/index.html"), "utf8");
  assert.match(contact, /<link rel="canonical" href="https:\/\/eead\.cl\/contacto\/">/);
  assert.doesNotMatch(contact, /canonical" href="[^"]+\?/);
});

test("sitemap y robots publican solo rutas canónicas indexables", () => {
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expected = [
    "https://eead.cl/",
    "https://eead.cl/proyectos/",
    ...projects.map((project) => `https://eead.cl/proyectos/${project.slug}/`),
    "https://eead.cl/servicios/",
    "https://eead.cl/oficina-tecnica/",
    "https://eead.cl/estudio/",
    "https://eead.cl/contacto/",
    "https://eead.cl/privacidad/"
  ];
  assert.deepEqual(urls, expected);
  assert.equal(new Set(urls).size, urls.length);

  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  assert.match(robots, /Sitemap: https:\/\/eead\.cl\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow:\s*\/(?:assets|proyectos|servicios)/);
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
    "<title>EEAD | Contacto estudio de arquitectura en Temuco</title>",
    '<h1 id="contact-title"><span>Conversemos</span> <span>sobre tu</span> <span>proyecto</span></h1>',
    "Cuéntanos <strong><u>qué idea tienes en mente, dónde está tu proyecto y en qué etapa se encuentra.</u></strong> Con esa información podemos orientarte sobre los próximos pasos. <strong><u>¡Conversemos!</u></strong>",
    'id="contact-form-title">CUÉNTANOS TU ENCARGO</h2>',
    'action="https://formsubmit.co/ajax/emiresparza@gmail.com"',
    "Arquitectura e interiorismo",
    "Workspaces",
    "Oficina técnica externa",
    "Visualización arquitectónica",
    "Proyecto similar",
    '<option value="otro">Otro</option>',
    'placeholder="Comuna, ciudad o región"',
    'placeholder="Describa brevemente el proyecto, su etapa actual y cualquier plazo o condición relevante."',
    'href="mailto:hola@eead.cl"',
    'href="https://wa.me/56987283154?text=',
    'href="https://www.instagram.com/eead.cl/"',
    "HOLA@EEAD.CL",
    "(+569) 87 28 31 54",
    "@EEAD.CL",
    'class="contact-channel__arrow" aria-hidden="true">↗</span>',
    'href="/privacidad/"',
    'name="_honey"',
    'data-submit-label>ENVIAR CONSULTA</span>',
    'aria-live="polite"',
    'aria-atomic="true"'
  ].forEach((value) => assert.ok(html.includes(value), value));

  assert.doesNotMatch(form, /class="button__arrow"/);

  ["CONTACTO</p>", "CANALES DIRECTOS</h2>", "Conversemos sobre tu proyecto."].forEach((value) => {
    assert.ok(!html.includes(value), value);
  });

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
  assert.match(css, /\.contact-page::before/);
  assert.match(css, /\.contact-page\s*\{[\s\S]*?background:\s*var\(--ink\)/);
  assert.match(css, /\.contact-page__form-area > h2\s*\{[\s\S]*?font-size:\s*0\.9rem/);
  assert.match(css, /\.page-contact \.form-submit \.button\s*\{[\s\S]*?color:\s*#fff/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.page-contact \.form-grid,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(min-width: 1101px\)[\s\S]*?\.contact-page__intro\s*\{[\s\S]*?position:\s*sticky/);
  assert.doesNotMatch(css, /\.contact-page\s*\{[\s\S]*?min-height:\s*100/);

  assert.match(javascript, /let isSubmitting = false/);
  assert.match(javascript, /if \(isSubmitting\) return/);
  assert.match(javascript, /new AbortController\(\)/);
});

test("los CTA conservan contexto, accesibilidad y medición sin instalar analítica", () => {
  const javascript = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const files = [
    "index.html",
    "proyectos/index.html",
    ...projects.map((project) => `proyectos/${project.slug}/index.html`),
    "servicios/index.html",
    "oficina-tecnica/index.html",
    "estudio/index.html",
    "contacto/index.html"
  ];

  files.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(html, /Agendar reunión|Agenda una reunión|Solicitar reunión/);
    for (const match of html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) {
      assert.match(match[1], /href="https:\/\//, file);
      assert.match(match[1], /rel="noopener noreferrer"/, file);
    }
    for (const match of html.matchAll(/href="#([^"]+)"/g)) {
      assert.match(html, new RegExp(`id="${match[1]}"`), `${file}: #${match[1]}`);
    }
  });

  const antu = fs.readFileSync(path.join(root, "proyectos/antu/index.html"), "utf8");
  assert.match(antu, /servicio=arquitectura-interiorismo&amp;proyecto=antu/);
  assert.match(antu, /text=Hola%2C\+quisiera\+consultar\+por\+un\+proyecto\+similar\+a\+ANTU\./);
  assert.match(antu, /aria-label="Contactar por WhatsApp" title="Contactar por WhatsApp"/);

  assert.match(javascript, /typeof window\.gtag === "function"/);
  assert.match(javascript, /Array\.isArray\(window\.dataLayer\)/);
  ["cta_click", "whatsapp_click", "email_click", "form_start", "form_submit"].forEach((eventName) => {
    assert.ok(javascript.includes(`"${eventName}"`), eventName);
  });
  assert.match(javascript, /Object\.hasOwn\(serviceLabels, service\)/);
  assert.match(javascript, /Object\.hasOwn\(projectNames, projectSlug\)/);
  assert.match(javascript, /!message\.value\.trim\(\)/);
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
