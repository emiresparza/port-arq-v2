import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects, projectBySlug } from "../content/projects.mjs";
import { legacyStaticRedirects } from "../content/legacy-routes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://eead.cl";
const contactEmail = "hola@eead.cl";
const whatsappNumber = "56987283154";
const whatsappUrl = `https://wa.me/${whatsappNumber}`;
const instagramUrl = "https://www.instagram.com/eead.cl/";
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
      <div class="footer-contact" aria-label="Contacto EEAD">
        <p>Arquitectura simple.</p>
        <a href="mailto:${contactEmail}">${contactEmail.toUpperCase()}</a>
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">(+569) 87 28 31 54</a>
        <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer">@EEAD.CL</a>
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
      <p class="footer-credit">❤ Hecho con amor desde Temuco por <a href="https://arqit.eead.cl/" target="_blank" rel="noopener noreferrer">ARQit!</a> Diseñado por humanos.</p>
    </div>
  </footer>`;
}

function floatingControls() {
  return `
  <aside class="floating-controls" aria-label="Accesos rápidos">
    <button class="floating-control floating-control--top" type="button" data-scroll-top aria-label="Volver al inicio de la página" hidden>
      <span aria-hidden="true">↑</span>
    </button>
    <a class="floating-control floating-control--whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
      <svg class="floating-control__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.9 6.989c-.002 5.45-4.437 9.884-9.892 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    </a>
  </aside>`;
}

function sharedHero({ variant, label = "", titleId, title, copy, heroImage, imageAlt, mediaClass = "", element = "header" }) {
  return `
  <${element} class="hero site-hero site-hero--${variant}" data-hero-motion aria-labelledby="${titleId}">
    <div class="hero__media" data-hero-media>
      <div class="hero__media-scroll" data-hero-scroll>
        <div class="hero__media-pointer" data-hero-pointer>
          ${image(heroImage, imageAlt, {
            className: `hero__image${mediaClass ? ` ${mediaClass}` : ""}`,
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
${label ? `        <p class="eyebrow">${label}</p>\n` : ""}        <h1 id="${titleId}">${title}</h1>
        <div class="hero__copy">${copy}</div>
      </div>
    </div>
  </${element}>`;
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
${floatingControls()}
</body>
</html>
`;
}

function projectCard(project, { headingLevel = "h2", filterCategories = null } = {}) {
  const Heading = headingLevel === "h3" ? "h3" : "h2";
  const metadata = [
    project.scope?.split(",")[0]?.trim() || project.category,
    project.year,
    project.location
  ].filter(Boolean);

  return `
    <article class="project-card" data-project-card ${filterCategories
      ? `data-categories="${filterCategories.map(escapeHtml).join("|")}"`
      : `data-category="${escapeHtml(project.category)}"`}>
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

function projectCarouselSlide(project, index, activeIndex, showLocation = false) {
  return `
      <article class="project-carousel__slide" data-carousel-slide data-project-slug="${project.slug}" data-title="${escapeHtml(project.title)}"${showLocation ? ` data-location="${escapeHtml(project.location)}"` : ""}${index === activeIndex ? " data-active" : ""}>
        <a href="/proyectos/${project.slug}/"${index === activeIndex ? ' aria-current="true"' : ""} aria-label="Ver proyecto ${escapeHtml(project.title)}">
          ${image(project.cover, `${project.title}: ${project.description}`, {
            sizes: "(max-width: 760px) 84vw, 68vw"
          })}
          <span class="sr-only">${escapeHtml(project.title)}</span>
        </a>
      </article>`;
}

function featuredCarouselData() {
  const prioritySlugs = ["zenteno", "casa-alicia", "antu", "quincho-ss"];
  const prioritySlugSet = new Set(prioritySlugs);
  const carouselProjects = [
    ...prioritySlugs.map((slug) => projectBySlug.get(slug)).filter(Boolean),
    ...projects.filter((project) => !prioritySlugSet.has(project.slug))
  ];
  const activeProjectIndex = carouselProjects.findIndex((project) => project.slug === "casa-alicia");

  return { carouselProjects, activeProjectIndex, activeProject: carouselProjects[activeProjectIndex] };
}

function projectCarousel({ carouselProjects, activeProjectIndex, activeProject, label = "Todos los proyectos", showLocation = false }) {
  return `
    <div class="project-carousel" data-carousel data-carousel-current="${activeProjectIndex}" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="${escapeHtml(label)}">
      <button class="project-carousel__button project-carousel__button--previous" type="button" data-carousel-previous aria-label="Proyecto anterior">
        <span aria-hidden="true">←</span>
      </button>
      <div class="project-carousel__viewport" data-carousel-viewport>${carouselProjects.map((project, index) => projectCarouselSlide(project, index, activeProjectIndex, showLocation)).join("")}</div>
      <button class="project-carousel__button project-carousel__button--next" type="button" data-carousel-next aria-label="Proyecto siguiente">
        <span aria-hidden="true">→</span>
      </button>
      <div class="project-carousel__caption" aria-live="polite" aria-atomic="true">
        <strong data-carousel-title>${escapeHtml(activeProject.title)}</strong>${showLocation ? `
        <span data-carousel-location>${escapeHtml(activeProject.location)}</span>` : ""}
      </div>
    </div>`;
}

const homeTickerPhrases = [
  "Arquitectura e interiorismo",
  "Arquitectura Simple",
  "Proyectos que se entienden antes de construir",
  "Diseño, visualización y oficina técnica externa",
  "Araucanía",
  "Chile"
];

function homeTickerGroup() {
  return homeTickerPhrases
    .map((phrase) => `<span>${escapeHtml(phrase)}</span><span class="editorial-ticker__separator">·</span>`)
    .join("");
}

function homeTickerTrack() {
  return Array.from({ length: 8 }, () =>
    `<div class="editorial-ticker__group" aria-hidden="true">${homeTickerGroup()}</div>`
  ).join("");
}

function homePage() {
  const carouselData = featuredCarouselData();
  const body = `
  <div class="home-hero-shell">
${sharedHero({
      variant: "home",
      titleId: "home-title",
      title: "<span>Arquitectura</span> <span>diseñada para</span> <span>construirse</span> <span>mejor.</span>",
      copy: `<p class="hero__lead">Somos un estudio de <strong class="hero__emphasis">Arquitectura, Diseño e Interiorismo</strong> fundado en el sur de <strong class="hero__emphasis">Chile.</strong> Trabajamos con <strong class="hero__emphasis">Personas y Empresas</strong> para transformar ideas en proyectos <strong class="hero__emphasis">Claros</strong>, <strong class="hero__emphasis">Precisos</strong> y bien <strong class="hero__emphasis">Resueltos</strong>, integrando <strong class="hero__emphasis">Diseño, Visualización y Desarrollo Técnico</strong> antes de la obra.</p>
        <div class="hero__actions">
          <a class="button button--primary" href="/proyectos/">Proyectos</a>
          <a class="button button--primary" href="/contacto/">Agenda una reunión</a>
        </div>`,
      heroImage: defaultImage,
      imageAlt: "Vista interior del proyecto Antü, arquitectura de EEAD",
      element: "section"
    })}

    <section class="editorial-ticker" aria-label="Servicios y enfoque de EEAD">
      <p class="sr-only">Arquitectura e interiorismo. Arquitectura Simple. Proyectos que se entienden antes de construir. Diseño, visualización y oficina técnica externa. Araucanía. Chile.</p>
      <div class="editorial-ticker__viewport" aria-hidden="true">
        <div class="editorial-ticker__track">
          ${homeTickerTrack()}
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
        <p>En EEAD, el diseño, la coordinación BIM, la visualización y la documentación se desarrollan como <strong><u>un solo proceso.</u></strong> Esto permite <strong><u>anticipar</u></strong> conflictos, <strong><u>evaluar</u></strong> decisiones con claridad y <strong><u>reducir</u></strong> la improvisación durante la obra. Porque una buena arquitectura no solo debe verse bien: <strong><u>debe estar pensada para construirse bien.</u></strong></p>
      </div>
    </div>
  </section>

  <section class="home-projects" aria-labelledby="proyectos-destacados">
    <div class="home-projects__header">
      <p class="eyebrow">Proyectos</p>
      <h2 id="proyectos-destacados">Trabajo reciente</h2>
      <a class="button button--primary button--compact home-projects__cta" href="/proyectos/">Ver todos los proyectos</a>
    </div>
${projectCarousel({ ...carouselData, showLocation: true })}
  </section>

  <section class="home-services" aria-labelledby="servicios-inicio">
    <div class="home-services__intro">
      <p class="eyebrow">Servicios</p>
      <h2 id="servicios-inicio">Cuatro áreas, Una misma forma de trabajar.</h2>
      <p>Abordamos la arquitectura desde una <strong><u>premisa simple: resolver antes de construir.</u></strong> Integramos <strong><u>Diseño, Visualización y Documentación</u></strong> en un solo proceso para <strong><u>anticipar</u></strong> decisiones, <strong><u>reducir</u></strong> errores y llevar cada proyecto a obra con <strong><u>mayor claridad y menos incertidumbre.</u></strong></p>
    </div>
    <div class="home-services__chapters">
      <article>
        <span aria-hidden="true">01</span>
        <h3>Arquitectura + Interiores</h3>
        <p>Diseñamos <strong>Viviendas, Refugios, Lofts, Remodelaciones, Interiorismo y Proyectos de Hospitality</strong> desde una mirada integral.</p>
        <p>Nuestras propuestas responden <strong>al uso, a la materialidad y a la forma</strong> en que será construida. Desde las primeras decisiones hasta la documentación final, desarrollamos una <strong>arquitectura contemporánea, coherente con su contexto y pensada para ejecutarse con claridad.</strong></p>
        <p class="home-service__scope"><strong><u>ARQUITECTURA  |  INTERIORISMO  |  REMODELACIONES  |  HOSPITALITY</u></strong></p>
        <a class="button button--primary button--compact" href="/servicios/#arquitectura">Explorar arquitectura</a>
      </article>
      <article>
        <span aria-hidden="true">02</span>
        <h3>Workspaces</h3>
        <p>Nuestra especialidad, <strong>Oficinas y Espacios de trabajo en casa</strong> que integran <strong>Identidad, Ergonomia, Tecnología y Funcionalidad.</strong></p>
        <p>Organizamos cada elemento para mejorar tu <strong>concentración, bienestar y aprovechar cada espacio,</strong> creando entornos  que se adaptan a tu forma de trabajar.</p>
        <p class="home-service__scope"><strong><u>OFICINAS | HOME OFFICE | TALLERES | ESPACIOS DE PRODUCTIVIDAD</u></strong></p>
        <a class="button button--primary button--compact" href="/contacto/">Explorar workspaces</a>
      </article>
      <article>
        <span aria-hidden="true">03</span>
        <h3>Visualización + Render</h3>
        <p>Creamos <strong>Imágenes, Renders y Modelos 3D</strong> para comprender, evaluar y comunicar tu proyecto antes de construirlo.</p>
        <p>La visualización no es solo una herramienta visual, permite <strong>conocer tu proyecto</strong> antes de su ejecución y tener una herramienta poderosa para <strong>presentar a tus clientes y puntos de venta.</strong></p>
        <p class="home-service__scope"><strong><u>MODELADO 3D  |  RENDERS  | VIDEOS  |  IMÁGENES COMERCIALES  |  BRANDING INMOBILIARIO</u></strong></p>
        <a class="button button--primary button--compact" href="/servicios/#visualizacion">Explorar visualización</a>
      </article>
      <article>
        <span aria-hidden="true">04</span>
        <h3>Oficina Técnica Externa</h3>
        <p>Apoyamos a <strong>Arquitectos, Constructoras, Inmobiliarias e Ingenieros</strong> en el Desarrollo, Representación y Documentación de sus proyectos.</p>
        <p>Nos incorporamos como una <strong>extensión especializada de tu equipo,</strong> aportando capacidad técnica en <strong>Dibujo, BIM, Modelado y Documentación</strong> sin aumentar la estructura interna de tu oficina.</p>
        <p class="home-service__scope"><strong><u>APOYO ESPECIALIZADO  |  DOCUMENTACIÓN  |  DIBUJO TÉCNICO  |  MODELADO  |  BIM</u></strong></p>
        <a class="button button--primary button--compact" href="/oficina-tecnica/">Explorar oficina técnica</a>
      </article>
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
        "Arquitectura e interiores",
        "Workspaces",
        "Visualización y render",
        "Oficina técnica externa"
      ]
    }
  });
}

