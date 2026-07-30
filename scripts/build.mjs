import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects, projectBySlug } from "../content/projects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://eead.cl";
const defaultImage = "/assets/img/project-details/antu/img-0.webp";
const buildDate = "2026-07-30";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const encodePublicPath = (publicPath) =>
  publicPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");

const siteAsset = (publicPath) => `${siteUrl}${encodePublicPath(publicPath)}`;

function readImageSize(publicPath) {
  const filePath = path.join(root, publicPath.replace(/^\//, ""));
  const buffer = fs.readFileSync(filePath);

  if (buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const format = buffer.subarray(12, 16).toString("ascii");
    if (format === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (format === "VP8 ") {
      const frame = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
      if (frame !== -1) {
        return {
          width: buffer.readUInt16LE(frame + 3) & 0x3fff,
          height: buffer.readUInt16LE(frame + 5) & 0x3fff
        };
      }
    }
    if (format === "VP8L" && buffer[20] === 0x2f) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }
  }

  throw new Error(`No fue posible leer las dimensiones de ${publicPath}`);
}

function responsiveVariants(src) {
  const { width, height } = readImageSize(src);
  const widths = [...new Set([
    ...[480, 640, 800, 960, 1200, 1600, 1920].filter((candidate) => candidate < width),
    Math.min(width, 1920)
  ])].sort((a, b) => a - b);
  const variant = (candidate, extension) =>
    src
      .replace(/^\/assets\/img\//, "/assets/img/optimized/")
      .replace(/\.[^.]+$/, `-${candidate}.${extension}`);

  return {
    width,
    height,
    webp: widths.map((candidate) => `${encodePublicPath(variant(candidate, "webp"))} ${candidate}w`).join(", "),
    avif: widths.map((candidate) => `${encodePublicPath(variant(candidate, "avif"))} ${candidate}w`).join(", "),
    fallback: encodePublicPath(variant(widths.at(-1), "webp"))
  };
}

function image(src, alt, {
  className = "",
  eager = false,
  sizes = "(max-width: 760px) 100vw, 50vw"
} = {}) {
  const { width, height, webp, avif, fallback } = responsiveVariants(src);

  return `<picture class="responsive-media">
    <source type="image/avif" srcset="${avif}" sizes="${sizes}">
    <source type="image/webp" srcset="${webp}" sizes="${sizes}">
    <img${className ? ` class="${className}"` : ""} src="${fallback}" srcset="${webp}" sizes="${sizes}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>
  </picture>`;
}

function navLink(href, label, current, key) {
  return `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
}

function header(current = "") {
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header" data-header>
    <a class="brand" href="/" aria-label="EEAD, inicio">
      <img class="brand__symbol" data-brand-image src="/assets/brand/eead-symbol.svg" width="96" height="96" alt="" loading="eager" decoding="async">
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">
      <span>Menú</span>
      <span class="menu-toggle__line" aria-hidden="true"></span>
    </button>
    <nav class="site-nav" id="menu-principal" aria-label="Navegación principal">
      ${navLink("/proyectos/", "Proyectos", current, "proyectos")}
      ${navLink("/servicios/", "Servicios", current, "servicios")}
      ${navLink("/oficina-tecnica/", "Oficina técnica", current, "oficina-tecnica")}
      ${navLink("/estudio/", "Estudio", current, "estudio")}
      ${navLink("/contacto/", "Contacto", current, "contacto")}
    </nav>
  </header>`;
}

function footer() {
  return `
  <footer class="site-footer">
    <div class="site-footer__top">
      <div class="footer-brand">
        <img data-brand-image src="/assets/brand/eead-full.svg" width="2504" height="960" alt="EEAD — Arquitectura y Diseño" loading="lazy" decoding="async">
      </div>
      <p>Arquitectura e interiorismo<br>Temuco, Chile</p>
      <nav aria-label="Navegación secundaria">
        <a href="/proyectos/">Proyectos</a>
        <a href="/servicios/">Servicios</a>
        <a href="/oficina-tecnica/">Oficina técnica</a>
        <a href="/estudio/">Estudio</a>
        <a href="/contacto/">Contacto</a>
      </nav>
    </div>
    <div class="site-footer__bottom">
      <p>© ${new Date().getFullYear()} EEAD</p>
      <p>Proyectos claros, precisos y construibles.</p>
    </div>
  </footer>`;
}

function page({
  title,
  description,
  pathname,
  current = "",
  body,
  ogImage = defaultImage,
  ogType = "website",
  robots = "index, follow",
  preloadImage = "",
  jsonLd
}) {
  const canonical = `${siteUrl}${pathname}`;
  const absoluteImage = siteAsset(ogImage);
  const preload = preloadImage ? responsiveVariants(preloadImage) : null;
  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${robots}">
  <meta name="theme-color" content="#f4f2ed">
  <link rel="canonical" href="${canonical}">
  <meta property="og:locale" content="es_CL">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="EEAD">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${absoluteImage}">
  <meta property="og:image:alt" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${absoluteImage}">
  <link rel="icon" href="/assets/brand/eead-symbol.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/favicon.png">
  <link rel="preload" href="/assets/fonts/manrope-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  ${preload ? `<link rel="preload" as="image" href="${preload.fallback}" imagesrcset="${preload.webp}" imagesizes="100vw" fetchpriority="high">` : ""}
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="/main.js" defer></script>
</head>
<body>
${header(current)}
<main id="contenido">
${body}
</main>
${footer()}
</body>
</html>
`;
}

function projectCard(project, { featured = false } = {}) {
  return `
    <article class="project-card${featured ? " project-card--featured" : ""}" data-project-card data-category="${project.category}">
      <a href="/proyectos/${project.slug}/">
        <div class="project-card__media">
          ${image(project.cover, `${project.title}: ${project.description}`, {
            sizes: featured ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 760px) 100vw, 50vw"
          })}
        </div>
        <div class="project-card__meta">
          <h2>${escapeHtml(project.title)}</h2>
          <p>${escapeHtml(project.category)} <span aria-hidden="true">·</span> ${escapeHtml(project.location)}</p>
        </div>
      </a>
    </article>`;
}

function homePage() {
  const featured = ["casa-alicia", "zenteno", "big-dreams", "quincho-ss"]
    .map((slug) => projectBySlug.get(slug));
  const body = `
  <section class="hero">
    <div class="hero__media">
      ${image(defaultImage, "Vista interior del proyecto Antü, arquitectura de EEAD", {
        className: "hero__image",
        eager: true,
        sizes: "100vw"
      })}
    </div>
    <div class="hero__veil" aria-hidden="true"></div>
    <div class="hero__content">
      <p class="eyebrow">Arquitectura e interiorismo · Temuco, Chile</p>
      <h1>Arquitectura diseñada para construirse mejor.</h1>
      <p class="hero__lead">EEAD integra diseño, visualización y desarrollo técnico para convertir decisiones complejas en proyectos claros, precisos y construibles.</p>
      <div class="hero__actions">
        <a class="button button--primary" href="/proyectos/">Ver proyectos</a>
        <a class="button button--light" href="/contacto/">Hablemos de su proyecto</a>
      </div>
    </div>
  </section>

  <section class="section intro">
    <div class="section__label"><p>01 / Enfoque</p></div>
    <div class="intro__copy">
      <h2>Diseño y técnica trabajan juntos desde el inicio.</h2>
      <p>Desarrollamos proyectos de arquitectura e interiorismo con una mirada integral. La visualización ayuda a decidir; la oficina técnica convierte esas decisiones en información coordinada para construir.</p>
    </div>
  </section>

  <section class="section section--projects" aria-labelledby="proyectos-destacados">
    <div class="section__heading">
      <p class="eyebrow">Proyectos seleccionados</p>
      <h2 id="proyectos-destacados">Trabajo reciente</h2>
      <a class="text-link" href="/proyectos/">Ver todos los proyectos</a>
    </div>
    <div class="project-grid project-grid--editorial">
      ${featured.map((project, index) => projectCard(project, { featured: index === 0 })).join("")}
    </div>
  </section>

  <section class="section services-preview" aria-labelledby="servicios-inicio">
    <div class="section__heading">
      <p class="eyebrow">Servicios</p>
      <h2 id="servicios-inicio">Tres capacidades, un proceso coordinado.</h2>
    </div>
    <div class="service-list">
      <a href="/servicios/#arquitectura">
        <span>01</span>
        <h3>Arquitectura e interiorismo</h3>
        <p>Del programa y la estrategia espacial al desarrollo técnico.</p>
      </a>
      <a href="/oficina-tecnica/">
        <span>02</span>
        <h3>Oficina técnica externa</h3>
        <p>Modelación, coordinación y documentación para equipos y oficinas.</p>
      </a>
      <a href="/servicios/#visualizacion">
        <span>03</span>
        <h3>Visualización arquitectónica</h3>
        <p>Imágenes para evaluar, comunicar y decidir con mayor precisión.</p>
      </a>
    </div>
  </section>

  <section class="contact-band">
    <p class="eyebrow">Un proyecto comienza con una conversación clara.</p>
    <h2>Conversemos sobre su encargo.</h2>
    <a class="button button--primary" href="/contacto/">Contactar a EEAD</a>
  </section>`;

  return page({
    title: "EEAD — Arquitectura e interiorismo en Temuco",
    description: "EEAD integra arquitectura, interiorismo, visualización y desarrollo técnico para crear proyectos claros, precisos y construibles desde Temuco, Chile.",
    pathname: "/",
    body,
    preloadImage: defaultImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "EEAD",
      url: `${siteUrl}/`,
      logo: `${siteUrl}/assets/brand/eead-symbol.svg`,
      image: siteAsset(defaultImage),
      description: "Oficina de arquitectura e interiorismo con servicios de desarrollo técnico y visualización arquitectónica.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Temuco",
        addressCountry: "CL"
      },
      areaServed: "Chile",
      serviceType: [
        "Arquitectura e interiorismo",
        "Oficina técnica externa",
        "Visualización arquitectónica"
      ]
    }
  });
}

function projectsPage() {
  const categories = ["Todos", ...new Set(projects.map((project) => project.category))];
  const body = `
  <header class="page-intro">
    <p class="eyebrow">Archivo seleccionado · ${projects.length} proyectos</p>
    <h1>Proyectos</h1>
    <p>Arquitectura, interiorismo, desarrollo técnico y visualización entendidos como partes de un mismo proceso de proyecto.</p>
  </header>
  <section class="project-index" aria-labelledby="lista-proyectos">
    <h2 class="sr-only" id="lista-proyectos">Listado de proyectos</h2>
    <div class="filters" role="group" aria-label="Filtrar proyectos por categoría">
      ${categories.map((category, index) => `<button type="button" data-filter="${category}" aria-pressed="${index === 0 ? "true" : "false"}">${category}</button>`).join("")}
    </div>
    <p class="sr-only" data-filter-status aria-live="polite">${projects.length} proyectos visibles.</p>
    <div class="project-grid">
      ${projects.map((project) => projectCard(project)).join("")}
    </div>
  </section>`;

  return page({
    title: "Proyectos de arquitectura e interiorismo — EEAD",
    description: "Selección de proyectos EEAD en arquitectura, interiorismo, oficina técnica y visualización arquitectónica en Chile.",
    pathname: "/proyectos/",
    current: "proyectos",
    body,
    ogImage: projects[2].cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Proyectos — EEAD",
      url: `${siteUrl}/proyectos/`,
      description: "Selección de proyectos de arquitectura, interiorismo, oficina técnica y visualización.",
      hasPart: projects.map((project) => ({
        "@type": "CreativeWork",
        name: project.title,
        url: `${siteUrl}/proyectos/${project.slug}/`
      }))
    }
  });
}

function projectPage(project) {
  const related = project.related.map((slug) => projectBySlug.get(slug)).filter(Boolean);
  const body = `
  <article class="project-detail">
    <header class="project-hero">
      <div class="project-hero__heading">
        <p class="eyebrow">${escapeHtml(project.category)}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.description)}</p>
      </div>
      <dl class="project-facts">
        <div><dt>Ubicación</dt><dd>${escapeHtml(project.location)}</dd></div>
        <div><dt>Año</dt><dd>${escapeHtml(project.year)}</dd></div>
        <div><dt>Estado</dt><dd>${escapeHtml(project.status)}</dd></div>
        <div><dt>Superficie</dt><dd>${escapeHtml(project.surface)}</dd></div>
        <div><dt>Alcance</dt><dd>${escapeHtml(project.scope)}</dd></div>
      </dl>
      <div class="project-hero__media">
        ${image(project.cover, project.images[0][1], { eager: true, sizes: "100vw" })}
      </div>
    </header>

    <section class="project-narrative" aria-label="Desarrollo del proyecto">
      <div>
        <p class="eyebrow">El problema</p>
        <h2>Una condición concreta que ordenar.</h2>
        <p>${escapeHtml(project.problem)}</p>
      </div>
      <div>
        <p class="eyebrow">Decisión arquitectónica</p>
        <h2>Una estrategia legible.</h2>
        <p>${escapeHtml(project.decision)}</p>
      </div>
      <div>
        <p class="eyebrow">Desarrollo</p>
        <h2>Del criterio a la información construible.</h2>
        <p>${escapeHtml(project.development)}</p>
      </div>
    </section>

    <section class="project-gallery" aria-labelledby="galeria-${project.slug}">
      <div class="section__heading">
        <p class="eyebrow">Galería</p>
        <h2 id="galeria-${project.slug}">Imágenes del proyecto</h2>
      </div>
      <div class="gallery-grid">
        ${project.images.map(([src, alt], index) => `
          <figure class="${index === 0 ? "gallery-grid__wide" : ""}">
            ${image(src, alt, {
              eager: false,
              sizes: index === 0 ? "100vw" : "(max-width: 760px) 100vw, 50vw"
            })}
            <figcaption>${escapeHtml(alt)}</figcaption>
          </figure>`).join("")}
      </div>
    </section>

    <section class="related-projects" aria-labelledby="relacionados-${project.slug}">
      <div class="section__heading">
        <p class="eyebrow">Continuar explorando</p>
        <h2 id="relacionados-${project.slug}">Proyectos relacionados</h2>
      </div>
      <div class="project-grid project-grid--related">
        ${related.map((item) => projectCard(item)).join("")}
      </div>
    </section>
  </article>`;

  return page({
    title: `${project.title} — ${project.category} | EEAD`,
    description: `${project.description} ${project.scope}.`,
    pathname: `/proyectos/${project.slug}/`,
    current: "proyectos",
    body,
    ogImage: project.cover,
    ogType: "article",
    preloadImage: project.cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.title,
      url: `${siteUrl}/proyectos/${project.slug}/`,
      description: project.description,
      image: siteAsset(project.cover),
      locationCreated: {
        "@type": "Place",
        name: project.location
      },
      creator: {
        "@type": "Organization",
        name: "EEAD",
        url: `${siteUrl}/`
      },
      genre: project.category
    }
  });
}

function servicesPage() {
  const body = `
  <header class="page-intro">
    <p class="eyebrow">Servicios</p>
    <h1>Capacidades integradas para decidir y construir mejor.</h1>
    <p>EEAD acompaña proyectos completos y etapas específicas, manteniendo una relación directa entre intención arquitectónica, representación y desarrollo técnico.</p>
  </header>

  <section class="service-detail" id="arquitectura">
    <div class="service-detail__number">01</div>
    <div>
      <p class="eyebrow">Arquitectura e interiorismo</p>
      <h2>Espacios coherentes desde el programa hasta el detalle.</h2>
    </div>
    <div class="service-detail__copy">
      <p>Desarrollamos viviendas, espacios de trabajo, equipamiento y remodelaciones. Cada encargo se estructura desde sus condiciones reales: personas, lugar, presupuesto, normativa y forma de construir.</p>
      <ul>
        <li>Estudios de cabida y definición de programa</li>
        <li>Anteproyecto y visualización</li>
        <li>Proyecto de arquitectura e interiorismo</li>
        <li>Especificaciones y coordinación técnica</li>
        <li>Apoyo durante licitación y obra</li>
      </ul>
    </div>
  </section>

  <section class="service-detail" id="oficina-tecnica">
    <div class="service-detail__number">02</div>
    <div>
      <p class="eyebrow">Oficina técnica externa</p>
      <h2>Capacidad técnica flexible para equipos con carga variable.</h2>
    </div>
    <div class="service-detail__copy">
      <p>Nos integramos a oficinas, constructoras y equipos de proyecto para modelar, coordinar y documentar entregas específicas con criterios verificables.</p>
      <ul>
        <li>Modelación BIM y levantamiento</li>
        <li>Coordinación de especialidades</li>
        <li>Planimetría y detalles constructivos</li>
        <li>Revisión de interferencias y consistencia</li>
        <li>Protocolos y apoyo a equipos internos</li>
      </ul>
      <a class="text-link" href="/oficina-tecnica/">Conocer la oficina técnica</a>
    </div>
  </section>

  <section class="service-detail" id="visualizacion">
    <div class="service-detail__number">03</div>
    <div>
      <p class="eyebrow">Visualización arquitectónica</p>
      <h2>Imágenes que sirven para evaluar, no solo para presentar.</h2>
    </div>
    <div class="service-detail__copy">
      <p>Producimos imágenes con criterio arquitectónico para validar atmósferas, materialidad, escala y decisiones de proyecto antes de construir.</p>
      <ul>
        <li>Dirección de imagen y encuadres</li>
        <li>Modelación y preparación de escenas</li>
        <li>Imágenes interiores y exteriores</li>
        <li>Series para venta, concursos y aprobación</li>
        <li>Apoyo visual durante el diseño</li>
      </ul>
    </div>
  </section>

  <section class="contact-band">
    <p class="eyebrow">¿Qué etapa necesita resolver?</p>
    <h2>Definamos un alcance útil para su proyecto.</h2>
    <a class="button button--primary" href="/contacto/">Hablemos</a>
  </section>`;

  return page({
    title: "Servicios de arquitectura, oficina técnica y visualización — EEAD",
    description: "Servicios EEAD de arquitectura e interiorismo, oficina técnica externa y visualización arquitectónica para proyectos en Chile.",
    pathname: "/servicios/",
    current: "servicios",
    body,
    ogImage: projects[1].cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Servicios EEAD",
      provider: { "@type": "ProfessionalService", name: "EEAD" },
      areaServed: "Chile",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Arquitectura e interiorismo" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Oficina técnica externa" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Visualización arquitectónica" } }
        ]
      }
    }
  });
}

function technicalOfficePage() {
  const proofImage = projectBySlug.get("zenteno").images.at(-1)[0];
  const body = `
  <header class="page-intro page-intro--technical">
    <p class="eyebrow">Oficina técnica externa</p>
    <h1>Capacidad técnica cuando el proyecto la necesita.</h1>
    <p>EEAD se integra a equipos de arquitectura, construcción e inmobiliarios para transformar información fragmentada en modelos, planos y decisiones coordinadas.</p>
  </header>

  <section class="technical-flow" aria-labelledby="flujo-tecnico">
    <div class="section__heading">
      <p class="eyebrow">Forma de trabajo</p>
      <h2 id="flujo-tecnico">Un proceso visible y verificable.</h2>
    </div>
    <ol>
      <li><span>01</span><h3>Diagnóstico</h3><p>Revisamos antecedentes, objetivos, estándar y fecha de entrega.</p></li>
      <li><span>02</span><h3>Alcance</h3><p>Definimos entregables, responsables, hitos y criterios de revisión.</p></li>
      <li><span>03</span><h3>Desarrollo</h3><p>Modelamos y documentamos con controles intermedios sobre puntos críticos.</p></li>
      <li><span>04</span><h3>Entrega</h3><p>Verificamos consistencia y dejamos registro de decisiones y pendientes.</p></li>
    </ol>
  </section>

  <section class="technical-scope">
    <div>
      <p class="eyebrow">Para quién</p>
      <h2>Oficinas con entregas exigentes o carga variable.</h2>
    </div>
    <div>
      <p>El servicio puede cubrir un paquete puntual o integrarse durante una etapa completa. Trabajamos con protocolos del mandante o proponemos una estructura de información proporcional al encargo.</p>
      <ul>
        <li>Oficinas de arquitectura</li>
        <li>Constructoras e inmobiliarias</li>
        <li>Equipos de coordinación</li>
        <li>Mandantes con proyectos en revisión</li>
      </ul>
    </div>
  </section>

  <section class="technical-proof">
    ${image(proofImage, "Volumetría general utilizada para coordinar el proyecto Zenteno", {
      sizes: "(max-width: 760px) 100vw, 60vw"
    })}
    <div>
      <p class="eyebrow">Resultado</p>
      <h2>Menos incertidumbre entre diseño, documentación y obra.</h2>
      <p>El objetivo no es producir más información, sino entregar la información correcta, en el momento correcto y con un nivel de desarrollo acordado.</p>
      <a class="text-link" href="/contacto/?motivo=apoyo-tecnico">Solicitar apoyo técnico</a>
    </div>
  </section>`;

  return page({
    title: "Oficina técnica externa y coordinación BIM — EEAD",
    description: "Apoyo técnico externo para oficinas y equipos: modelación BIM, coordinación de especialidades, planimetría y documentación desde Temuco.",
    pathname: "/oficina-tecnica/",
    current: "oficina-tecnica",
    body,
    ogImage: proofImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Oficina técnica externa",
      provider: { "@type": "ProfessionalService", name: "EEAD", url: `${siteUrl}/` },
      areaServed: "Chile",
      serviceType: ["Modelación BIM", "Coordinación de especialidades", "Documentación técnica"]
    }
  });
}

function studioPage() {
  const body = `
  <header class="page-intro">
    <p class="eyebrow">Estudio</p>
    <h1>Una oficina pequeña con mirada integral.</h1>
    <p>EEAD trabaja en la intersección entre diseño, representación y desarrollo técnico. Esa continuidad permite sostener las decisiones importantes desde el primer esquema hasta la documentación.</p>
  </header>

  <section class="studio-statement">
    <p>Creemos en una arquitectura precisa: sensible al lugar, clara para quienes la usan y rigurosa en la forma en que se comunica y construye.</p>
  </section>

  <section class="studio-director">
    <div>
      <p class="eyebrow">Dirección</p>
      <h2>Emir Esparza</h2>
      <p class="role">Fundador y director</p>
    </div>
    <div>
      <p>Arquitecto con experiencia en diseño, interiorismo, visualización y coordinación BIM. Dirige EEAD desde Temuco y articula equipos específicos según la escala y las necesidades de cada proyecto.</p>
      <p>Su práctica combina criterio editorial, experiencia docente y desarrollo técnico para hacer legibles decisiones complejas y mantenerlas consistentes durante el proceso.</p>
    </div>
  </section>

  <section class="studio-values" aria-labelledby="principios-estudio">
    <div class="section__heading">
      <p class="eyebrow">Principios</p>
      <h2 id="principios-estudio">Cómo trabaja EEAD</h2>
    </div>
    <div>
      <article><span>01</span><h3>Claridad antes que efecto</h3><p>Cada recurso debe explicar, organizar o mejorar el proyecto.</p></article>
      <article><span>02</span><h3>Diseño con información</h3><p>Las decisiones se apoyan en condiciones reales y se comprueban durante el desarrollo.</p></article>
      <article><span>03</span><h3>Coordinación temprana</h3><p>Anticipar encuentros reduce cambios tardíos y protege la intención arquitectónica.</p></article>
    </div>
  </section>

  <section class="contact-band">
    <p class="eyebrow">Temuco · Chile</p>
    <h2>Cuéntenos qué necesita resolver.</h2>
    <a class="button button--primary" href="/contacto/">Iniciar conversación</a>
  </section>`;

  return page({
    title: "Estudio de arquitectura en Temuco — EEAD",
    description: "Conoce EEAD, oficina de arquitectura, interiorismo y desarrollo técnico fundada y dirigida por Emir Esparza en Temuco, Chile.",
    pathname: "/estudio/",
    current: "estudio",
    body,
    ogImage: projects[0].cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Estudio — EEAD",
      url: `${siteUrl}/estudio/`,
      about: {
        "@type": "ProfessionalService",
        name: "EEAD",
        founder: {
          "@type": "Person",
          name: "Emir Esparza",
          jobTitle: "Fundador y director"
        }
      }
    }
  });
}

function contactPage() {
  const body = `
  <header class="page-intro page-intro--contact">
    <p class="eyebrow">Contacto</p>
    <h1>Hablemos de su proyecto.</h1>
    <p>Comparta el contexto, la etapa y lo que necesita resolver. EEAD responderá con los próximos pasos y la información necesaria para definir un alcance.</p>
  </header>

  <section class="contact-layout">
    <aside>
      <p class="eyebrow">Antes de enviar</p>
      <p>No necesita tener todo definido. Una ubicación, una etapa aproximada y el objetivo principal son suficientes para comenzar.</p>
      <dl>
        <div><dt>Base</dt><dd>Temuco, Chile</dd></div>
        <div><dt>Cobertura</dt><dd>Proyectos en Chile y apoyo técnico remoto</dd></div>
        <div><dt>Respuesta</dt><dd>Dentro de 2 días hábiles</dd></div>
      </dl>
    </aside>

    <form class="contact-form" id="contact-form" action="https://formsubmit.co/ajax/emiresparza@gmail.com" method="post" novalidate>
      <fieldset>
        <legend>¿Cómo podemos ayudarle?</legend>
        <label class="choice">
          <input type="radio" name="motivo" value="Quiero desarrollar un proyecto" required checked>
          <span>Quiero desarrollar un proyecto</span>
        </label>
        <label class="choice">
          <input type="radio" name="motivo" value="Necesito apoyo técnico" required>
          <span>Necesito apoyo técnico</span>
        </label>
      </fieldset>

      <div class="form-grid">
        <div class="field">
          <label for="nombre">Nombre</label>
          <input id="nombre" name="nombre" type="text" autocomplete="name" required aria-describedby="error-nombre">
          <p class="field-error" id="error-nombre"></p>
        </div>
        <div class="field">
          <label for="correo">Correo</label>
          <input id="correo" name="correo" type="email" autocomplete="email" required aria-describedby="error-correo">
          <p class="field-error" id="error-correo"></p>
        </div>
        <div class="field">
          <label for="telefono">Teléfono <span>(opcional)</span></label>
          <input id="telefono" name="telefono" type="tel" autocomplete="tel" aria-describedby="error-telefono">
          <p class="field-error" id="error-telefono"></p>
        </div>
        <div class="field">
          <label for="tipo-encargo">Tipo de encargo</label>
          <select id="tipo-encargo" name="tipo_encargo" required aria-describedby="error-tipo-encargo">
            <option value="">Seleccione una opción</option>
            <option>Vivienda nueva</option>
            <option>Remodelación o interiorismo</option>
            <option>Proyecto comercial o institucional</option>
            <option>Oficina técnica y coordinación</option>
            <option>Visualización arquitectónica</option>
            <option>Otro encargo</option>
          </select>
          <p class="field-error" id="error-tipo-encargo"></p>
        </div>
        <div class="field">
          <label for="ubicacion">Ubicación</label>
          <input id="ubicacion" name="ubicacion" type="text" autocomplete="address-level2" required aria-describedby="error-ubicacion">
          <p class="field-error" id="error-ubicacion"></p>
        </div>
        <div class="field">
          <label for="etapa">Etapa actual</label>
          <select id="etapa" name="etapa_actual" required aria-describedby="error-etapa">
            <option value="">Seleccione una opción</option>
            <option>Idea inicial</option>
            <option>Buscando terreno o propiedad</option>
            <option>Anteproyecto</option>
            <option>Desarrollo técnico</option>
            <option>Permisos o licitación</option>
            <option>En construcción</option>
          </select>
          <p class="field-error" id="error-etapa"></p>
        </div>
      </div>

      <div class="field">
        <label for="mensaje">Mensaje</label>
        <textarea id="mensaje" name="mensaje" rows="7" required aria-describedby="ayuda-mensaje error-mensaje"></textarea>
        <p class="field-help" id="ayuda-mensaje">Incluya objetivos, plazos o restricciones que considere importantes.</p>
        <p class="field-error" id="error-mensaje"></p>
      </div>

      <input type="text" name="_honey" class="form-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="hidden" name="_subject" value="Nuevo contacto desde eead.cl">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_captcha" value="false">

      <div class="form-submit">
        <button class="button button--primary" type="submit" data-submit>
          <span data-submit-label>Enviar consulta</span>
        </button>
        <p>Al enviar, acepta que EEAD use estos datos únicamente para responder su consulta.</p>
      </div>
      <div class="form-status" data-form-status role="status" aria-live="polite" tabindex="-1"></div>
    </form>
  </section>`;

  return page({
    title: "Contacto — EEAD",
    description: "Contacta a EEAD para desarrollar un proyecto de arquitectura e interiorismo o solicitar apoyo técnico, modelación y coordinación.",
    pathname: "/contacto/",
    current: "contacto",
    body,
    ogImage: projects[1].cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contacto — EEAD",
      url: `${siteUrl}/contacto/`,
      about: { "@type": "ProfessionalService", name: "EEAD" }
    }
  });
}

function notFoundPage() {
  const body = `
  <section class="not-found">
    <p class="eyebrow">Error 404</p>
    <h1>Esta página no existe.</h1>
    <p>La dirección puede haber cambiado durante la actualización del sitio.</p>
    <div>
      <a class="button button--primary" href="/">Ir al inicio</a>
      <a class="text-link" href="/proyectos/">Ver proyectos</a>
    </div>
  </section>`;

  return page({
    title: "Página no encontrada — EEAD",
    description: "La página solicitada no está disponible. Vuelve al inicio de EEAD o explora los proyectos.",
    pathname: "/404.html",
    body,
    robots: "noindex, follow",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Página no encontrada"
    }
  });
}

function writeFile(relativePath, contents) {
  const outputPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents, "utf8");
}

function writeRoute(pathname, contents) {
  const relativePath = pathname === "/" ? "index.html" : `${pathname.replace(/^\/|\/$/g, "")}/index.html`;
  writeFile(relativePath, contents);
}

function redirectStub(destination, { script = "", canonical = destination } = {}) {
  const target = `${siteUrl}${canonical}`;
  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${target}">
  <meta http-equiv="refresh" content="0;url=${destination}">
  <title>Contenido trasladado — EEAD</title>
</head>
<body>
  <p>Este contenido cambió de ubicación. <a href="${destination}">Continuar en EEAD</a>.</p>
  ${script}
</body>
</html>`;
}

