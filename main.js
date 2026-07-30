(function () {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".site-nav");

  if (menuButton && menu) {
    const setMenu = (open) => {
      menuButton.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      menuButton.querySelector("span").textContent = open ? "Cerrar" : "Menú";
    };

    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuButton.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
  const filterStatus = document.querySelector("[data-filter-status]");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visible = 0;

      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      projectCards.forEach((card) => {
        const matches = filter === "Todos" || card.dataset.category === filter;
        card.hidden = !matches;
        if (matches) visible += 1;
      });

      if (filterStatus) {
        filterStatus.textContent = `${visible} ${visible === 1 ? "proyecto visible" : "proyectos visibles"}.`;
      }
    });
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
      etapa_actual: "Seleccione la etapa actual.",
      mensaje: "Cuéntenos brevemente qué necesita resolver."
    };

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

    const requestedReason = new URLSearchParams(window.location.search).get("motivo");
    if (requestedReason === "apoyo-tecnico") {
      const technicalOption = form.querySelector("input[name='motivo'][value='Necesito apoyo técnico']");
      if (technicalOption) technicalOption.checked = true;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      const invalid = controls.filter((control) => !validateControl(control));
      if (invalid.length) {
        status.classList.add("is-error");
        status.textContent = "Revise los campos señalados antes de enviar.";
        invalid[0].focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitLabel.textContent = "Enviando…";
      status.textContent = "Enviando su consulta.";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error(`Respuesta ${response.status}`);

        form.reset();
        status.classList.add("is-success");
        status.textContent = "Gracias. Su consulta fue enviada correctamente; EEAD responderá dentro de 2 días hábiles.";
        status.focus();
      } catch (error) {
        status.classList.add("is-error");
        status.textContent = "No pudimos enviar la consulta. Revise su conexión e inténtelo nuevamente.";
        status.focus();
      } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitLabel.textContent = "Enviar consulta";
      }
    });
  }
})();