function projectsPage() {
  const categories = [
    { label: "TODOS", value: "Todos" },
    { label: "ARQUITECTURA", value: "Arquitectura" },
    { label: "INTERIORISMO", value: "Interiorismo" },
    { label: "VISUALIZACIÓN", value: "Visualización" },
    { label: "WORKSPACES", value: "Workspaces" },
    { label: "OFICINA TÉCNICA", value: "Oficina Técnica" }
  ];
  const workspaceSlugs = new Set(["homeoffice-cg", "oficina-gl"]);
  const projectCategories = (project) => {
    const taxonomy = new Set([project.category]);
    const scope = project.scope?.toLocaleLowerCase("es") || "";

    if (scope.includes("visualización")) taxonomy.add("Visualización");
    if (workspaceSlugs.has(project.slug)) taxonomy.add("Workspaces");
    if (/desarrollo técnico|documentación|coordinación/.test(scope)) taxonomy.add("Oficina Técnica");

    return [...taxonomy];
  };
  const body = `
  <header class="page-intro">
    <h1>Proyectos</h1>
  </header>
  <section class="project-index" aria-label="Proyectos de EEAD">
    <div class="filters" role="group" aria-label="Filtrar proyectos por categoría">
      ${categories.map((category, index) => `<button type="button" data-filter="${category.value}" aria-controls="project-grid" aria-pressed="${index === 0 ? "true" : "false"}">${category.label}</button>`).join("")}
    </div>
    <p class="sr-only" data-filter-status aria-live="polite"></p>
    <div class="project-grid" id="project-grid">
      ${projects.map((project) => projectCard(project, { filterCategories: projectCategories(project) })).join("")}
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
  const sharesCategory = (candidate) => candidate.category === project.category
    || (project.category === "Visualización"
      && candidate.scope?.toLocaleLowerCase("es").includes("visualización"));
  const relatedCandidates = [
    ...project.related.map((slug) => projectBySlug.get(slug)),
    ...projects
  ].filter(Boolean);
  const related = [...new Map(relatedCandidates.map((candidate) => [candidate.slug, candidate])).values()]
    .filter((candidate) => candidate.slug !== project.slug && sharesCategory(candidate))
    .slice(0, 3);
  const projectIndex = projects.indexOf(project);
  const previous = projects[(projectIndex - 1 + projects.length) % projects.length];
  const next = projects[(projectIndex + 1) % projects.length];
  const typology = project.scope?.split(",")[0]?.trim() || project.category;
  const description = limitWords(project.description, 200);
  const facts = [
    ["Ubicación", project.location],
    ["Estado", project.status],
    ["Tipología", typology],
    ["Desarrollo", project.developedBy],
    ["Cliente", project.client],
    ["Alcance", project.scope]
  ].filter(([, value]) => value);
  const selectedImages = project.gallerySelection
    ? project.gallerySelection.map((index) => project.images[index]).filter(Boolean)
    : project.images;
  const gallerySource = selectedImages
    .filter(([src]) => src !== project.cover);
  const coverAlt = project.images.find(([src]) => src === project.cover)?.[1]
    || `Imagen principal del proyecto ${project.title}`;
  const body = `
  <article class="project-detail">
    <header class="project-hero">
      <div class="project-container project-hero__grid">
        <div class="project-hero__content">
          <a class="project-back" href="/proyectos/">
            <span class="project-back__arrow" aria-hidden="true">←</span>
            <span>Volver</span>
          </a>
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

    ${gallerySource.length ? `<section class="project-gallery project-container" aria-label="Imágenes del proyecto ${escapeHtml(project.title)}">
      <div class="project-gallery-grid">
        ${gallerySource.map(([src, alt], index) => {
          const layout = index === 0 ? "is-main" : "is-secondary";
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
        <p class="project-kicker">CONTINUAR EXPLORANDO</p>
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

function servicesHero(heroImage) {
  return sharedHero({
    variant: "services",
    label: "SERVICIOS",
    titleId: "services-title",
    title: "<span>Resolver el proyecto</span> <span>antes de construir.</span>",
    copy: `<p class="hero__lead">Arquitectura, documentación BIM y visualización integradas en un mismo proceso para coordinar decisiones, reducir errores y llegar a obra con mayor claridad.</p>
      <div class="hero__actions"><a class="button button--primary" href="/contacto/">Conversar sobre un proyecto</a></div>`,
    heroImage,
    imageAlt: "Vivienda contemporánea de hormigón y madera integrada al paisaje"
  });
}

function servicesIntro() {
  return `
    <header class="services-intro">
      <h2 id="services-areas-title">
        <span>Cuatro áreas.</span>
        <span>Una misma</span>
        <span>forma de trabajar.</span>
      </h2>
      <div class="services-intro__copy">
        <p>Cada servicio puede desarrollarse de manera independiente o integrarse según la etapa, el alcance y la complejidad del proyecto.</p>
        <p>En todos los casos trabajamos con una misma premisa: claridad antes que improvisación.</p>
      </div>
    </header>`;
}

function serviceRow(service) {
  return `
      <article class="service-row" id="${service.id}">
        <p class="service-row__number" aria-label="Servicio ${service.number}">${service.number}</p>
        <h3>${escapeHtml(service.title)}</h3>
        <div class="service-row__content">
          <div class="service-row__description">
            ${service.description.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </div>
          <a class="button service-row__link" href="${service.href}">${escapeHtml(service.linkLabel)}</a>
        </div>
        <figure class="service-row__media">
          ${image(service.image, service.imageAlt, {
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 48vw, 34vw"
          })}
        </figure>
      </article>`;
}

function projectCTA() {
  return `
  <section class="project-cta" aria-labelledby="project-cta-title">
    <div class="services-shell project-cta__inner">
      <div class="project-cta__copy">
        <h2 id="project-cta-title">
          <span>Definamos qué</span>
          <span>necesita resolver</span>
          <span>tu proyecto.</span>
        </h2>
        <p>Revisamos su etapa, alcance, información disponible y entregables antes de preparar una propuesta clara.</p>
      </div>
      <div class="project-cta__actions">
        <a class="button button--primary" href="/contacto/">Solicitar una conversación</a>
        <a class="button button--primary" href="/proyectos/">Ver proyectos</a>
      </div>
    </div>
  </section>`;
}

function servicesPage() {
  const architectureProject = projectBySlug.get("antu");
  const workspaceProject = projectBySlug.get("homeoffice-cg");
  const technicalProject = projectBySlug.get("zenteno");
  const visualizationProject = projectBySlug.get("render-pocuro");
  const services = [
    {
      id: "arquitectura",
      number: "01",
      title: "Arquitectura + interiores",
      description: [
        "Diseñamos viviendas, refugios, lofts, remodelaciones, interiores y proyectos de hospitality desde el programa hasta el detalle constructivo.",
        "Ordenamos uso, distribución, materialidad y experiencia espacial con criterio arquitectónico y constructivo."
      ],
      href: "/proyectos/",
      linkLabel: "Ver arquitectura e interiores",
      image: architectureProject.cover,
      imageAlt: "Vista exterior del proyecto Antü, un volumen horizontal revestido en madera"
    },
    {
      id: "workspaces",
      number: "02",
      title: "Workspaces",
      description: [
        "Diseñamos oficinas y espacios de trabajo en casa que integran identidad, ergonomía, tecnología y funcionalidad.",
        "Organizamos cada elemento para mejorar el uso del espacio, la concentración y la experiencia cotidiana de trabajo."
      ],
      href: "/contacto/",
      linkLabel: "Ver workspaces",
      image: workspaceProject.cover,
      imageAlt: "Homeoffice compacto con mobiliario a medida, iluminación integrada y dos puestos de trabajo"
    },
    {
      id: "visualizacion",
      number: "03",
      title: "Visualización + render",
      description: [
        "Producimos imágenes, renders y modelos tridimensionales para evaluar atmósfera, escala, iluminación y materialidad antes de construir.",
        "La visualización no solo sirve para presentar el proyecto: también permite comprenderlo, revisarlo y tomar mejores decisiones."
      ],
      href: `/proyectos/${visualizationProject.slug}/`,
      linkLabel: "Ver visualización",
      image: visualizationProject.images[17][0],
      imageAlt: "Visualización interior de una sala multiuso con comedor, cocina y luz natural"
    },
    {
      id: "oficina-tecnica-externa",
      number: "04",
      title: "Oficina técnica externa",
      description: [
        "Apoyamos a arquitectos, constructoras, inmobiliarias y oficinas de diseño en el desarrollo, representación y documentación de sus proyectos.",
        "Nos integramos como una extensión especializada del equipo, aportando capacidad técnica por alcance definido y sin aumentar innecesariamente su estructura interna."
      ],
      href: "/oficina-tecnica/",
      linkLabel: "Conocer oficina técnica",
      image: technicalProject.images.at(-1)[0],
      imageAlt: "Vista axonométrica del modelo arquitectónico coordinado del proyecto Zenteno"
    }
  ];
  const heroImage = "/assets/img/Servicios/EEAD Hero Servicios.png";
  const body = `${servicesHero(heroImage)}

  <section class="services-matrix" id="capacidades" aria-labelledby="services-areas-title">
    <div class="services-shell">
${servicesIntro()}
      <div class="services-matrix__rows">
${services.map(serviceRow).join("")}
      </div>
    </div>
  </section>

${projectCTA()}`;

  return page({
    title: "Servicios de arquitectura, workspaces y oficina técnica — EEAD",
    description: "Arquitectura e interiores, workspaces, visualización y soporte técnico coordinados para anticipar decisiones y llegar a obra con claridad.",
    pathname: "/servicios/",
    current: "servicios",
    body,
    bodyClass: "page-services",
    ogImage: architectureProject.cover,
    preloadImage: heroImage,
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
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Arquitectura e interiores" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Workspaces" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Visualización y render" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Oficina técnica externa" } }
        ]
      }
    }
  });
}

function technicalHero(proofImage) {
  return sharedHero({
    variant: "technical",
    label: "OFICINA TÉCNICA EXTERNA",
    titleId: "technical-title",
    title: "<span>Capacidad técnica,</span> <span>integrada a tu equipo.</span>",
    copy: `<div class="hero__lead"><p>Colaboramos con arquitectos, constructoras, ingenierías e inmobiliarias para desarrollar, representar y documentar proyectos sin perder su intención arquitectónica.</p><p>Nos integramos al proceso para ordenar la información, profundizar decisiones y transformar antecedentes existentes en un proyecto claro, coherente y preparado para avanzar.</p></div>
      <div class="hero__actions"><a class="button button--primary" href="/contacto/">Solicitar reunión</a></div>`,
    heroImage: proofImage,
    imageAlt: "Escritorio de arquitectura con un monitor que muestra láminas de proyecto en Revit"
  });
}

function technicalMethod() {
  return `
  <section class="technical-method" aria-label="Proceso de desarrollo técnico">
    <div class="technical-shell technical-method__grid">
      <div class="technical-method__pillars">
        <article>
          <span>01</span>
          <h3>Modelo arquitectónico</h3>
          <p>Construimos una base común para comprender el proyecto, revisar su geometría y relacionar correctamente plantas, niveles, envolvente y espacios.</p>
          <p>El modelo no es un resultado aislado: es una herramienta para desarrollar y verificar la arquitectura.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Desarrollo</h3>
          <p>Profundizamos las decisiones que permiten pasar de una idea general a un proyecto definido.</p>
          <p>Resolvemos dimensiones, materialidades, sistemas, encuentros y puntos críticos manteniendo coherencia entre la intención de diseño y su construcción.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Documentación</h3>
          <p>Representamos el proyecto mediante planos, láminas, detalles y especificaciones con jerarquías claras y un lenguaje gráfico consistente.</p>
          <p>La documentación debe permitir comprender la arquitectura, revisarla y continuar su desarrollo sin interpretaciones innecesarias.</p>
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
        <h2 id="technical-deliverables-title">Cada entrega debe conservar la lógica del proyecto.</h2>
        <p>No producimos modelos, planos o imágenes como piezas independientes. Cada documento debe responder a los antecedentes disponibles, a una decisión arquitectónica y a una etapa concreta del proyecto.</p>
      </header>
      <div class="technical-deliverables__table">
        <table>
          <thead>
            <tr><th scope="col">Entregable</th><th scope="col">Base de trabajo</th><th scope="col">Qué se resuelve</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Modelo arquitectónico</th><td data-label="Base de trabajo">Antecedentes, levantamientos y especialidades</td><td data-label="Qué se resuelve">Geometría, niveles, espacios y relaciones generales</td></tr>
            <tr><th scope="row">Planimetría</th><td data-label="Base de trabajo">Modelo y criterios de proyecto</td><td data-label="Qué se resuelve">Plantas, cortes, elevaciones y organización gráfica</td></tr>
            <tr><th scope="row">Detalles constructivos</th><td data-label="Base de trabajo">Puntos críticos del proyecto</td><td data-label="Qué se resuelve">Encuentros, espesores, tolerancias y materialidad</td></tr>
            <tr><th scope="row">Especificaciones</th><td data-label="Base de trabajo">Decisiones de diseño y sistemas propuestos</td><td data-label="Qué se resuelve">Materiales, componentes y criterios de ejecución</td></tr>
            <tr><th scope="row">Visualizaciones</th><td data-label="Base de trabajo">Modelo, materialidad y contexto</td><td data-label="Qué se resuelve">Escala, atmósfera, iluminación y lectura del proyecto</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

function technicalRecentProjects() {
  const carouselData = featuredCarouselData();

  return `
  <section class="technical-projects" aria-labelledby="technical-projects-title">
    <div class="technical-projects__header">
      <div>
        <p class="eyebrow">PROYECTOS</p>
        <h2 id="technical-projects-title">Trabajo reciente</h2>
      </div>
      <a class="button button--primary" href="/contacto/">Solicitar reunión</a>
    </div>
${projectCarousel({ ...carouselData, label: "Trabajo reciente de EEAD" })}
  </section>`;
}

function technicalOfficePage() {
  const caseStudy = projectBySlug.get("zenteno");
  const proofImage = caseStudy.images.at(-1)[0];
  const heroImage = "/assets/img/oficina-tecnica/hero-oficina-tecnica.png";
  const body = `${technicalHero(heroImage)}

${technicalMethod()}

${technicalDeliverables()}

${technicalRecentProjects()}`;

  return page({
    title: "Oficina técnica externa y desarrollo arquitectónico — EEAD",
    description: "Desarrollo, representación y documentación arquitectónica integrada a equipos externos, con criterio y continuidad entre diseño y construcción.",
    pathname: "/oficina-tecnica/",
    current: "oficina-tecnica",
    body,
    bodyClass: "page-technical",
    preloadImage: heroImage,
    ogImage: proofImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Oficina técnica externa",
      provider: { "@type": "ProfessionalService", name: "EEAD", url: `${siteUrl}/` },
      areaServed: "Chile",
      serviceType: ["Desarrollo arquitectónico", "Documentación", "Modelado BIM", "Detalles constructivos", "Visualización"]
    }
  });
}

function studioHero(heroImage) {
  return sharedHero({
    variant: "studio",
    label: "ESTUDIO",
    titleId: "studio-title",
    title: "<span>Una oficina pequeña.</span> <span>Una forma integral de</span> <span>resolver arquitectura.</span>",
    copy: `<p class="hero__lead">EEAD es un estudio de arquitectura con base en Temuco. Diseñamos, visualizamos y desarrollamos proyectos con una mirada integral para transformar ideas en decisiones claras, precisas y construibles.</p>
      <div class="hero__actions"><a class="button button--primary" href="/contacto/">Agenda una reunión</a></div>`,
    heroImage,
    imageAlt: "Mesa de trabajo con planos de arquitectura, lámpara, anteojos y material de proyecto."
  });
}

function studioDirector(profileImage) {
  return `
  <section class="studio-director" aria-labelledby="studio-director-title">
    <div class="studio-shell studio-director__grid">
      <div class="studio-director__identity">
        <h2 id="studio-director-title">Emir Esparza</h2>
        <p class="studio-director__credentials">
          <span>Arquitecto UM</span>
          <span>Mg (c) Tec. Aplicadas a la Construcción</span>
          <span>Director EEAD</span>
        </p>
      </div>
      <figure class="studio-director__portrait">
        ${image(profileImage, "Retrato de Emir Esparza, arquitecto y director de EEAD.", {
          className: "studio-director__image",
          sizes: "(max-width: 760px) 144px, (max-width: 1100px) 140px, 176px"
        })}
      </figure>
      <p class="studio-director__bio">Arquitecto e interiorista. Dirige EEAD desde Temuco, integrando diseño, visualización y desarrollo técnico en proyectos de distintas escalas. Su enfoque prioriza claridad, criterio y soluciones bien resueltas antes de construir.</p>
    </div>
  </section>`;
}

function studioCta() {
  return `
  <section class="studio-cta" aria-labelledby="studio-cta-title">
    <div class="studio-shell studio-cta__grid">
      <h2 id="studio-cta-title">
        <span>Conversemos</span>
        <span>sobre lo que</span>
        <span>tu proyecto</span>
        <span>necesita resolver.</span>
      </h2>
      <div class="studio-cta__actions">
        <a class="button button--primary" href="/contacto/">Solicitar una conversación</a>
        <a class="button button--primary" href="/proyectos/">Ver proyectos</a>
      </div>
    </div>
  </section>`;
}

function studioPage() {
  const heroImage = "/assets/img/estudio/estudio-eead-hero.jpg";
  const profileImage = "/assets/img/estudio/emir-esparza-perfil.png";
  const body = `${studioHero(heroImage)}
${studioDirector(profileImage)}
${studioCta()}`;

  return page({
    title: "Estudio de arquitectura en Temuco — EEAD",
    description: "EEAD es un estudio de arquitectura en Temuco que integra diseño, visualización y desarrollo técnico para transformar ideas en decisiones claras y construibles.",
    pathname: "/estudio/",
    current: "estudio",
    body,
    bodyClass: "page-studio",
    preloadImage: heroImage,
    ogImage: heroImage,
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
          jobTitle: "Director EEAD"
        }
      }
    }
  });
}