const projectOutputDirectory = path.join(root, "proyectos");
const activeProjectSlugs = new Set(projects.map((project) => project.slug));
if (fs.existsSync(projectOutputDirectory)) {
  for (const entry of fs.readdirSync(projectOutputDirectory, { withFileTypes: true })) {
    if (entry.isDirectory() && !activeProjectSlugs.has(entry.name)) {
      fs.rmSync(path.join(projectOutputDirectory, entry.name), { recursive: true, force: true });
    }
  }
}

writeRoute("/", homePage());
writeRoute("/proyectos/", projectsPage());
projects.forEach((project) => writeRoute(`/proyectos/${project.slug}/`, projectPage(project)));
writeRoute("/servicios/", servicesPage());
writeRoute("/oficina-tecnica/", technicalOfficePage());
writeRoute("/estudio/", studioPage());
writeRoute("/contacto/", contactPage());
writeFile("404.html", notFoundPage());

writeFile("projects.html", redirectStub("/proyectos/"));
writeFile("nosotros.html", redirectStub("/estudio/"));
writeFile("blog.html", redirectStub("/", { canonical: "/" }));
writeFile("post.html", redirectStub("/", { canonical: "/" }));
writeFile("proyecto.html", redirectStub("/proyectos/", {
  canonical: "/proyectos/",
  script: `<script>
  const slug = new URLSearchParams(location.search).get("id");
  const routes = ${JSON.stringify(projects.map((project) => project.slug))};
  if (routes.includes(slug)) location.replace("/proyectos/" + slug + "/");
  </script>`
}));

const sitemapPaths = [
  "/",
  "/proyectos/",
  ...projects.map((project) => `/proyectos/${project.slug}/`),
  "/servicios/",
  "/oficina-tecnica/",
  "/estudio/",
  "/contacto/"
];

writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((pathname, index) => `  <url>
    <loc>${siteUrl}${pathname}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${pathname === "/" ? "monthly" : "yearly"}</changefreq>
    <priority>${pathname === "/" ? "1.0" : index === 1 ? "0.9" : "0.7"}</priority>
  </url>`).join("\n")}
</urlset>
`);

writeFile("robots.txt", `User-agent: *
Allow: /
Disallow: /blog.html
Disallow: /post.html

Sitemap: ${siteUrl}/sitemap.xml
`);

writeFile("_redirects", `# Reglas compatibles con Cloudflare Pages y Netlify
/projects.html        /proyectos/          301
/nosotros.html        /estudio/            301
/blog.html            /                    301
/post.html            /                    301
/index.html           /                    301
`);

console.log(`Sitio generado: ${sitemapPaths.length} rutas indexables y ${projects.length} proyectos.`);
