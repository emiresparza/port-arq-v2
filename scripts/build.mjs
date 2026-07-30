import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects, projectBySlug } from "../content/projects.mjs";
import { legacyStaticRedirects } from "../content/legacy-routes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://eead.cl";
const defaultImage = "/assets/img/project-details/antu/img-0.webp";
const buildDate = "2026-07-30";
const syneSource = path.join(root, "node_modules", "@fontsource", "syne", "files", "syne-latin-800-normal.woff2");
const syneTarget = path.join(root, "assets", "fonts", "syne-latin-800-normal.woff2");

if (fs.existsSync(syneSource)) {
  fs.mkdirSync(path.dirname(syneTarget), { recursive: true });
  fs.copyFileSync(syneSource, syneTarget);
}

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
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú principal">
      <span data-menu-label>Menú</span>
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
        <div class="footer-lockup">
          <img class="footer-lockup__symbol" data-brand-image src="/assets/brand/eead-symbol.svg" width="960" height="960" alt="" loading="lazy" decoding="async">
          <div>
            <span class="footer-wordmark">EEAD</span>
            <p class="footer-descriptor">Arquitectura e interiorismo<br>Temuco, Chile</p>
          </div>
        </div>
      </div>
      <nav aria-label="Navegación secundaria">
        <a href="/proyectos/">Proyectos</a>
        <a href="/servicios/">Servicios</a>
        <a href="/oficina-tecnica/">Oficina técnica</a>
        <a href="/estudio/">Estudio</a>
        <a href="/contacto/">Contacto</a>
        <a href="/privacidad/">Privacidad</a>
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
  jsonLd,
  bodyClass = ""
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
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
${header(current)}
<main id="contenido" tabindex="-1">
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

function homeCarouselSlide(project, index, activeIndex) {
  return `
      <article class="project-carousel__slide" data-carousel-slide data-project-slug="${project.slug}" data-title="${escapeHtml(project.title)}"${index === activeIndex ? " data-active" : ""}>
        <a href="/proyectos/${project.slug}/"${index === activeIndex ? ' aria-current="true"' : ""} aria-label="Ver proyecto ${escapeHtml(project.title)}">
          ${image(project.cover, `${project.title}: ${project.description}`, {
            sizes: "(max-width: 760px) 84vw, 68vw"
          })}
          <span class="sr-only">${escapeHtml(project.title)}</span>
        </a>
      </article>`;
}

const homeTickerPhrases = [
  "Arquitectura e interiorismo",
  "Proyectos que se entienden antes de construir",
  "Diseño, visualización y oficina técnica externa",
  "Chile"
];

function homeTickerGroup() {
  return homeTickerPhrases
    .map((phrase) => `<span>${escapeHtml(phrase)}</span><span class="editorial-ticker__separator">·</span>`)
    .join("");
}