function contactPage() {
  const body = `
  <section class="contact-page" aria-labelledby="contact-title">
    <div class="contact-page__grid">
      <div class="contact-page__intro">
        <header class="contact-page__heading">
          <h1 id="contact-title"><span>Conversemos</span> <span>sobre tu</span> <span>proyecto</span></h1>
          <p>Cuéntanos <strong><u>qué idea tienes en mente, dónde está tu proyecto y en qué etapa se encuentra.</u></strong> Con esa información podemos orientarte sobre los próximos pasos. <strong><u>¡Conversemos!</u></strong></p>
        </header>
        <section class="contact-channels" aria-label="Canales directos">
          <a href="mailto:hola@eead.cl">
            <span class="contact-channel__label">CORREO</span>
            <strong class="contact-channel__value">HOLA@EEAD.CL</strong>
            <span class="contact-channel__arrow" aria-hidden="true">↗</span>
          </a>
          <a href="https://wa.me/56987283154" target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp de EEAD en una nueva pestaña">
            <span class="contact-channel__label">WHATSAPP</span>
            <strong class="contact-channel__value">(+569) 87 28 31 54</strong>
            <span class="contact-channel__arrow" aria-hidden="true">↗</span>
          </a>
          <a href="https://www.instagram.com/eead.cl/" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram de EEAD en una nueva pestaña">
            <span class="contact-channel__label">INSTAGRAM</span>
            <strong class="contact-channel__value">@EEAD.CL</strong>
            <span class="contact-channel__arrow" aria-hidden="true">↗</span>
          </a>
        </section>
      </div>

      <div class="contact-page__form-area">
        <h2 id="contact-form-title">CUÉNTANOS TU ENCARGO</h2>
        <form class="contact-form" id="contact-form" action="https://formsubmit.co/ajax/emiresparza@gmail.com" method="post" aria-labelledby="contact-form-title" novalidate>
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
        email: "hola@eead.cl",
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
