(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const prismLayer = document.getElementById("cinemaPrisms");
  const year = document.getElementById("portalYear");
  const choices = document.querySelectorAll("[data-portal-destination]");
  const socialLinks = document.querySelectorAll("[data-social]");
  const contactLinks = document.querySelectorAll("[data-contact]");
  const fineHoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  const noHoverQuery = window.matchMedia("(hover: none)");

  const isWideTouchViewport = () => {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    const aspect = shortSide > 0 ? longSide / shortSide : Infinity;
    const hasTouch = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
    const touchFirst = coarsePointerQuery.matches || noHoverQuery.matches;

    // Fold inner displays and tablet-style touch viewports are much wider than a
    // normal phone, but still compact enough that the desktop compositor profile
    // is unnecessarily expensive. The aspect fallback also covers Android builds
    // that expose unusual pointer/hover capabilities while unfolded.
    const tabletGeometry = shortSide >= 560 && shortSide <= 1000 && longSide >= 720 && longSide <= 1500;
    const foldLikeGeometry = tabletGeometry && aspect <= 1.6;

    return hasTouch && tabletGeometry && (touchFirst || foldLikeGeometry);
  };

  const updateRenderProfile = () => {
    if (!shell) return;

    const wideTouch = isWideTouchViewport();
    shell.classList.toggle("is-wide-touch", wideTouch);
    shell.dataset.renderProfile = wideTouch ? "wide-touch" : "default";

    if (wideTouch) {
      delete shell.dataset.active;
    }
  };

  updateRenderProfile();

  let resizeFrame = 0;
  const scheduleRenderProfileUpdate = () => {
    if (resizeFrame) return;

    resizeFrame = window.requestAnimationFrame(() => {
      updateRenderProfile();
      resizeFrame = 0;
    });
  };

  window.addEventListener("resize", scheduleRenderProfileUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleRenderProfileUpdate, { passive: true });

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const track = (eventName, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, parameters);
    }

    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, parameters);
    }
  };

  choices.forEach((choice) => {
    const destination = choice.dataset.portalDestination || "unknown";

    const activate = () => {
      if (shell && !shell.classList.contains("is-wide-touch")) {
        shell.dataset.active = destination;
      }
    };

    const clear = () => {
      if (shell) delete shell.dataset.active;
    };

    choice.addEventListener("pointerenter", (event) => {
      // Touch pointerenter can become sticky in Chrome/Android and previously
      // triggered a full grid resize on the unfolded Fold. Hover expansion is
      // now reserved for a real fine/hover pointer.
      if (fineHoverQuery.matches && event.pointerType !== "touch") {
        activate();
      }
    });
    choice.addEventListener("pointerleave", clear);
    choice.addEventListener("pointercancel", clear);
    choice.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") clear();
    }, { passive: true });
    choice.addEventListener("focus", () => {
      // Keep keyboard accessibility without treating ordinary touch focus as hover.
      if (fineHoverQuery.matches || choice.matches(":focus-visible")) {
        activate();
      }
    });
    choice.addEventListener("blur", clear);
    choice.addEventListener("click", () => {
      track("portal_select", {
        event_category: "Navigation",
        destination
      });
    });
  });

  socialLinks.forEach((link) => {
    link.addEventListener("click", () => {
      track("portal_social_click", {
        event_category: "Navigation",
        platform: link.dataset.social || "unknown"
      });
    });
  });

  contactLinks.forEach((link) => {
    link.addEventListener("click", () => {
      track("portal_contact_click", {
        event_category: "Contact",
        method: link.dataset.contact || "unknown"
      });
    });
  });

  if (shell && fineHoverQuery.matches) {
    let frame = 0;

    window.addEventListener("pointermove", (event) => {
      if (frame || event.pointerType === "touch") return;

      frame = window.requestAnimationFrame(() => {
        shell.style.setProperty("--pointer-x", `${(event.clientX / window.innerWidth) * 100}%`);
        shell.style.setProperty("--pointer-y", `${(event.clientY / window.innerHeight) * 100}%`);
        frame = 0;
      });
    }, { passive: true });
  }

  if (prismLayer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const fragment = document.createDocumentFragment();
    const palettes = [
      ["rgba(255,214,107,.72)", "rgba(255,142,83,.12)"],
      ["rgba(66,245,207,.62)", "rgba(49,217,255,.12)"],
      ["rgba(165,118,255,.65)", "rgba(255,79,184,.12)"],
      ["rgba(255,79,184,.55)", "rgba(255,214,107,.1)"]
    ];

    for (let index = 0; index < 18; index += 1) {
      const prism = document.createElement("i");
      const palette = palettes[index % palettes.length];
      const size = 9 + Math.random() * 22;

      prism.className = "cinema-prism";
      prism.style.setProperty("--left", `${Math.random() * 100}%`);
      prism.style.setProperty("--top", `${Math.random() * 100}%`);
      prism.style.setProperty("--size", `${size}px`);
      prism.style.setProperty("--opacity", String(.13 + Math.random() * .28));
      prism.style.setProperty("--color-a", palette[0]);
      prism.style.setProperty("--color-b", palette[1]);
      prism.style.setProperty("--duration", `${7 + Math.random() * 10}s`);
      prism.style.setProperty("--delay", `${-Math.random() * 13}s`);
      prism.style.setProperty("--drift-x", `${-36 + Math.random() * 72}px`);
      prism.style.setProperty("--drift-y", `${-48 + Math.random() * 96}px`);
      prism.style.setProperty("--rotate", `${Math.random() * 180}deg`);
      fragment.appendChild(prism);
    }

    prismLayer.appendChild(fragment);
  }
})();
