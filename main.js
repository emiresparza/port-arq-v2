(function () {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".site-nav");

  if (header) {
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const motionHero = document.querySelector("[data-hero-motion]");

  if (motionHero) {
    const scrollLayer = motionHero.querySelector("[data-hero-scroll]");
    const pointerLayer = motionHero.querySelector("[data-hero-pointer]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (scrollLayer && pointerLayer && !reduceMotion.matches) {
      const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
      let heroTop = 0;
      let heroLeft = 0;
      let heroWidth = 1;
      let heroHeight = 1;
      let targetPointerX = 0;
      let targetPointerY = 0;
      let currentPointerX = 0;
      let currentPointerY = 0;
      let targetScrollY = 0;
      let currentScrollY = 0;
      let targetScale = finePointer.matches ? 1.06 : 1.04;
      let currentScale = targetScale;
      let frameId = 0;
      let isVisible = false;
      let initialized = false;

      const refreshGeometry = () => {
        const rect = motionHero.getBoundingClientRect();
        heroTop = window.scrollY + rect.top;
        heroLeft = window.scrollX + rect.left;
        heroWidth = Math.max(rect.width, 1);
        heroHeight = Math.max(rect.height, 1);
      };

      const needsAnotherFrame = () =>
        Math.abs(targetPointerX - currentPointerX) > 0.001 ||
        Math.abs(targetPointerY - currentPointerY) > 0.001 ||
        Math.abs(targetScrollY - currentScrollY) > 0.05 ||
        Math.abs(targetScale - currentScale) > 0.0001;

      const renderMotion = () => {
        frameId = 0;
        if (!isVisible) return;

        currentPointerX += (targetPointerX - currentPointerX) * 0.06;
        currentPointerY += (targetPointerY - currentPointerY) * 0.06;
        currentScrollY += (targetScrollY - currentScrollY) * 0.06;
        currentScale += (targetScale - currentScale) * 0.06;

        const pointerX = currentPointerX * 14;
        const pointerY = currentPointerY * 10;
        pointerLayer.style.transform = `translate3d(${pointerX.toFixed(2)}px, ${pointerY.toFixed(2)}px, 0)`;
        scrollLayer.style.transform = `translate3d(0, ${currentScrollY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;

        if (needsAnotherFrame()) frameId = window.requestAnimationFrame(renderMotion);
      };

      const requestMotionFrame = () => {
        if (isVisible && !frameId) frameId = window.requestAnimationFrame(renderMotion);
      };

      const updateScrollTarget = () => {
        if (!isVisible) return;
        const progress = clamp((window.scrollY - heroTop) / heroHeight, 0, 1);
        const viewportHeight = window.innerHeight;

        if (finePointer.matches) {
          targetScrollY = viewportHeight * (-0.015 + (progress * 0.05));
          targetScale = 1.06 + (progress * 0.01);
        } else {
          targetScrollY = viewportHeight * (-0.0075 + (progress * 0.025));
          targetScale = 1.04 + (progress * 0.007);
        }

        if (!initialized) {
          currentScrollY = targetScrollY;
          currentScale = targetScale;
          initialized = true;
        }
        requestMotionFrame();
      };

      if (finePointer.matches) {
        motionHero.addEventListener("pointermove", (event) => {
          targetPointerX = clamp((((event.clientX + window.scrollX) - heroLeft) / heroWidth) * 2 - 1, -1, 1);
          targetPointerY = clamp((((event.clientY + window.scrollY) - heroTop) / heroHeight) * 2 - 1, -1, 1);
          requestMotionFrame();
        }, { passive: true });

        motionHero.addEventListener("pointerleave", () => {
          targetPointerX = 0;
          targetPointerY = 0;
          requestMotionFrame();
        });
      }

      const setHeroVisibility = (visible) => {
        isVisible = visible;
        motionHero.classList.toggle("is-hero-visible", visible);

        if (visible) {
          refreshGeometry();
          updateScrollTarget();
          requestMotionFrame();
        } else if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }
      };

      if ("IntersectionObserver" in window) {
        const heroObserver = new IntersectionObserver(([entry]) => {
          setHeroVisibility(entry.isIntersecting);
        }, { threshold: 0, rootMargin: "8% 0px" });
        heroObserver.observe(motionHero);
      } else {
        setHeroVisibility(true);
      }

      window.addEventListener("scroll", updateScrollTarget, { passive: true });
      window.addEventListener("resize", () => {
        refreshGeometry();
        updateScrollTarget();
      });
    }
  }

  if (menuButton && menu) {
    const menuLabel = menuButton.querySelector("[data-menu-label]");
    const getFocusable = () => [
      menuButton,
      ...menu.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")
    ];

    const setMenu = (open, restoreFocus = false) => {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Cerrar menú principal" : "Abrir menú principal");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      menuLabel.textContent = open ? "Cerrar" : "Menú";

      if (open) {
        const firstLink = menu.querySelector("a");
        if (firstLink) firstLink.focus();
      } else if (restoreFocus) {
        menuButton.focus();
      }
    };

    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      if (!open) return;

      if (event.key === "Escape") {
        setMenu(false, true);
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusable();
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      projectCards.forEach((card) => {
        const matches = filter === "Todos" || card.dataset.category === filter;
        card.hidden = !matches;
      });
    });
  });

  const carousels = Array.from(document.querySelectorAll("[data-carousel]"));

  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previousButton = carousel.querySelector("[data-carousel-previous]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const title = carousel.querySelector("[data-carousel-title]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactCarousel = window.matchMedia("(max-width: 760px)");
    let activeIndex = Number(carousel.dataset.carouselCurrent || 0);
    let scrollTimer;

    if (!viewport || !slides.length || !previousButton || !nextButton || !title) return;

    const prepareClone = (slide, position) => {
      const clone = slide.cloneNode(true);
      clone.removeAttribute("data-carousel-slide");
      clone.removeAttribute("data-active");
      clone.setAttribute("data-carousel-clone", position);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      const link = clone.querySelector("a");
      link?.removeAttribute("href");
      link?.removeAttribute("aria-current");
      link?.removeAttribute("aria-label");
      link?.setAttribute("tabindex", "-1");
      const image = clone.querySelector("img");
      if (image) image.alt = "";
      return clone;
    };

    const lastClone = prepareClone(slides.at(-1), "before");
    const firstClone = prepareClone(slides[0], "after");
    viewport.prepend(lastClone);
    viewport.append(firstClone);
    const visualSlides = [lastClone, ...slides, firstClone];

    const wrapIndex = (index) => ((index % slides.length) + slides.length) % slides.length;
    const constrainedVisualIndex = (index) => Math.max(0, Math.min(index, visualSlides.length - 1));

    const updateState = (index) => {
      activeIndex = wrapIndex(index);
      carousel.dataset.carouselCurrent = String(activeIndex);

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.toggleAttribute("data-active", active);
        const link = slide.querySelector("a");
        if (active) link?.setAttribute("aria-current", "true");
        else link?.removeAttribute("aria-current");
      });

      const activeSlide = slides[activeIndex];
      title.textContent = activeSlide.dataset.title || "";
    };

    const centerVisualSlide = (index, behavior = "smooth") => {
      const slide = visualSlides[constrainedVisualIndex(index)];
      const left = compactCarousel.matches
        ? slide.offsetLeft
        : slide.offsetLeft - ((viewport.clientWidth - slide.offsetWidth) / 2);
      viewport.scrollTo({
        left,
        behavior: reduceMotion.matches ? "auto" : behavior
      });
    };

    const goTo = (index, behavior = "smooth") => {
      const targetIndex = wrapIndex(index);
      const visualIndex = index < 0
        ? 0
        : index >= slides.length
          ? visualSlides.length - 1
          : targetIndex + 1;
      updateState(targetIndex);
      centerVisualSlide(visualIndex, behavior);
    };

    const updateFromScroll = () => {
      const viewportCenter = viewport.scrollLeft + (viewport.clientWidth / 2);
      const nearest = visualSlides.reduce((best, slide, index) => {
        const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
        const distance = Math.abs(slideCenter - viewportCenter);
        return distance < best.distance ? { index, distance } : best;
      }, { index: activeIndex + 1, distance: Number.POSITIVE_INFINITY });

      if (nearest.index === 0) {
        updateState(slides.length - 1);
        centerVisualSlide(slides.length, "auto");
      } else if (nearest.index === visualSlides.length - 1) {
        updateState(0);
        centerVisualSlide(1, "auto");
      } else {
        updateState(nearest.index - 1);
      }
    };

    previousButton.addEventListener("click", () => goTo(activeIndex - 1));
    nextButton.addEventListener("click", () => goTo(activeIndex + 1));

    carousel.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      goTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });

    if ("onscrollend" in window) {
      viewport.addEventListener("scrollend", updateFromScroll);
    } else {
      viewport.addEventListener("scroll", () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(updateFromScroll, 120);
      }, { passive: true });
    }

    window.addEventListener("resize", () => centerVisualSlide(activeIndex + 1, "auto"));
    updateState(activeIndex);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => centerVisualSlide(activeIndex + 1, "auto")));
  });

  const form = document.getElementById("contact-form");

  if (form) {
    const submitButton = form.querySelector("[data-submit]");
    const submitLabel = form.querySelector("[data-submit-label]");
    const status = form.querySelector("[data-form-status]");
    const controls = Array.from(form.querySelectorAll("input:not([type='hidden']), select, textarea"));
    const fieldNames = {
      nombre: "Escriba su nombre.",
      correo: "Escriba un correo válido.",
      tipo_encargo: "Seleccione el tipo de encargo.",
      ubicacion: "Indique la ubicación del proyecto.",
      mensaje: "Describa brevemente el proyecto y su etapa actual."
    };
    let isSubmitting = false;

    const errorElement = (control) => {
      const describedBy = (control.getAttribute("aria-describedby") || "").split(" ");
      const errorId = describedBy.find((id) => id.startsWith("error-"));
      return errorId ? document.getElementById(errorId) : null;
    };

    const validateControl = (control) => {
      const error = errorElement(control);
      if (!error) return control.validity.valid;

      if (control.validity.valid) {
        control.removeAttribute("aria-invalid");
        error.textContent = "";
        return true;
      }

      control.setAttribute("aria-invalid", "true");
      error.textContent = fieldNames[control.name] || "Revise este campo.";
      return false;
    };

    controls.forEach((control) => {
      control.addEventListener("blur", () => validateControl(control));
      control.addEventListener("input", () => {
        if (control.hasAttribute("aria-invalid")) validateControl(control);
      });
      control.addEventListener("change", () => {
        if (control.hasAttribute("aria-invalid")) validateControl(control);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      status.className = "form-status";
      status.textContent = "";

      const invalid = controls.filter((control) => !validateControl(control));
      if (invalid.length) {
        status.classList.add("is-error");
        status.textContent = "Revise los campos señalados antes de enviar.";
        invalid[0].focus();
        return;
      }

      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitLabel.textContent = "ENVIANDO…";
      status.textContent = "Enviando su consulta.";
      const controller = new AbortController();
      const requestTimeout = window.setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
          signal: controller.signal
        });
        const result = await response.json().catch(() => null);
        const delivered = result?.success === true || result?.success === "true";

        if (!response.ok || !delivered) throw new Error(`Respuesta ${response.status}`);

        form.reset();
        status.classList.add("is-success");
        status.textContent = "Gracias. Su consulta fue enviada correctamente.";
        status.focus();
      } catch (error) {
        status.classList.add("is-error");
        status.textContent = "No pudimos enviar la consulta. Revise su conexión e inténtelo nuevamente.";
        status.focus();
      } finally {
        window.clearTimeout(requestTimeout);
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitLabel.textContent = "ENVIAR CONSULTA";
      }
    });
  }
})();
