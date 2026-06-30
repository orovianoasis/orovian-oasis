/*
  Orovian Oasis - Optional Visual Enhancements
  ------------------------------------------------
  OPTIONAL FILE.
  Delete this file or remove this line from index.html and the page returns to static:

  <script src="enhancements.js" defer></script>

  Console controls:
  window.OrovianEnhancements.on()
  window.OrovianEnhancements.off()
  window.OrovianEnhancements.toggle()
  window.OrovianEnhancements.status()
  window.OrovianEnhancements.set({ desktopParticleCount: 55, desktopSpeed: 0.75 })

  Quick dial-in settings are in CONFIG below.
*/

(function () {
  "use strict";

  /*
    =========================
    EASY DIAL-IN SETTINGS
    =========================
    Want more visible movement?
    - Raise desktopParticleCount
    - Raise desktopSpeed
    - Raise desktopOpacityMax
    - Raise auraStrength

    Want calmer?
    - Lower those same numbers.
  */
  const CONFIG = {
    enabledOnLoad: true,

    // Background photo
    backgroundPhoto: true,
    backgroundPhotoUrl: "assets/background-house.jpg",
    backgroundPhotoOpacity: 0.14,

    // Desktop orbs
    desktopParticleCount: 48,
    desktopSpeed: 0.62,
    desktopSizeMin: 2.2,
    desktopSizeMax: 8.5,
    desktopOpacityMin: 0.18,
    desktopOpacityMax: 0.58,

    // Mobile orbs: visible, but lighter so phones do not sweat like a laptop in July.
    mobileParticleCount: 48,
    mobileSpeed: 0.48,
    mobileSizeMin: 1.8,
    mobileSizeMax: 5.8,
    mobileOpacityMin: 0.14,
    mobileOpacityMax: 0.42,

    // Background glow / aura
    auraStrength: 0.24,
    auraBlueStrength: 0.17,
    auraFollowEase: 0.08, // desktop cursor follow smoothness

    // Effects
    entranceAnimations: true,
    buttonRipples: true,
    cardSheen: true,
    logoHoverTilt: true,
    formHoverLift: true,

    // Timing
    sheenEveryMsDesktop: 5200,
    sheenEveryMsMobile: 7800
  };

  const root = document.documentElement;
  const body = document.body;

  const state = {
    enabled: false,
    isMobile: window.matchMedia("(max-width: 760px), (pointer: coarse)").matches,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    aura: null,
    styleTag: null,
    sheenTimer: null,

    mouseX: window.innerWidth * 0.5,
    mouseY: window.innerHeight * 0.42,
    glowX: window.innerWidth * 0.5,
    glowY: window.innerHeight * 0.42
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getSettings() {
    return {
      particleCount: state.isMobile ? CONFIG.mobileParticleCount : CONFIG.desktopParticleCount,
      speed: state.isMobile ? CONFIG.mobileSpeed : CONFIG.desktopSpeed,
      sizeMin: state.isMobile ? CONFIG.mobileSizeMin : CONFIG.desktopSizeMin,
      sizeMax: state.isMobile ? CONFIG.mobileSizeMax : CONFIG.desktopSizeMax,
      opacityMin: state.isMobile ? CONFIG.mobileOpacityMin : CONFIG.desktopOpacityMin,
      opacityMax: state.isMobile ? CONFIG.mobileOpacityMax : CONFIG.desktopOpacityMax
    };
  }

  function injectStyles() {
    if (document.getElementById("orovian-enhancement-styles")) return;

    const style = document.createElement("style");
    style.id = "orovian-enhancement-styles";
    style.textContent = `
      body.orovian-enhanced {
        --oo-glow-x: 50%;
        --oo-glow-y: 42%;
        --oo-aura-gold: ${CONFIG.auraStrength};
        --oo-aura-blue: ${CONFIG.auraBlueStrength};
        --oo-bg-photo: none;
        --oo-bg-photo-opacity: 0;
      }

      body.orovian-enhanced::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-image: var(--oo-bg-photo);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: var(--oo-bg-photo-opacity);
        filter: saturate(0.85) contrast(1.05);
      }

      .oo-aura {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        opacity: 0;
        transition: opacity 420ms ease;
        background:
          radial-gradient(circle at var(--oo-glow-x) var(--oo-glow-y), rgba(217, 189, 85, var(--oo-aura-gold)), transparent 24%),
          radial-gradient(circle at calc(var(--oo-glow-x) + 15%) calc(var(--oo-glow-y) + 10%), rgba(57, 139, 220, var(--oo-aura-blue)), transparent 30%);
        mix-blend-mode: screen;
      }

      body.orovian-enhanced .oo-aura { opacity: 1; }

      .oo-orb-canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        opacity: 1;
      }

      body.orovian-enhanced .page-shell,
      body.orovian-enhanced .site-header,
      body.orovian-enhanced .main-content,
      body.orovian-enhanced .site-footer {
        position: relative;
        z-index: 1;
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

      body.orovian-enhanced .form-card {
        transition: transform 220ms ease, box-shadow 220ms ease;
      }

      body.orovian-enhanced:not(.oo-mobile) .form-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 26px 74px rgba(0, 0, 0, 0.34);
      }

      body.orovian-enhanced .form-card::after {
        content: "";
        position: absolute;
        inset: -45% -80%;
        pointer-events: none;
        background: linear-gradient(115deg, transparent 36%, rgba(255, 255, 255, 0.34) 49%, rgba(217, 189, 85, 0.24) 52%, transparent 64%);
        transform: translateX(-62%) rotate(7deg);
        opacity: 0;
      }

      body.orovian-enhanced .form-card.oo-sheen::after {
  animation: ooSheen 1180ms ease both;
}

body.orovian-enhanced .form-card.oo-sheen-reverse::after {
  animation: ooSheenReverse 1180ms ease both;
}

      body.orovian-enhanced:not(.oo-mobile) .brand-logo {
        transition: transform 220ms ease, filter 220ms ease;
        transform-origin: center;
      }

      body.orovian-enhanced:not(.oo-mobile) .brand:hover .brand-logo {
        transform: rotate(-2deg) scale(1.035);
        filter: drop-shadow(0 0 18px rgba(217, 189, 85, 0.32));
      }

      body.orovian-enhanced.oo-entrance .site-header,
      body.orovian-enhanced.oo-entrance .hero,
      body.orovian-enhanced.oo-entrance .form-card,
      body.orovian-enhanced.oo-entrance .site-footer {
        animation: ooEntrance 760ms cubic-bezier(.2,.75,.2,1) both;
      }

      body.orovian-enhanced.oo-entrance .site-header { animation-delay: 40ms; }
      body.orovian-enhanced.oo-entrance .hero { animation-delay: 110ms; }
      body.orovian-enhanced.oo-entrance .form-card { animation-delay: 180ms; }
      body.orovian-enhanced.oo-entrance .site-footer { animation-delay: 250ms; }

      @keyframes ooEntrance {
        from { opacity: 0; transform: translateY(10px) scale(0.992); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes ooSheen {
  0% { opacity: 0; transform: translateX(-62%) rotate(7deg); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translateX(64%) rotate(7deg); }
}

      @keyframes ooSheenReverse {
  0% { opacity: 0; transform: translateX(64%) rotate(-7deg); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-62%) rotate(-7deg); }
}

      @keyframes ooRipple {
        to { transform: translate(-50%, -50%) scale(22); opacity: 0; }
      }


      .oo-submit-flight {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        display: grid;
        place-items: center;
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 48%, rgba(217, 189, 85, 0.20), transparent 28%),
          rgba(3, 16, 29, 0.22);
        opacity: 0;
        animation: ooSubmitOverlay 1900ms ease both;
      }

      .oo-submit-flight__mark {
        width: min(38vw, 210px);
        max-width: 70%;
        filter: drop-shadow(0 0 32px rgba(217, 189, 85, 0.60));
        transform-origin: center;
        animation: ooEagleFlight 1850ms cubic-bezier(.18,.78,.18,1) both;
      }

      .oo-submit-flight__trail {
        position: absolute;
        width: min(74vw, 560px);
        height: min(74vw, 560px);
        border: 2px solid rgba(217, 189, 85, 0.38);
        border-left-color: transparent;
        border-bottom-color: rgba(73, 147, 220, 0.22);
        border-radius: 50%;
        filter: blur(0.2px) drop-shadow(0 0 16px rgba(217, 189, 85, 0.28));
        animation: ooTrailSpin 1500ms cubic-bezier(.2,.8,.2,1) both;
      }

      .oo-submit-flight__message {
        position: absolute;
        left: 50%;
        bottom: clamp(72px, 16vh, 150px);
        transform: translateX(-50%);
        color: #fffaf0;
        font-family: "Cormorant Garamond", Georgia, serif;
        font-size: clamp(2.1rem, 7vw, 4.2rem);
        font-style: italic;
        font-weight: 700;
        letter-spacing: -0.04em;
        text-shadow: 0 12px 38px rgba(0, 0, 0, 0.38);
        white-space: nowrap;
        animation: ooSubmitText 1700ms ease both;
      }

      @keyframes ooSubmitOverlay {
        0% { opacity: 0; }
        12% { opacity: 1; }
        78% { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes ooEagleFlight {
        0% { transform: translate3d(-38vw, 18vh, 0) scale(0.58) rotate(-18deg); opacity: 0; }
        18% { opacity: 1; }
        48% { transform: translate3d(0, 0, 0) scale(1.08) rotate(8deg); opacity: 1; }
        72% { transform: translate3d(20vw, -16vh, 0) scale(0.78) rotate(28deg); opacity: 0.92; }
        100% { transform: translate3d(62vw, -40vh, 0) scale(0.22) rotate(42deg); opacity: 0; }
      }

      @keyframes ooTrailSpin {
        0% { transform: scale(0.34) rotate(0deg); opacity: 0; }
        18% { opacity: 1; }
        82% { opacity: 0.88; }
        100% { transform: scale(1.38) rotate(410deg); opacity: 0; }
      }

      @keyframes ooSubmitText {
        0%, 18% { opacity: 0; transform: translateX(-50%) translateY(12px); }
        36%, 74% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }

      @media (max-width: 760px), (pointer: coarse) {
        .oo-submit-flight__mark {
          width: min(56vw, 190px);
        }

        .oo-submit-flight__trail {
          width: min(86vw, 430px);
          height: min(86vw, 430px);
        }

        .oo-submit-flight__message {
          bottom: 12vh;
          font-size: clamp(2.05rem, 11vw, 3.4rem);
        }
      }

      @media (max-width: 760px), (pointer: coarse) {
        .oo-aura {
          background:
            radial-gradient(circle at 50% 26%, rgba(217, 189, 85, 0.18), transparent 30%),
            radial-gradient(circle at 50% 74%, rgba(57, 139, 220, 0.12), transparent 36%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .oo-orb-canvas,
        .oo-aura {
          display: none !important;
        }

        body.orovian-enhanced.oo-entrance .site-header,
        body.orovian-enhanced.oo-entrance .hero,
        body.orovian-enhanced.oo-entrance .form-card,
        body.orovian-enhanced.oo-entrance .site-footer,
        body.orovian-enhanced .form-card.oo-sheen::after,
        body.orovian-enhanced .form-card.oo-sheen-reverse::after,
        .oo-ripple {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    state.styleTag = style;
  }

  function createAura() {
    if (state.aura) return;

    const aura = document.createElement("div");
    aura.className = "oo-aura";
    body.prepend(aura);
    state.aura = aura;
  }

  function createCanvas() {
    if (state.canvas || state.prefersReducedMotion) return;

    const canvas = document.createElement("canvas");
    canvas.className = "oo-orb-canvas";
    body.prepend(canvas);

    state.canvas = canvas;
    state.ctx = canvas.getContext("2d", { alpha: true });

    resizeCanvas();
    createParticles();
  }

  function resizeCanvas() {
    if (!state.canvas || !state.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.canvas.width = Math.floor(window.innerWidth * dpr);
    state.canvas.height = Math.floor(window.innerHeight * dpr);
    state.canvas.style.width = `${window.innerWidth}px`;
    state.canvas.style.height = `${window.innerHeight}px`;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const settings = getSettings();
    state.particles = [];

    for (let i = 0; i < settings.particleCount; i += 1) {
      state.particles.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        radius: rand(settings.sizeMin, settings.sizeMax),
        vx: rand(-settings.speed, settings.speed),
        vy: rand(-settings.speed, settings.speed),
        alpha: rand(settings.opacityMin, settings.opacityMax),
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.008, 0.024),
        colorMix: Math.random()
      });
    }
  }

  function drawParticles() {
    if (!state.enabled || !state.ctx || state.prefersReducedMotion) return;

    const ctx = state.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    state.particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      if (p.x < -30) p.x = window.innerWidth + 30;
      if (p.x > window.innerWidth + 30) p.x = -30;
      if (p.y < -30) p.y = window.innerHeight + 30;
      if (p.y > window.innerHeight + 30) p.y = -30;

      const pulseBoost = (Math.sin(p.pulse) + 1) * 0.5;
      const alpha = clamp(p.alpha + pulseBoost * 0.18, 0.08, 0.78);
      const radius = p.radius + pulseBoost * 1.8;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 5.5);
      const gold = `rgba(217, 189, 85, ${alpha})`;
      const blue = `rgba(57, 139, 220, ${alpha * 0.52})`;

      gradient.addColorStop(0, p.colorMix > 0.24 ? gold : blue);
      gradient.addColorStop(0.35, p.colorMix > 0.24 ? `rgba(217, 189, 85, ${alpha * 0.28})` : `rgba(57, 139, 220, ${alpha * 0.2})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, radius * 5.5, 0, Math.PI * 2);
      ctx.fill();
    });

    updateAuraPosition();
    state.animationId = requestAnimationFrame(drawParticles);
  }

  function updateAuraPosition() {
    if (!state.enabled) return;

    if (state.isMobile) {
      root.style.setProperty("--oo-glow-x", "50%");
      root.style.setProperty("--oo-glow-y", "42%");
      return;
    }

    state.glowX += (state.mouseX - state.glowX) * CONFIG.auraFollowEase;
    state.glowY += (state.mouseY - state.glowY) * CONFIG.auraFollowEase;

    root.style.setProperty("--oo-glow-x", `${(state.glowX / window.innerWidth) * 100}%`);
    root.style.setProperty("--oo-glow-y", `${(state.glowY / window.innerHeight) * 100}%`);
  }

  function bindPointerAura() {
    if (state.isMobile || state.prefersReducedMotion) return;

    window.addEventListener("pointermove", function (event) {
      state.mouseX = event.clientX;
      state.mouseY = event.clientY;
    }, { passive: true });
  }

  function bindRipples() {
    if (!CONFIG.buttonRipples) return;

    document.querySelectorAll(".gold-button, .submit-button").forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (!state.enabled || state.prefersReducedMotion) return;

        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "oo-ripple";

        const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
        const y = event.clientY ? event.clientY - rect.top : rect.height / 2;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        window.setTimeout(function () {
          ripple.remove();
        }, 700);
      });
    });
  }

  function startSheen() {
    if (!CONFIG.cardSheen || state.prefersReducedMotion) return;

    const card = document.querySelector(".form-card");
    if (!card) return;

    const delay = state.isMobile ? CONFIG.sheenEveryMsMobile : CONFIG.sheenEveryMsDesktop;

    window.clearInterval(state.sheenTimer);
    state.sheenTimer = window.setInterval(function () {
      if (!state.enabled) return;

      card.classList.remove("oo-sheen", "oo-sheen-reverse");
void card.offsetWidth;

const nextClass = card.classList.contains("oo-last-sheen-normal")
  ? "oo-sheen-reverse"
  : "oo-sheen";

card.classList.toggle("oo-last-sheen-normal", nextClass === "oo-sheen");
card.classList.add(nextClass);
    }, delay);
  }

  function on() {
    if (state.enabled) return;

    state.enabled = true;

    if (CONFIG.backgroundPhoto) {
      root.style.setProperty("--oo-bg-photo", `url("${CONFIG.backgroundPhotoUrl}")`);
      root.style.setProperty("--oo-bg-photo-opacity", CONFIG.backgroundPhotoOpacity);
    } else {
      root.style.setProperty("--oo-bg-photo", "none");
      root.style.setProperty("--oo-bg-photo-opacity", "0");
    }

    body.classList.add("orovian-enhanced");
    body.classList.toggle("oo-mobile", state.isMobile);
    body.classList.toggle("oo-entrance", CONFIG.entranceAnimations);

    injectStyles();
    createAura();
    createCanvas();

    if (state.canvas && !state.animationId && !state.prefersReducedMotion) {
      drawParticles();
    }

    startSheen();
  }

  function off() {
    state.enabled = false;
    body.classList.remove("orovian-enhanced", "oo-mobile", "oo-entrance");

    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }

    window.clearInterval(state.sheenTimer);
    state.sheenTimer = null;

    const card = document.querySelector(".form-card");
    if (card) card.classList.remove("oo-sheen", "oo-sheen-reverse", "oo-last-sheen-normal");

    root.style.removeProperty("--oo-glow-x");
    root.style.removeProperty("--oo-glow-y");
    root.style.removeProperty("--oo-bg-photo");
    root.style.removeProperty("--oo-bg-photo-opacity");
  }

  function toggle() {
    state.enabled ? off() : on();
  }

  function status() {
    return {
      enabled: state.enabled,
      mobileMode: state.isMobile,
      reducedMotion: state.prefersReducedMotion,
      particles: state.particles.length,
      config: { ...CONFIG }
    };
  }

  function set(nextConfig) {
    Object.assign(CONFIG, nextConfig || {});

    if (state.canvas) {
      resizeCanvas();
      createParticles();
    }

    if (state.enabled) {
      root.style.setProperty("--oo-aura-gold", CONFIG.auraStrength);
      root.style.setProperty("--oo-aura-blue", CONFIG.auraBlueStrength);
      startSheen();
    }

    return status();
  }


  function playSubmitSuccess(options = {}) {
    if (!state.enabled || state.prefersReducedMotion) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      const overlay = document.createElement("div");
      overlay.className = "oo-submit-flight";
      overlay.setAttribute("aria-hidden", "true");

      const trail = document.createElement("div");
      trail.className = "oo-submit-flight__trail";

      const mark = document.createElement("img");
      mark.className = "oo-submit-flight__mark";
      mark.src = "assets/logo.webp";
      mark.alt = "";

      const message = document.createElement("div");
      message.className = "oo-submit-flight__message";
      message.textContent = "Property Sent";

      overlay.appendChild(trail);
      overlay.appendChild(mark);
      overlay.appendChild(message);
      body.appendChild(overlay);

      window.setTimeout(function () {
        overlay.remove();
        resolve();
      }, state.isMobile ? 1650 : 1900);
    });
  }

  function handleResize() {
    const wasMobile = state.isMobile;
    state.isMobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;

    body.classList.toggle("oo-mobile", state.isMobile);

    resizeCanvas();

    if (wasMobile !== state.isMobile) {
      createParticles();
      startSheen();
    }
  }

  function boot() {
    injectStyles();
    bindPointerAura();
    bindRipples();

    window.addEventListener("resize", handleResize, { passive: true });

    if (CONFIG.enabledOnLoad) on();
  }

  window.OrovianEnhancements = { on, off, toggle, status, set, playSubmitSuccess };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
