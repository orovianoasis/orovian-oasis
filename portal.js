(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const prismLayer = document.getElementById("cinemaPrisms");
  const year = document.getElementById("portalYear");
  const choices = document.querySelectorAll("[data-portal-destination]");
  const socialLinks = document.querySelectorAll("[data-social]");
  const contactLinks = document.querySelectorAll("[data-contact]");

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
      if (shell) shell.dataset.active = destination;
    };

    const clear = () => {
      if (shell) delete shell.dataset.active;
    };

    choice.addEventListener("pointerenter", activate);
    choice.addEventListener("pointerleave", clear);
    choice.addEventListener("focus", activate);
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

  if (shell && window.matchMedia("(pointer: fine)").matches) {
    let frame = 0;

    window.addEventListener("pointermove", (event) => {
      if (frame) return;

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
