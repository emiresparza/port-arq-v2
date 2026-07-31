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

const limitWords = (value = "", maximum = 200) => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maximum) return words.join(" ");
  return `${words.slice(0, maximum).join(" ").replace(/[,:;]$/, "")}…`;
};

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

function projectCard(project, { headingLevel = "h2" } = {}) {
  const Heading = headingLevel === "h3" ? "h3" : "h2";
  const metadata = [
    project.scope?.split(",")[0]?.trim() || project.category,
    project.year,
    project.location
  ].filter(Boolean);

  return `
    <article class="project-card" data-project-card data-category="${project.category}">
      <a href="/proyectos/${project.slug}/">
        <div class="project-card__media">
          ${image(project.cover, `${project.title}: ${project.description}`, {
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 56px), (max-width: 1440px) calc((100vw - 208px) / 3), 400px"
          })}
        </div>
        <div class="project-card__meta">
          <${Heading}>${escapeHtml(project.title)}</${Heading}>
          <p>${metadata.map(escapeHtml).join(' <span aria-hidden="true">·</span> ')}</p>
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
  <div class="home-hero-shell">
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
          <div class="hero__copy">
            <p class="hero__lead">Somos un estudio de <span class="hero__emphasis">Arquitectura</span>, <span class="hero__emphasis">Diseño</span> e <span class="hero__emphasis">Interiorismo</span> fundado en el sur de <span class="hero__emphasis">Chile</span>. Trabajamos con <span class="hero__emphasis">Personas</span> y <span class="hero__emphasis">Empresas</span> para transformar ideas en proyectos <span class="hero__emphasis">Claros</span>, <span class="hero__emphasis">Precisos</span> y bien <span class="hero__emphasis">Resueltos</span>, integrando <span class="hero__emphasis">Diseño</span>, <span class="hero__emphasis">Visualización</span> y <span class="hero__emphasis">Desarrollo</span> técnico antes de la obra.</p>
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
  </div>

  <section class="manifesto" aria-labelledby="manifiesto-eead">
    <div class="manifesto__inner">
      <div class="manifesto__heading">
        <h2 id="manifiesto-eead"><span>Diseño y Técnica,</span><span>juntos desde el inicio</span></h2>
      </div>
      <div class="manifesto__copy">
        <p>Abordamos cada proyecto con una mirada integral, sin importar su escala. Desde una vivienda hasta una oficina, trabajamos con una misma metodología: diseñar, visualizar y coordinar antes de construir.</p>
        <p>La visualización permite anticipar y tomar mejores decisiones. El desarrollo técnico transforma esas decisiones en un proyecto claro, preciso y coordinado para su ejecución.</p>
        <p>Porque una buena arquitectura no solo debe verse bien. También debe estar bien resuelta.</p>
      </div>
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
    bodyClass: "page-projects",
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
  const related = project.related.map((slug) => projectBySlug.get(slug)).filter(Boolean).slice(0, 3);
  const projectIndex = projects.indexOf(project);
  const previous = projects[(projectIndex - 1 + projects.length) % projects.length];
  const next = projects[(projectIndex + 1) % projects.length];
  const typology = project.scope?.split(",")[0]?.trim() || project.category;
  const description = limitWords(project.description, 200);
  const facts = [
    ["Ubicación", project.location],
    ["Año", project.year],
    ["Superficie", project.surface],
    ["Estado", project.status],
    ["Tipología", typology],
    ["Alcance", project.scope]
  ].filter(([, value]) => value).slice(0, 6);
  const selectedImages = project.gallerySelection
    ? project.gallerySelection.map((index) => project.images[index]).filter(Boolean)
    : project.images;
  const gallerySource = selectedImages
    .filter(([src]) => src !== project.cover)
    .slice(0, 4);
  const coverAlt = project.images.find(([src]) => src === project.cover)?.[1]
    || `Imagen principal del proyecto ${project.title}`;
  const body = `
  <article class="project-detail">
    <header class="project-hero">
      <div class="project-container project-hero__grid">
        <div class="project-hero__content">
          <p class="project-kicker">${escapeHtml(project.category)}</p>
          <h1 class="project-title">${escapeHtml(project.title)}</h1>
          <p class="project-description">${escapeHtml(description)}</p>
        </div>
        ${facts.length ? `<dl class="project-meta">
          ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>` : ""}
      </div>
    </header>

    <figure class="project-cover project-container">
      ${image(project.cover, coverAlt, {
        eager: true,
        sizes: "(max-width: 760px) calc(100vw - 48px), 1280px"
      })}
    </figure>

    ${gallerySource.length ? `<section class="project-gallery project-container" aria-labelledby="galeria-${project.slug}">
      <div class="project-section-heading">
        <p class="project-kicker">Galería</p>
        <h2 id="galeria-${project.slug}">Secuencia visual</h2>
      </div>
      <div class="project-gallery-grid">
        ${gallerySource.map(([src, alt], index) => {
          const layout = index === 0 ? "is-main" : index === 3 ? "is-additional" : "is-secondary";
          const sizes = layout === "is-secondary"
            ? "(max-width: 760px) calc(100vw - 48px), 620px"
            : "(max-width: 760px) calc(100vw - 48px), 1280px";
          return `
          <figure class="project-gallery-item ${layout}">
            ${image(src, alt, { eager: false, sizes })}
          </figure>`;
        }).join("")}
      </div>
    </section>` : ""}

    <nav class="project-nav project-container" aria-label="Proyecto anterior y siguiente">
      <a href="/proyectos/${previous.slug}/" rel="prev">
        <span class="project-nav__label">Anterior</span>
        <strong class="project-nav__title">${escapeHtml(previous.title)}</strong>
      </a>
      <a href="/proyectos/${next.slug}/" rel="next">
        <span class="project-nav__label">Siguiente</span>
        <strong class="project-nav__title">${escapeHtml(next.title)}</strong>
      </a>
    </nav>

    <section class="project-related project-container" aria-labelledby="relacionados-${project.slug}">
      <div class="project-section-heading">
        <p class="project-kicker">Continuar explorando</p>
        <h2 id="relacionados-${project.slug}">Proyectos relacionados</h2>
      </div>
      <div class="related-grid">
        ${related.map((item) => projectCard(item, { headingLevel: "h3" })).join("")}
      </div>
    </section>
  </article>`;

  return page({
    title: `${project.title} — ${project.category} | EEAD`,
    description: `${project.description} ${project.scope}.`,
    pathname: `/proyectos/${project.slug}/`,
    current: "proyectos",
    body,
    bodyClass: "page-project-detail",
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

function servicesHero() {
  return `
  <header class="services-hero" aria-labelledby="services-title">
    <div class="services-shell services-hero__inner">
      <p class="eyebrow">SERVICIOS</p>
      <h1 id="services-title">Resolver el proyecto antes de construir.</h1>
      <p class="services-hero__lead">Arquitectura, documentación BIM y visualización integradas en un mismo proceso para coordinar decisiones, reducir errores y llegar a obra con mayor claridad.</p>
      <div class="services-hero__actions">
        <a class="button button--primary" href="#capacidades">Ver capacidades</a>
        <a class="button services-button--secondary" href="/contacto/">Conversar sobre un proyecto</a>
      </div>
    </div>
  </header>`;
}

function servicesIntro() {
  return `
    <header class="services-intro">
      <p class="eyebrow">CAPACIDADES</p>
      <h2 id="capabilities-title">Tres capacidades. Un solo criterio.</h2>
      <p>Cada servicio puede desarrollarse de manera independiente o integrarse según la etapa y complejidad del proyecto.</p>
    </header>`;
}

function serviceRow(service) {
  return `
      <article class="service-row" id="${service.id}">
        <p class="service-row__number" aria-label="Servicio ${service.number}">${service.number}</p>
        <h3>${escapeHtml(service.title)}</h3>
        <div class="service-row__content">
          <p class="service-row__description">${escapeHtml(service.description)}</p>
          <p class="service-row__scope-label">Alcance habitual</p>
          <ul class="service-row__scope">
            ${service.scope.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
          <a class="text-link service-row__link" href="${service.href}">${escapeHtml(service.linkLabel)}</a>
        </div>
        <figure class="service-row__media">
          ${image(service.image, service.imageAlt, {
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 48vw, 34vw"
          })}
        </figure>
      </article>`;
}

function technicalSupport() {
  return `
  <section class="technical-support" aria-labelledby="technical-support-title">
    <div class="services-shell technical-support__inner">
      <p class="eyebrow">SOPORTE PARA EQUIPOS</p>
      <h2 id="technical-support-title">Capacidad técnica cuando el proyecto lo requiere.</h2>
      <div class="technical-support__copy">
        <p>Apoyamos a oficinas, constructoras e inmobiliarias con modelado BIM, documentación y visualización por alcance definido. Nos integramos a procesos existentes sin agregar complejidad operativa.</p>
        <a class="text-link" href="/oficina-tecnica/">Conocer soporte técnico</a>
      </div>
    </div>
  </section>`;
}

function projectCTA() {
  return `
  <section class="project-cta" aria-labelledby="project-cta-title">
    <div class="services-shell project-cta__inner">
      <div class="project-cta__copy">
        <h2 id="project-cta-title">Definamos qué necesita resolver tu proyecto.</h2>
        <p>Revisamos su etapa, alcance y entregables antes de preparar una propuesta.</p>
      </div>
      <div class="project-cta__actions">
        <a class="button button--primary" href="/contacto/">Solicitar una conversación</a>
        <a class="button services-button--secondary" href="/proyectos/">Ver proyectos</a>
      </div>
    </div>
  </section>`;
}

function servicesPage() {
  const architectureProject = projectBySlug.get("antu");
  const technicalProject = projectBySlug.get("zenteno");
  const visualizationProject = projectBySlug.get("render-pocuro");
  const services = [
    {
      id: "arquitectura",
      number: "01",
      title: "Arquitectura e interiorismo",
      description: "Desarrollamos viviendas y espacios de hospitalidad desde el programa hasta el detalle. Ordenamos distribución, materialidad y experiencia espacial con criterio constructivo.",
      scope: ["Anteproyecto", "desarrollo arquitectónico", "interiorismo", "especificaciones"],
      href: "/proyectos/",
      linkLabel: "Ver arquitectura",
      image: architectureProject.cover,
      imageAlt: "Vista exterior del proyecto Antü, un volumen horizontal revestido en madera"
    },
    {
      id: "bim-documentacion",
      number: "02",
      title: "BIM y documentación",
      description: "Modelamos, coordinamos y documentamos el proyecto para anticipar interferencias, ordenar especialidades y reducir decisiones improvisadas durante la construcción.",
      scope: ["Modelado BIM", "planimetría", "coordinación", "documentación ejecutiva"],
      href: "/oficina-tecnica/",
      linkLabel: "Ver BIM y documentación",
      image: technicalProject.images.at(-1)[0],
      imageAlt: "Vista axonométrica del modelo arquitectónico coordinado del proyecto Zenteno"
    },
    {
      id: "visualizacion",
      number: "03",
      title: "Visualización arquitectónica",
      description: "Producimos imágenes para evaluar atmósfera, escala y materialidad antes de construir. No solo sirven para presentar el proyecto: también ayudan a decidirlo.",
      scope: ["Imágenes interiores y exteriores", "estudios de materialidad", "recorridos", "apoyo comercial"],
      href: `/proyectos/${visualizationProject.slug}/`,
      linkLabel: "Ver visualización",
      image: visualizationProject.images[17][0],
      imageAlt: "Visualización interior de una sala multiuso con comedor, cocina y luz natural"
    }
  ];
  const body = `${servicesHero()}

  <section class="services-matrix" id="capacidades" aria-labelledby="capabilities-title">
    <div class="services-shell">
${servicesIntro()}
      <div class="services-matrix__rows">
${services.map(serviceRow).join("")}
      </div>
    </div>
  </section>

${technicalSupport()}

${projectCTA()}`;

  return page({
    title: "Servicios de arquitectura, BIM y visualización — EEAD",
    description: "Arquitectura, documentación BIM y visualización integradas para coordinar decisiones, reducir errores y llegar a obra con mayor claridad.",
    pathname: "/servicios/",
    current: "servicios",
    body,
    bodyClass: "page-services",
    ogImage: architectureProject.cover,
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
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "BIM y documentación" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Visualización arquitectónica" } }
        ]
      }
    }
  });
}

function technicalHero(proofImage) {
  return `
  <header class="technical-hero" aria-labelledby="technical-title">
    <div class="technical-shell technical-hero__grid">
      <p class="eyebrow">OFICINA TÉCNICA EXTERNA</p>
      <h1 id="technical-title">Capacidad técnica externa, integrada a tu equipo.</h1>
      <p class="technical-hero__lead">Desarrollo BIM, documentación y soporte técnico para arquitectos, constructoras, ingenierías e inmobiliarias. Nos integramos al flujo del proyecto para ordenar información, producir entregables claros y avanzar con mayor trazabilidad.</p>
      <div class="technical-hero__actions">
        <a class="technical-action technical-action--primary" href="/contacto/">Solicitar reunión</a>
        <a class="technical-action" href="#caso-zenteno">Ver caso relacionado</a>
      </div>
      <p class="technical-hero__metadata">BIM · documentación · coordinación · visualización</p>
      <figure class="technical-hero__media">
        ${image(proofImage, "Vista axonométrica del modelo arquitectónico del proyecto Zenteno", {
          eager: true,
          sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 42vw, 32vw"
        })}
      </figure>
    </div>
  </header>`;
}

function technicalMethod() {
  return `
  <section class="technical-method" aria-labelledby="technical-method-title">
    <div class="technical-shell technical-method__grid">
      <header class="technical-method__intro">
        <h2 id="technical-method-title">Orden técnico para proyectos en desarrollo.</h2>
        <p>Trabajamos sobre modelos, planos y criterios existentes para convertir información dispersa en documentación coordinada, revisable y lista para avanzar.</p>
      </header>
      <div class="technical-method__pillars">
        <article>
          <span>01</span>
          <h3>Modelo</h3>
          <p>Una base común para revisar geometría, niveles, criterios espaciales y coordinación entre disciplinas.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Documentación</h3>
          <p>Planos y láminas con jerarquías claras, nomenclatura consistente y alcance explícito.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Control</h3>
          <p>Revisiones trazables, responsables definidos y observaciones verificables antes de cada entrega.</p>
        </article>
      </div>
    </div>
  </section>`;
}

function technicalDeliverables() {
  return `
  <section class="technical-deliverables" aria-labelledby="technical-deliverables-title">
    <div class="technical-shell technical-deliverables__grid">
      <header class="technical-deliverables__intro">
        <p class="eyebrow">ENTREGABLES</p>
        <h2 id="technical-deliverables-title">Cada entrega debe tener fuente, revisión y salida.</h2>
        <p>No producimos documentos aislados. Cada salida debe responder a un insumo claro, un criterio de revisión y un formato útil para el equipo.</p>
      </header>
      <div class="technical-deliverables__table">
        <table>
          <thead>
            <tr><th>Entregable</th><th>Fuente</th><th>Control</th><th>Salida</th></tr>
          </thead>
          <tbody>
            <tr><th>Modelo coordinado</th><td data-label="Fuente">Antecedentes y especialidades</td><td data-label="Control">Geometría, niveles e interferencias</td><td data-label="Salida">RVT / IFC</td></tr>
            <tr><th>Planimetría</th><td data-label="Fuente">Modelo y criterios de proyecto</td><td data-label="Control">Escala, capas y nomenclatura</td><td data-label="Salida">PDF / DWG</td></tr>
            <tr><th>Detalles</th><td data-label="Fuente">Puntos críticos del proyecto</td><td data-label="Control">Encuentros, tolerancias y materialidad</td><td data-label="Salida">PDF / DWG</td></tr>
            <tr><th>Registro</th><td data-label="Fuente">Revisiones del equipo</td><td data-label="Control">Responsable, fecha y estado</td><td data-label="Salida">XLSX / PDF</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

function technicalCaseStudy(caseStudy, proofImage) {
  return `
  <section class="technical-case-study" id="caso-zenteno" aria-labelledby="technical-case-title">
    <div class="technical-shell technical-case-study__grid">
      <figure class="technical-case-study__media">
        ${image(proofImage, "Axonometría general del proyecto Zenteno utilizada para revisar inserción, envolvente y encuentros", {
          sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 52vw, 48vw"
        })}
      </figure>
      <div class="technical-case-study__copy">
        <p class="eyebrow">CASO RELACIONADO</p>
        <h2 id="technical-case-title">${escapeHtml(caseStudy.title)}</h2>
        <p>La lectura simultánea de inserción urbana, envolvente y encuentros permitió revisar el proyecto desde la escala urbana hasta sus decisiones de detalle.</p>
        <div class="technical-case-study__actions">
          <a class="technical-action technical-action--primary" href="/proyectos/${caseStudy.slug}/">Ver caso de estudio</a>
          <a class="technical-action" href="/contacto/">Solicitar apoyo técnico</a>
        </div>
      </div>
    </div>
  </section>`;
}

function technicalOfficePage() {
  const caseStudy = projectBySlug.get("zenteno");
  const proofImage = caseStudy.images.at(-1)[0];
  const body = `${technicalHero(proofImage)}

${technicalMethod()}

${technicalDeliverables()}

${technicalCaseStudy(caseStudy, proofImage)}`;

  return page({
    title: "Oficina técnica externa y desarrollo BIM — EEAD",
    description: "Desarrollo BIM, documentación y soporte técnico externo para arquitectos, constructoras, ingenierías e inmobiliarias.",
    pathname: "/oficina-tecnica/",
    current: "oficina-tecnica",
    body,
    bodyClass: "page-technical",
    preloadImage: proofImage,
    ogImage: proofImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Oficina técnica externa",
      provider: { "@type": "ProfessionalService", name: "EEAD", url: `${siteUrl}/` },
      areaServed: "Chile",
      serviceType: ["Desarrollo BIM", "Documentación técnica", "Coordinación", "Visualización"]
    }
  });
}

const studioPrinciples = [
  {
    number: "01",
    title: "Claridad antes que efecto",
    description: "Cada recurso debe explicar, ordenar o mejorar el proyecto."
  },
  {
    number: "02",
    title: "Diseño con información",
    description: "Las decisiones se apoyan en condiciones reales y se verifican durante el desarrollo."
  },
  {
    number: "03",
    title: "Coordinación temprana",
    description: "Anticipamos encuentros, incompatibilidades y cambios antes de que lleguen a obra."
  }
];

function studioHero() {
  return `
  <header class="studio-hero" aria-labelledby="studio-title">
    <div class="studio-shell studio-hero__grid">
      <p class="eyebrow">Estudio</p>
      <div class="studio-hero__content">
        <h1 id="studio-title">
          <span>Una oficina pequeña.</span>
          <span>Una forma integral de resolver arquitectura.</span>
        </h1>
        <p>EEAD es un estudio de arquitectura con base en Temuco. Diseñamos, coordinamos y documentamos proyectos residenciales y de hospitalidad para reducir errores, improvisación e incertidumbre antes de construir.</p>
      </div>
    </div>
  </header>`;
}

function studioApproach() {
  return `
  <section class="studio-approach" aria-labelledby="studio-approach-title">
    <div class="studio-shell studio-approach__grid">
      <div class="studio-approach__intro">
        <p class="eyebrow">Enfoque</p>
        <h2 id="studio-approach-title">La arquitectura se vuelve simple cuando las decisiones están resueltas.</h2>
      </div>
      <div class="studio-approach__detail">
        <p>Trabajamos cada proyecto como un sistema continuo de diseño, visualización, coordinación BIM y documentación. Cada etapa confirma la anterior y prepara la siguiente, para que la obra avance con mayor claridad y menos improvisación.</p>
        <ul aria-label="Ámbitos de trabajo">
          <li>Arquitectura residencial</li>
          <li>Hospitality y turismo</li>
          <li>BIM y documentación</li>
          <li>Interiorismo y visualización</li>
        </ul>
      </div>
    </div>
  </section>`;
}

function studioDirection() {
  const principles = studioPrinciples.map((principle) => `
          <article>
            <span aria-hidden="true">${principle.number}</span>
            <h3>${principle.title}</h3>
            <p>${principle.description}</p>
          </article>`).join("");

  return `
  <section class="studio-direction" aria-labelledby="studio-direction-title">
    <div class="studio-shell">
      <div class="studio-direction__grid">
        <div class="studio-direction__identity">
          <p class="eyebrow">Dirección</p>
          <h2 id="studio-direction-title">Emir Esparza</h2>
          <p class="studio-direction__role">Fundador y director</p>
        </div>
        <p class="studio-direction__bio">Arquitecto especializado en diseño, visualización y coordinación BIM. Dirige EEAD desde Temuco y articula equipos según la escala de cada proyecto, manteniendo una misma lógica de trabajo: decisiones claras, información útil y documentación construible.</p>
      </div>
      <div class="studio-principles" aria-labelledby="studio-principles-title">
        <div class="studio-principles__heading">
          <p class="eyebrow">Principios</p>
          <h2 id="studio-principles-title">Cómo trabajamos</h2>
        </div>
        <div class="studio-principles__grid">${principles}
        </div>
      </div>
    </div>
  </section>`;
}

function studioCta() {
  return `
  <section class="studio-cta" aria-labelledby="studio-cta-title">
    <div class="studio-shell studio-cta__grid">
      <p class="eyebrow">Temuco · Chile</p>
      <div class="studio-cta__message">
        <h2 id="studio-cta-title">Conversemos sobre lo que necesita resolver.</h2>
        <p>Proyecto nuevo, ampliación o desarrollo técnico.</p>
      </div>
      <a class="button button--light" href="/contacto/">Iniciar conversación</a>
    </div>
  </section>`;
}

function studioPage() {
  const body = `${studioHero()}
${studioApproach()}
${studioDirection()}
${studioCta()}`;

  return page({
    title: "Estudio de arquitectura en Temuco — EEAD",
    description: "EEAD es un estudio de arquitectura en Temuco que integra diseño, visualización, coordinación BIM y documentación antes de construir.",
    pathname: "/estudio/",
    current: "estudio",
    body,
    bodyClass: "page-studio",
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
  <section class="contact-page" aria-labelledby="contact-title">
    <div class="contact-page__grid">
      <header class="contact-page__intro">
        <p class="eyebrow">CONTACTO</p>
        <h1 id="contact-title">Conversemos sobre su proyecto.</h1>
        <p>Cuéntenos brevemente qué necesita resolver, dónde se ubica el proyecto y en qué etapa se encuentra. Con esa información podremos orientar los próximos pasos.</p>
        <div class="contact-channels">
          <a href="mailto:emiresparza@gmail.com">
            <span>CORREO</span>
            <strong>emiresparza@gmail.com</strong>
          </a>
          <a href="https://wa.me/56987283154" target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp de EEAD en una nueva pestaña">
            <span>WHATSAPP</span>
            <strong>+56 9 8728 3154</strong>
          </a>
        </div>
      </header>

      <form class="contact-form" id="contact-form" action="https://formsubmit.co/ajax/emiresparza@gmail.com" method="post" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" name="nombre" type="text" autocomplete="name" required aria-describedby="error-nombre">
            <p class="field-error" id="error-nombre" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="correo">Correo</label>
            <input id="correo" name="correo" type="email" autocomplete="email" required aria-describedby="error-correo">
            <p class="field-error" id="error-correo" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="tipo-encargo">Tipo de encargo</label>
            <select id="tipo-encargo" name="tipo_encargo" required aria-describedby="error-tipo-encargo">
              <option value="">Seleccione una opción</option>
              <option>Arquitectura e interiorismo</option>
              <option>Oficina técnica / BIM</option>
              <option>Visualización arquitectónica</option>
              <option>Otro</option>
            </select>
            <p class="field-error" id="error-tipo-encargo" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="ubicacion">Ubicación del proyecto</label>
            <input id="ubicacion" name="ubicacion" type="text" autocomplete="address-level2" placeholder="Comuna, ciudad o región" required aria-describedby="error-ubicacion">
            <p class="field-error" id="error-ubicacion" aria-live="polite"></p>
          </div>
          <div class="field field--message">
            <label for="mensaje">Mensaje</label>
            <textarea id="mensaje" name="mensaje" rows="5" placeholder="Describa brevemente el proyecto, su etapa actual y cualquier plazo o condición relevante." required aria-describedby="error-mensaje"></textarea>
            <p class="field-error" id="error-mensaje" aria-live="polite"></p>
          </div>
        </div>

        <input type="text" name="_honey" class="form-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
        <input type="hidden" name="_subject" value="Nuevo contacto desde eead.cl">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="false">

        <div class="form-submit">
          <button class="button button--primary" type="submit" data-submit>
            <span data-submit-label>ENVIAR CONSULTA</span>
          </button>
          <p>Al enviar esta consulta, acepta el uso de sus datos exclusivamente para responder su mensaje. Consulte la <a href="/privacidad/">política de privacidad</a>.</p>
        </div>
        <div class="form-status" data-form-status role="status" aria-live="polite" aria-atomic="true" tabindex="-1"></div>
      </form>
    </div>
  </section>`;

  return page({
    title: "Contacto — EEAD Arquitectura e interiorismo",
    description: "Contacte a EEAD para conversar sobre un proyecto de arquitectura, interiorismo, oficina técnica BIM o visualización arquitectónica.",
    pathname: "/contacto/",
    current: "contacto",
    body,
    bodyClass: "page-contact",
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
