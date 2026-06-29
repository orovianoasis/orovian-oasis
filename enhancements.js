/*
  Orovian Oasis - Optional Visual Enhancements
  ------------------------------------------------
  This file is OPTIONAL.
  Delete this file or remove the script tag and the site returns to static.

  Add near the bottom of index.html before </body>:
  <script src="enhancements.js" defer></script>

  Controls in browser console:
  window.OrovianEnhancements.on()
  window.OrovianEnhancements.off()
  window.OrovianEnhancements.toggle()
  window.OrovianEnhancements.status()
*/

(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;

  const state = {
    enabled: false,
    particles: [],
    particleLayer: null,
    aura: null,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    isMobile: window.matchMedia("(max-width: 760px), (pointer: coarse)").matches,
    rafId: null,
    lastX: window.innerWidth / 2,
    lastY: window.innerHeight / 2
  };

  function injectStyles() {
    if (document.getElementById("orovian-enhancement-styles")) return;

    const style = document.createElement("style");
    style.id = "orovian-enhancement-styles";
    style.textContent = `
      body.orovian-enhanced {
        --oo-glow-x: 50%;
        --oo-glow-y: 42%;
      }

      .oo-aura {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        opacity: 0;
        transition: opacity 500ms ease;
        background:
          radial-gradient(circle at var(--oo-glow-x) var(--oo-glow-y), rgba(217, 189, 85, 0.16), transparent 18%),
          radial-gradient(circle at calc(var(--oo-glow-x) + 12%) calc(var(--oo-glow-y) + 8%), rgba(63, 139, 210, 0.11), transparent 24%);
        mix-blend-mode: screen;
      }

      body.orovian-enhanced .oo-aura {
        opacity: 1;
      }

      .oo-particle-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }

      .oo-particle {
        position: absolute;
        width: var(--size);
        height: var(--size);
        left: var(--left);
        top: var(--top);
        border-radius: 999px;
        background: rgba(217, 189, 85, var(--alpha));
        box-shadow: 0 0 18px rgba(217, 189, 85, 0.25);
        transform: translate3d(0, 0, 0);
        animation: ooFloat var(--duration) ease-in-out infinite alternate;
        animation-delay: var(--delay);
      }

      body.orovian-enhanced .hero,
      body.orovian-enhanced .form-card,
      body.orovian-enhanced .site-header,
      body.orovian-enhanced .site-footer {
        animation: ooEntrance 760ms cubic-bezier(.2,.75,.2,1) both;
      }

      body.orovian-enhanced .site-header { animation-delay: 40ms; }
      body.orovian-enhanced .hero { animation-delay: 110ms; }
      body.orovian-enhanced .form-card { animation-delay: 180ms; }
      body.orovian-enhanced .site-footer { animation-delay: 250ms; }

      body.orovian-enhanced .form-card {
        transition: transform 220ms ease, box-shadow 220ms ease;
      }

      body.orovian-enhanced:not(.oo-mobile) .form-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.33);
      }

      body.orovian-enhanced .form-card::after {
        content: "";
        position: absolute;
        inset: -40% -70%;
        pointer-events: none;
        background: linear-gradient(115deg, transparent 36%, rgba(255, 255, 255, 0.34) 49%, rgba(217, 189, 85, 0.22) 52%, transparent 64%);
        transform: translateX(-55%) rotate(7deg);
        opacity: 0;
      }

      body.orovian-enhanced .form-card.oo-sheen::after {
        animation: ooSheen 1200ms ease both;
      }

      body.orovian-enhanced .gold-button,
      body.orovian-enhanced .submit-button {
        position: relative;
        overflow: hidden;
      }

      .oo-ripple {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.45);
        transform: translate(-50%, -50%) scale(1);
        animation: ooRipple 620ms ease-out forwards;
        pointer-events: none;
      }

      body.orovian-enhanced:not(.oo-mobile) .brand-logo {
        transition: transform 220ms ease, filter 220ms ease;
      }

      body.orovian-enhanced:not(.oo-mobile) .brand:hover .brand-logo {
        transform: rotate(-2deg) scale(1.025);
        filter: drop-shadow(0 0 16px rgba(217, 189, 85, 0.28));
      }

      @keyframes ooEntrance {
        from { opacity: 0; transform: translateY(10px) scale(0.992); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes ooFloat {
        from { transform: translate3d(0, 0, 0); opacity: 0.32; }
        to { transform: translate3d(var(--drift-x), var(--drift-y), 0); opacity: 0.85; }
      }

      @keyframes ooSheen {
        0% { opacity: 0; transform: translateX(-60%) rotate(7deg); }
        18% { opacity: 1; }
        100% { opacity: 0; transform: translateX(62%) rotate(7deg); }
      }

      @keyframes ooRipple {
        to { transform: translate(-50%, -50%) scale(22); opacity: 0; }
      }

      @media (max-width: 760px), (pointer: coarse) {
        .oo-aura {
          background:
            radial-gradient(circle at 50% 28%, rgba(217, 189, 85, 0.13), transparent 26%),
            radial-gradient(circle at 50% 72%, rgba(63, 139, 210, 0.08), transparent 34%);
        }

        .oo-particle {
          box-shadow: 0 0 10px rgba(217, 189, 85, 0.18);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body.orovian-enhanced .hero,
        body.orovian-enhanced .form-card,
        body.orovian-enhanced .site-header,
        body.orovian-enhanced .site-footer,
        .oo-particle,
        body.orovian-enhanced .form-card.oo-sheen::after,
        .oo-ripple {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function makeAura() {
    if (state.aura) return;
    const aura = document.createElement("div");
    aura.className = "oo-aura";
    body.prepend(aura);
    state.aura = aura;
  }

  function makeParticles() {
    if (state.particleLayer || state.prefersReducedMotion) return;

    const layer = document.createElement("div");
    layer.className = "oo-particle-layer";

    const count = state.isMobile ? 10 : 18;

    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "oo-particle";

      const size = rand(2, state.isMobile ? 4 : 6);
      dot.style.setProperty("--size", `${size}px`);
      dot.style.setProperty("--left", `${rand(3, 97)}%`);
      dot.style.setProperty("--top", `${rand(7, 93)}%`);
      dot.style.setProperty("--alpha", `${rand(14, 34) / 100}`);
      dot.style.setProperty("--duration", `${rand(3400, 7800)}ms`);
      dot.style.setProperty("--delay", `${rand(-4200, 600)}ms`);
      dot.style.setProperty("--drift-x", `${rand(-18, 18)}px`);
      dot.style.setProperty("--drift-y", `${rand(-28, 28)}px`);

      layer.appendChild(dot);
    }

    body.prepend(layer);
    state.particleLayer = layer;
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function updateAura(x, y) {
    if (!state.enabled || state.isMobile) return;

    state.lastX += (x - state.lastX) * 0.12;
    state.lastY += (y - state.lastY) * 0.12;

    root.style.setProperty("--oo-glow-x", `${(state.lastX / window.innerWidth) * 100}%`);
    root.style.setProperty("--oo-glow-y", `${(state.lastY / window.innerHeight) * 100}%`);
  }

  function bindPointerAura() {
    if (state.isMobile || state.prefersReducedMotion) return;

    window.addEventListener("pointermove", function (event) {
      if (!state.enabled) return;
      cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(function () {
        updateAura(event.clientX, event.clientY);
      });
    }, { passive: true });
  }

  function bindRipples() {
    const buttons = document.querySelectorAll(".gold-button, .submit-button");

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (!state.enabled || state.prefersReducedMotion) return;

        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "oo-ripple";
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);

        window.setTimeout(function () {
          ripple.remove();
        }, 700);
      });
    });
  }

  function bindSheen() {
    const card = document.querySelector(".form-card");
    if (!card || state.prefersReducedMotion) return;

    window.setInterval(function () {
      if (!state.enabled) return;
      card.classList.remove("oo-sheen");
      void card.offsetWidth;
      card.classList.add("oo-sheen");
    }, state.isMobile ? 9000 : 6500);
  }

  function on() {
    state.enabled = true;
    body.classList.add("orovian-enhanced");
    body.classList.toggle("oo-mobile", state.isMobile);
    injectStyles();
    makeAura();
    makeParticles();
  }

  function off() {
    state.enabled = false;
    body.classList.remove("orovian-enhanced", "oo-mobile");
  }

  function toggle() {
    state.enabled ? off() : on();
  }

  function status() {
    return {
      enabled: state.enabled,
      mobileMode: state.isMobile,
      reducedMotion: state.prefersReducedMotion
    };
  }

  function boot() {
    injectStyles();
    bindPointerAura();
    bindRipples();
    bindSheen();
    on();
  }

  window.OrovianEnhancements = { on, off, toggle, status };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