function homePage() {
  const prioritySlugs = ["zenteno", "casa-alicia", "antu", "quincho-ss"];
  const prioritySlugSet = new Set(prioritySlugs);
  const carouselProjects = [
    ...prioritySlugs.map((slug) => projectBySlug.get(slug)).filter(Boolean),
    ...projects.filter((project) => !prioritySlugSet.has(project.slug))
  ];
  const activeProjectIndex = carouselProjects.findIndex((project) => project.slug === "casa-alicia");
  const activeProject = carouselProjects[activeProjectIndex];
  const technicalImage = projectBySlug.get("zenteno").images.at(-1)[0];
  const body = `
  <section class="hero" data-hero-motion>
    <div class="hero__media" data-hero-media>
      <div class="hero__media-scroll" data-hero-scroll>
        <div class="hero__media-pointer" data-hero-pointer>
          ${image(defaultImage, "Vista interior del proyecto Antü, arquitectura de EEAD", {
            className: "hero__image",
            eager: true,
            sizes: "100vw"
          })}
        </div>
      </div>
    </div>
    <div class="hero__contrast" aria-hidden="true"></div>
    <div class="hero__dither" aria-hidden="true"></div>
    <div class="hero__content hero__grid">
      <div class="hero__stack">
        <h1><span>Arquitectura</span><span>diseñada para</span><span>construirse</span><span>mejor.</span></h1>
        <p class="eyebrow">Arquitectura e interiorismo · Temuco, Chile</p>
        <div class="hero__copy">
          <p class="hero__lead">EEAD integra diseño, visualización y desarrollo técnico para convertir decisiones complejas en proyectos claros, precisos y construibles.</p>
          <div class="hero__actions">
            <a class="button button--light" href="/proyectos/">Proyectos</a>
            <a class="button button--primary" href="/contacto/">Agenda una reunión</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="editorial-ticker" aria-label="Servicios y enfoque de EEAD">
    <p class="sr-only">Arquitectura e interiorismo. Proyectos que se entienden antes de construir. Diseño, visualización y oficina técnica externa. Chile.</p>
    <div class="editorial-ticker__viewport" aria-hidden="true">
      <div class="editorial-ticker__track">
        <div class="editorial-ticker__group" aria-hidden="true">${homeTickerGroup()}</div>
        <div class="editorial-ticker__group" aria-hidden="true">${homeTickerGroup()}</div>
      </div>
    </div>
  </section>

  <section class="manifesto" aria-labelledby="manifiesto-eead">
    <div class="manifesto__inner">
      <div class="manifesto__heading">
        <p class="manifesto__label">Manifiesto</p>
        <h2 id="manifiesto-eead"><span>Diseño y técnica</span><span>trabajan juntos</span><span>desde el inicio.</span></h2>
      </div>
      <p>Desarrollamos proyectos de arquitectura e interiorismo con una mirada integral. La visualización ayuda a decidir; la oficina técnica convierte esas decisiones en información coordinada para construir.</p>
    </div>
  </section>

  <section class="home-projects" aria-labelledby="proyectos-destacados">
    <div class="home-projects__header">
      <p class="eyebrow">Proyectos</p>
      <h2 id="proyectos-destacados">Trabajo reciente</h2>
      <a class="button button--primary button--compact home-projects__cta" href="/proyectos/">Ver todos los proyectos</a>
    </div>
    <div class="project-carousel" data-carousel data-carousel-current="${activeProjectIndex}" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Todos los proyectos">
      <button class="project-carousel__button project-carousel__button--previous" type="button" data-carousel-previous aria-label="Proyecto anterior">
        <span aria-hidden="true">←</span>
      </button>
      <div class="project-carousel__viewport" data-carousel-viewport>${carouselProjects.map((project, index) => homeCarouselSlide(project, index, activeProjectIndex)).join("")}</div>
      <button class="project-carousel__button project-carousel__button--next" type="button" data-carousel-next aria-label="Proyecto siguiente">
        <span aria-hidden="true">→</span>
      </button>
      <div class="project-carousel__caption" aria-live="polite" aria-atomic="true">
        <strong data-carousel-title>${escapeHtml(activeProject.title)}</strong>
      </div>
    </div>
  </section>

  <section class="home-services" aria-labelledby="servicios-inicio">
    <div class="home-services__intro">
      <p class="eyebrow">02 / Servicios</p>
      <h2 id="servicios-inicio">Tres capacidades, un proceso coordinado.</h2>
      <p>EEAD acompaña decisiones desde el primer esquema hasta la información necesaria para construir.</p>
    </div>
    <div class="home-services__chapters">
      <article>
        <span aria-hidden="true">01</span>
        <h3>Arquitectura e interiorismo</h3>
        <p>Del programa y la estrategia espacial al desarrollo técnico.</p>
        <a class="button button--primary button--compact" href="/servicios/#arquitectura">Explorar arquitectura</a>
      </article>
      <article>
        <span aria-hidden="true">02</span>
        <h3>Oficina técnica externa</h3>
        <p>Modelación, coordinación y documentación para equipos y oficinas.</p>
        <a class="button button--primary button--compact" href="/oficina-tecnica/">Explorar oficina técnica</a>
      </article>
      <article>
        <span aria-hidden="true">03</span>
        <h3>Visualización arquitectónica</h3>
        <p>Imágenes para evaluar, comunicar y decidir con mayor precisión.</p>
        <a class="button button--primary button--compact" href="/servicios/#visualizacion">Explorar visualización</a>
      </article>
    </div>
  </section>

  <section class="technical-strip" aria-labelledby="documentacion-tecnica">
    <div class="technical-strip__media">
      ${image(technicalImage, "Axonometría general del proyecto Zenteno utilizada para revisar su volumetría", {
        sizes: "(max-width: 760px) 100vw, 58vw"
      })}
    </div>
    <div class="technical-strip__copy">
      <p class="eyebrow">03 / Documentación</p>
      <h2 id="documentacion-tecnica"><span>La forma</span><span>también se</span><span>comprueba.</span></h2>
      <p>Modelos, axonometrías y matrices de control convierten una intención espacial en información coordinada y verificable.</p>
      <a class="text-link" href="/oficina-tecnica/">Ver metodología técnica</a>
    </div>
  </section>

  <section class="home-closure" aria-labelledby="contacto-home">
    <div class="home-closure__inner">
      <h2 id="contacto-home"><span>Conversemos</span><span>sobre su encargo.</span></h2>
      <div class="home-closure__action">
        <a class="button button--primary" href="/contacto/">Contactar a EEAD</a>
        <p>Un proyecto comienza con una conversación clara.</p>
      </div>
    </div>
  </section>`;

  return page({
    title: "EEAD — Arquitectura e interiorismo en Temuco",
    description: "EEAD integra arquitectura, interiorismo, visualización y desarrollo técnico para crear proyectos claros, precisos y construibles desde Temuco, Chile.",
    pathname: "/",
    body,
    preloadImage: defaultImage,
    bodyClass: "page-home",
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
    <p class="eyebrow">Archivo seleccionado</p>
    <h1>Proyectos</h1>
    <p>Arquitectura, interiorismo, desarrollo técnico y visualización entendidos como partes de un mismo proceso de proyecto.</p>
  </header>
  <section class="project-index" aria-labelledby="lista-proyectos">
    <h2 class="sr-only" id="lista-proyectos">Listado de proyectos</h2>
    <div class="filters" role="group" aria-label="Filtrar proyectos por categoría">
      ${categories.map((category, index) => `<button type="button" data-filter="${category}" aria-pressed="${index === 0 ? "true" : "false"}">${category}</button>`).join("")}
    </div>
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
  const projectIndex = projects.indexOf(project);
  const previous = projects[(projectIndex - 1 + projects.length) % projects.length];
  const next = projects[(projectIndex + 1) % projects.length];
  const facts = [
    ["Ubicación", project.location],
    ["Año", project.year],
    ["Estado", project.status],
    ["Superficie", project.surface],
    ["Alcance", project.scope]
  ].filter(([, value]) => value);
  const gallerySource = project.gallerySelection
    ? project.gallerySelection.map((index) => project.images[index]).filter(Boolean)
    : project.images.filter(([src]) => src !== project.cover).slice(0, 9);
  const galleryLayouts = ["full", "seven", "five", "half", "half", "full", "five", "seven", "full"];
  const gallerySizes = {
    full: "100vw",
    seven: "(max-width: 760px) 100vw, 58vw",
    five: "(max-width: 760px) 100vw, 42vw",
    half: "(max-width: 760px) 100vw, 50vw"
  };
  const body = `
  <article class="project-detail">
    <header class="project-hero">
      <div class="project-hero__heading">
        <p class="eyebrow">${escapeHtml(project.category)}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.description)}</p>
      </div>
      ${facts.length ? `<dl class="project-facts">
        ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>` : ""}
      <div class="project-hero__media">
        ${image(project.cover, project.images[0][1], { eager: true, sizes: "100vw" })}
      </div>
    </header>

    <section class="project-narrative" aria-label="Desarrollo del proyecto">
      <div>
        <p class="eyebrow">El problema</p>
        <h2>${escapeHtml(project.narrativeTitles.problem)}</h2>
        <p>${escapeHtml(project.problem)}</p>
      </div>
      <div>
        <p class="eyebrow">Decisión</p>
        <h2>${escapeHtml(project.narrativeTitles.decision)}</h2>
        <p>${escapeHtml(project.decision)}</p>
      </div>
      <div>
        <p class="eyebrow">Desarrollo</p>
        <h2>${escapeHtml(project.narrativeTitles.development)}</h2>
        <p>${escapeHtml(project.development)}</p>
      </div>
    </section>

    <section class="project-gallery" aria-labelledby="galeria-${project.slug}">
      <div class="section__heading">
        <p class="eyebrow">Galería</p>
        <h2 id="galeria-${project.slug}">Imágenes del proyecto</h2>
      </div>
      <div class="gallery-grid">
        ${gallerySource.map(([src, alt], index) => {
          const layout = galleryLayouts[index] || "half";
          return `
          <figure class="gallery-item gallery-item--${layout}">
            ${image(src, alt, {
              eager: false,
              sizes: gallerySizes[layout]
            })}
            <figcaption>${escapeHtml(alt)}</figcaption>
          </figure>`;
        }).join("")}
      </div>
    </section>

    <nav class="project-pagination" aria-label="Proyecto anterior y siguiente">
      <a href="/proyectos/${previous.slug}/" rel="prev">
        <span>Anterior</span>
        <strong>${escapeHtml(previous.title)}</strong>
      </a>
      <a href="/proyectos/${next.slug}/" rel="next">
        <span>Siguiente</span>
        <strong>${escapeHtml(next.title)}</strong>
      </a>
    </nav>

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
  const architectureProject = projectBySlug.get("casa-alicia");
  const technicalProject = projectBySlug.get("zenteno");
  const visualizationProject = projectBySlug.get("render-pocuro");
  const body = `
  <header class="page-intro">
    <p class="eyebrow">Servicios</p>
    <h1>Capacidades integradas para decidir y construir mejor.</h1>
    <p>EEAD acompaña proyectos completos y etapas específicas, manteniendo una relación directa entre intención arquitectónica, representación y desarrollo técnico.</p>
  </header>

  <section class="service-chapter" id="arquitectura">
    <div class="service-chapter__content">
      <p class="service-chapter__number">01 / Arquitectura</p>
      <h2>Espacios coherentes desde el programa hasta el detalle.</h2>
      <div class="service-chapter__copy">
        <p>Desarrollamos viviendas, espacios de trabajo, equipamiento y remodelaciones. Cada encargo se estructura desde sus condiciones reales: personas, lugar, presupuesto, normativa y forma de construir.</p>
        <ul>
          <li>Estudios de cabida y definición de programa</li>
          <li>Anteproyecto y visualización</li>
          <li>Proyecto de arquitectura e interiorismo</li>
          <li>Especificaciones y coordinación técnica</li>
          <li>Apoyo durante licitación y obra</li>
        </ul>
        <a class="text-link" href="/proyectos/${architectureProject.slug}/">Ver ${escapeHtml(architectureProject.title)}</a>
      </div>
    </div>
    <a class="service-chapter__media" href="/proyectos/${architectureProject.slug}/" aria-label="Ver proyecto ${escapeHtml(architectureProject.title)}">
      ${image(architectureProject.cover, `Proyecto relacionado: ${architectureProject.title}`, {
        sizes: "(max-width: 760px) 100vw, 58vw"
      })}
    </a>
  </section>

  <section class="service-chapter service-chapter--dark" id="oficina-tecnica">
    <div class="service-chapter__content">
      <p class="service-chapter__number">02 / Oficina técnica</p>
      <h2>Capacidad técnica flexible para equipos con carga variable.</h2>
      <div class="service-chapter__copy">
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
    </div>
    <a class="service-chapter__media" href="/proyectos/${technicalProject.slug}/" aria-label="Ver proyecto ${escapeHtml(technicalProject.title)}">
      ${image(technicalProject.images.at(-1)[0], `Axonometría del proyecto relacionado ${technicalProject.title}`, {
        sizes: "(max-width: 760px) 100vw, 58vw"
      })}
    </a>
  </section>

  <section class="service-chapter" id="visualizacion">
    <div class="service-chapter__content">
      <p class="service-chapter__number">03 / Visualización</p>
      <h2>Imágenes que sirven para evaluar, no solo para presentar.</h2>
      <div class="service-chapter__copy">
        <p>Producimos imágenes con criterio arquitectónico para validar atmósferas, materialidad, escala y decisiones de proyecto antes de construir.</p>
        <ul>
          <li>Dirección de imagen y encuadres</li>
          <li>Modelación y preparación de escenas</li>
          <li>Imágenes interiores y exteriores</li>
          <li>Series para venta, concursos y aprobación</li>
          <li>Apoyo visual durante el diseño</li>
        </ul>
        <a class="text-link" href="/proyectos/${visualizationProject.slug}/">Ver ${escapeHtml(visualizationProject.title)}</a>
      </div>
    </div>
    <a class="service-chapter__media" href="/proyectos/${visualizationProject.slug}/" aria-label="Ver proyecto ${escapeHtml(visualizationProject.title)}">
      ${image(visualizationProject.images[17][0], `Visualización del proyecto relacionado ${visualizationProject.title}`, {
        sizes: "(max-width: 760px) 100vw, 58vw"
      })}
    </a>
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
  const caseStudy = projectBySlug.get("zenteno");
  const body = `
  <header class="page-intro page-intro--technical technical-intro">
    <p class="eyebrow">Oficina técnica externa</p>
    <h1>Capacidad técnica cuando el proyecto la necesita.</h1>
    <p>EEAD se integra a equipos de arquitectura, construcción e inmobiliarios para transformar información fragmentada en modelos, planos y decisiones coordinadas.</p>
    <div class="technical-intro__background" aria-hidden="true">
      ${image(proofImage, "Axonometría general del proyecto Zenteno", { sizes: "100vw" })}
    </div>
  </header>

  <section class="technical-pillars" aria-labelledby="capacidades-tecnicas">
    <div class="section__heading section__heading--light">
      <p class="eyebrow">Sistema de trabajo</p>
      <h2 id="capacidades-tecnicas">Modelo, documentación y control.</h2>
    </div>
    <div class="technical-pillars__grid">
      <article>
        <span>01</span>
        <h3>Modelo</h3>
        <p>Una fuente común para revisar geometría, niveles, encuentros y coordinación entre disciplinas.</p>
      </article>
      <article>
        <span>02</span>
        <h3>Documentación</h3>
        <p>Planos, detalles y láminas con jerarquías gráficas consistentes y alcance explícito.</p>
      </article>
      <article>
        <span>03</span>
        <h3>Control</h3>
        <p>Revisiones trazables, listas de pendientes y criterios verificables antes de cada entrega.</p>
      </article>
    </div>
  </section>

  <section class="deliverables" aria-labelledby="matriz-entregables">
    <div class="deliverables__intro">
      <p class="eyebrow">Matriz de entregables</p>
      <h2 id="matriz-entregables">Cada salida tiene una fuente y un control.</h2>
      <p>La matriz se ajusta al encargo; esta estructura base hace visible qué se desarrolla, cómo se revisa y en qué formato se entrega.</p>
    </div>
    <div class="deliverables__table" tabindex="0" role="region" aria-label="Matriz de entregables técnicos">
      <table>
        <thead>
          <tr><th>Entregable</th><th>Fuente</th><th>Control</th><th>Salida</th></tr>
        </thead>
        <tbody>
          <tr><th>Modelo coordinado</th><td>Antecedentes y especialidades</td><td>Geometría, niveles e interferencias</td><td>RVT / IFC</td></tr>
          <tr><th>Planimetría</th><td>Modelo aprobado</td><td>Escala, cotas y nomenclatura</td><td>PDF / DWG</td></tr>
          <tr><th>Detalles</th><td>Puntos críticos</td><td>Encuentros, tolerancias y materiales</td><td>PDF / DWG</td></tr>
          <tr><th>Registro</th><td>Revisiones del equipo</td><td>Responsables, fecha y estado</td><td>XLSX / PDF</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="technical-case">
    <div class="technical-case__media">
      ${image(proofImage, "Axonometría general utilizada para coordinar el proyecto Zenteno", {
        sizes: "(max-width: 760px) 100vw, 58vw"
      })}
    </div>
    <div class="technical-case__copy">
      <p class="eyebrow">Caso relacionado</p>
      <h2>${escapeHtml(caseStudy.title)}</h2>
      <p>La lectura simultánea de inserción, envolvente y espacios interiores permite revisar el proyecto desde la escala urbana hasta sus decisiones de detalle.</p>
      <a class="text-link" href="/proyectos/${caseStudy.slug}/">Ver caso de estudio</a>
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
      <div class="contact-channels">
        <a href="mailto:emiresparza@gmail.com">
          <span>Correo</span>
          <strong>emiresparza@gmail.com</strong>
        </a>
        <a href="https://wa.me/56987283154" target="_blank" rel="noopener" aria-label="Abrir WhatsApp de EEAD en una nueva pestaña">
          <span>WhatsApp</span>
          <strong>+56 9 8728 3154</strong>
        </a>
      </div>
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
        <p>Al enviar, acepta que EEAD use estos datos únicamente para responder su consulta. Consulte la <a href="/privacidad/">política de privacidad</a>.</p>
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
      about: {
        "@type": "ProfessionalService",
        name: "EEAD",
        email: "emiresparza@gmail.com",
        telephone: "+56987283154"
      }
    }
  });
}

function privacyPage() {
  const body = `
  <header class="page-intro">
    <p class="eyebrow">Privacidad</p>
    <h1>Uso claro y limitado de sus datos.</h1>
    <p>Esta política explica qué información recibe EEAD mediante el formulario de contacto, para qué se utiliza y qué proveedor interviene en el envío.</p>
  </header>

  <article class="privacy-content">
    <section>
      <p class="eyebrow">Responsable</p>
      <h2>EEAD</h2>
      <p>Las consultas se reciben en <a href="mailto:emiresparza@gmail.com">emiresparza@gmail.com</a>. Puede utilizar esa misma dirección para solicitar acceso, corrección o eliminación de los datos enviados.</p>
    </section>
    <section>
      <p class="eyebrow">Datos y finalidad</p>
      <h2>Solo lo necesario para responder.</h2>
      <p>El formulario solicita nombre, correo, contexto del encargo, ubicación, etapa y mensaje. El teléfono es opcional. EEAD utiliza esta información para responder la consulta, comprender el posible encargo y coordinar los siguientes pasos.</p>
    </section>
    <section>
      <p class="eyebrow">Proveedor de envío</p>
      <h2>FormSubmit procesa la entrega.</h2>
      <p>El formulario envía la información mediante FormSubmit, que la remite al correo de EEAD. Su documentación indica una retención temporal de las consultas durante 30 días. Puede revisar la <a href="https://formsubmit.co/privacy.pdf" rel="noopener noreferrer">política de FormSubmit</a>.</p>
    </section>
    <section>
      <p class="eyebrow">Conservación</p>
      <h2>La información no se publica.</h2>
      <p>EEAD conserva los mensajes en su correo durante el tiempo necesario para responder y dar seguimiento al contacto. No se venden los datos ni se incorporan automáticamente a listas de marketing.</p>
    </section>
    <p class="privacy-content__date">Última actualización: 30 de julio de 2026.</p>
  </article>`;

  return page({
    title: "Política de privacidad — EEAD",
    description: "Información sobre el uso, procesamiento y conservación de los datos enviados mediante el formulario de contacto de EEAD.",
    pathname: "/privacidad/",
    body,
    ogImage: projects[0].cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Política de privacidad — EEAD",
      url: `${siteUrl}/privacidad/`,
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
writeRoute("/privacidad/", privacyPage());
writeFile("404.html", notFoundPage());

for (const legacyFile of ["projects.html", "nosotros.html", "blog.html", "post.html", "proyecto.html"]) {
  fs.rmSync(path.join(root, legacyFile), { force: true });
}

const redirectRules = [
  "# Redirecciones permanentes de la arquitectura anterior",
  ...[...legacyStaticRedirects].map(([from, to]) => `${from.padEnd(42)} ${to.padEnd(30)} 301`),
  "/index.html".padEnd(42) + " /".padEnd(31) + "301"
];
writeFile("_redirects", `${redirectRules.join("\n")}\n`);

const sitemapPaths = [
  "/",
  "/proyectos/",
  ...projects.map((project) => `/proyectos/${project.slug}/`),
  "/servicios/",
  "/oficina-tecnica/",
  "/estudio/",
  "/contacto/",
  "/privacidad/"
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

console.log(`Sitio generado: ${sitemapPaths.length} rutas indexables y ${projects.length} proyectos.`);
