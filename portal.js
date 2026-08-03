(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const particleLayer = document.getElementById("portalParticles");
  const year = document.getElementById("portalYear");
  const cards = document.querySelectorAll("[data-portal-destination]");
  const socialLinks = document.querySelectorAll("[data-social]");

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

  cards.forEach((card) => {
    const destination = card.dataset.portalDestination || "unknown";

    const activate = () => {
      if (shell) shell.dataset.active = destination;
    };

    const clear = () => {
      if (shell) delete shell.dataset.active;
    };

    card.addEventListener("pointerenter", activate);
    card.addEventListener("pointerleave", clear);
    card.addEventListener("focus", activate);
    card.addEventListener("blur", clear);
    card.addEventListener("click", () => {
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

  if (shell && window.matchMedia("(pointer: fine)").matches) {
    let frame = 0;

    window.addEventListener("pointermove", (event) => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        shell.style.setProperty("--mouse-x", `${(event.clientX / window.innerWidth) * 100}%`);
        shell.style.setProperty("--mouse-y", `${(event.clientY / window.innerHeight) * 100}%`);
        frame = 0;
      });
    }, { passive: true });
  }

  if (particleLayer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const fragment = document.createDocumentFragment();
    const colors = ["#f7c45d", "#56d6ca", "#a784ff", "#fff2c7"];

    for (let index = 0; index < 34; index += 1) {
      const particle = document.createElement("i");
      const size = 1 + Math.random() * 2.2;

      particle.className = "portal-particle";
      particle.style.setProperty("--size", `${size}px`);
      particle.style.setProperty("--left", `${Math.random() * 100}%`);
      particle.style.setProperty("--top", `${Math.random() * 100}%`);
      particle.style.setProperty("--opacity", String(0.18 + Math.random() * 0.52));
      particle.style.setProperty("--color", colors[index % colors.length]);
      particle.style.setProperty("--duration", `${5 + Math.random() * 9}s`);
      particle.style.setProperty("--delay", `${-Math.random() * 10}s`);
      particle.style.setProperty("--drift-x", `${-24 + Math.random() * 48}px`);
      particle.style.setProperty("--drift-y", `${-32 + Math.random() * 64}px`);
      fragment.appendChild(particle);
    }

    particleLayer.appendChild(fragment);
  }
})();
