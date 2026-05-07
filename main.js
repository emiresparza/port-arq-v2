// Custom cursor con lag
(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = 0, my = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  });

  (function loop() {
    cx += (mx - cx) * 0.1;
    cy += (my - cy) * 0.1;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();

  // Expandir sobre interactivos
  document.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--expanded'); });
    el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--expanded'); });
  });
})();

// Scroll reveal — imágenes primero, texto después
(function () {
  function markReveal(sel, isImg, baseDelay) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('reveal');
      if (isImg) el.classList.add('reveal--img');
      if (baseDelay) el.style.transitionDelay = baseDelay + 's';
    });
  }

  // Imágenes: sin delay, trigger temprano
  markReveal('.project__img-wrap', true,  0);
  markReveal('.service__card',      true,  0);

  // Texto: delay base 0.3s — aparece después de la imagen
  markReveal('.hero__bottom',      false, 0.2);
  markReveal('.about__text',       false, 0.3);
  markReveal('.about__cta',        false, 0.45);
  markReveal('.services__intro',   false, 0.3);
  markReveal('.awards__intro',     false, 0.3);
  markReveal('.process__heading',  false, 0.3);
  markReveal('.process__sub',      false, 0.44);
  markReveal('.cta__title',        false, 0.2);
  markReveal('.cta .btn-cta',      false, 0.4);
  markReveal('.footer__brand',     false, 0.1);

  // Stagger por grupo (labels, proyectos, awards, pasos, footer cols)
  function staggerGroup(sel, isImg, step, baseDelay) {
    var byParent = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      var p = el.parentElement;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(el);
    });
    byParent.forEach(function (children) {
      children.forEach(function (el, i) {
        el.classList.add('reveal');
        if (isImg) el.classList.add('reveal--img');
        el.style.transitionDelay = (baseDelay + Math.min(i * step, 0.4)) + 's';
      });
    });
  }

  staggerGroup('.label',         false, 0,    0.2);
  staggerGroup('.project',       true,  0.12, 0);
  staggerGroup('.awards__row',   false, 0.14, 0.3);
  staggerGroup('.process__step', false, 0.14, 0.3);
  staggerGroup('.footer__col',   false, 0.14, 0.15);

  // Hero words: stagger en carga
  document.querySelectorAll('.hero__words span').forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (0.1 + i * 0.14) + 's';
  });

  // Observer para imágenes: trigger temprano
  var imgObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); imgObs.unobserve(e.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });

  // Observer para texto: necesita más scroll
  var txtObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); txtObs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.classList.contains('reveal--img')) imgObs.observe(el);
    else txtObs.observe(el);
  });
})();

// Header — scroll: CTA solo vuelve cerca del top; nav desaparece tras el hero
(function () {
  var cta = document.getElementById('headerCta');
  var nav = document.querySelector('.nav');
  if (!cta) return;
  var last = 0;
  var NEAR_TOP = 280;

  window.addEventListener('scroll', function () {
    var y    = window.scrollY;
    var hero = window.innerHeight;

    // CTA: ocultar al bajar; solo reaparece si estamos cerca del top
    if (y > last && y > 60) {
      cta.classList.add('is-hidden');
    } else if (y <= NEAR_TOP) {
      cta.classList.remove('is-hidden');
    }

    // Nav: visible solo dentro del hero
    if (nav) {
      if (y > hero * 0.65) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }
    }

    last = y;
  }, { passive: true });
})();

// Hero: parallax en imagen + micro-parallax en palabras
(function () {
  const img   = document.getElementById('heroImg');
  const words = document.querySelectorAll('.hero__words span');
  if (!img) return;

  let tx = 0, ty = 0, cx = 0, cy = 0;
  const RANGE = 28;

  document.addEventListener('mousemove', function (e) {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    tx = -nx * RANGE;
    ty = -ny * RANGE;
  });

  (function animate() {
    cx += (tx - cx) * 0.055;
    cy += (ty - cy) * 0.055;
    img.style.transform = 'scale(1.08) translate(' + cx + 'px, ' + cy + 'px)';

    // cada palabra tiene su propio depth
    words.forEach(function (word) {
      var d = parseFloat(word.dataset.depth) || 0.5;
      word.style.transform =
        'translate(' + (cx * d * 0.6) + 'px, ' + (cy * d * 0.6) + 'px)';
    });

    requestAnimationFrame(animate);
  })();
})();
