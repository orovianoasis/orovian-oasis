(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");
  const prismLayer = document.getElementById("cinemaPrisms");
  const year = document.getElementById("portalYear");

  const choices = Array.from(
    document.querySelectorAll("[data-portal-destination]")
  );

  const socialLinks = document.querySelectorAll("[data-social]");
  const contactLinks = document.querySelectorAll("[data-contact]");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const realHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  let foldSafeMode = false;
  let resizeTimer = null;

  /*
   * ------------------------------------------------------------
   * FOLD / LARGE ANDROID TOUCH-SCREEN STABILITY FIX
   * ------------------------------------------------------------
   *
   * The unfolded Fold can be wide enough to receive the desktop
   * two-column layout even though it is still Android Chrome.
   *
   * Desktop SVG/filter animations can cause GPU compositing flashes
   * on that combination.
   *
   * Instead of changing the layout, this detects:
   *
   * 1. Android
   * 2. Touch capability
   * 3. The two portal cards actually being side-by-side
   *
   * It then keeps the two-column design but uses safer animation.
   */

  const isAndroidTouchDevice = () => {
    const userAgent = navigator.userAgent || "";

    return (
      /Android/i.test(userAgent) &&
      (navigator.maxTouchPoints || 0) > 0
    );
  };

  const portalIsSideBySide = () => {
    if (!stage || choices.length < 2) {
      return false;
    }

    const leftCard = choices[0].getBoundingClientRect();
    const rightCard = choices[1].getBoundingClientRect();

    if (!leftCard.width || !rightCard.width) {
      return false;
    }

    const sameRow =
      Math.abs(leftCard.top - rightCard.top) < 16;

    const horizontallySeparated =
      Math.abs(leftCard.left - rightCard.left) > 40;

    return sameRow && horizontallySeparated;
  };

  const installFoldSafeCSS = () => {
    if (document.getElementById("orovianFoldSafeCSS")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "orovianFoldSafeCSS";

    style.textContent = `
      /*
       * Only active when portal.js adds .portal-fold-safe.
       * Desktop and normal phone layouts are untouched.
       */

      .portal-shell.portal-fold-safe .scene-house,
      .portal-shell.portal-fold-safe .scene-showcase {
        animation: none !important;
        transform: none !important;
        will-change: auto !important;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      /*
       * Stop repaint-heavy animation INSIDE the SVG artwork.
       * The complete scene container will still move below.
       */

      .portal-shell.portal-fold-safe .scene-contour,
      .portal-shell.portal-fold-safe .house-halo,
      .portal-shell.portal-fold-safe .house-line,
      .portal-shell.portal-fold-safe .house-chimney,
      .portal-shell.portal-fold-safe .chimney-smoke,
      .portal-shell.portal-fold-safe .smoke-puff,
      .portal-shell.portal-fold-safe .house-door,
      .portal-shell.portal-fold-safe .door-light,
      .portal-shell.portal-fold-safe .door-panel,
      .portal-shell.portal-fold-safe .door-knob,
      .portal-shell.portal-fold-safe .house-spark,
      .portal-shell.portal-fold-safe .film-halo,
      .portal-shell.portal-fold-safe .film-frame,
      .portal-shell.portal-fold-safe .film-ticks,
      .portal-shell.portal-fold-safe .floating-media,
      .portal-shell.portal-fold-safe .prism-shape,
      .portal-shell.portal-fold-safe .prism-ray,
      .portal-shell.portal-fold-safe .showcase-spark {
        animation: none !important;
      }

      /*
       * Android Chrome can flash when filtered SVG layers are
       * simultaneously being transformed.
       *
       * Remove those expensive filter passes ONLY in Fold-safe mode.
       */

      .portal-shell.portal-fold-safe .choice-scene svg,
      .portal-shell.portal-fold-safe .house-halo,
      .portal-shell.portal-fold-safe .film-halo,
      .portal-shell.portal-fold-safe .door-light,
      .portal-shell.portal-fold-safe .house-spark,
      .portal-shell.portal-fold-safe .showcase-spark,
      .portal-shell.portal-fold-safe .floating-media,
      .portal-shell.portal-fold-safe .smoke-puff {
        filter: none !important;
      }

      /*
       * Animate the OUTER scene instead.
       * Same living/moving feeling, safer compositor layer.
       */

      .portal-shell.portal-fold-safe
      .portal-choice-intake
      .choice-scene {
        animation:
          orovianFoldIntakeMotion
          22s
          ease-in-out
          infinite
          alternate !important;

        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        will-change: transform;
      }

      .portal-shell.portal-fold-safe
      .portal-choice-showcase
      .choice-scene {
        animation:
          orovianFoldShowcaseMotion
          23s
          ease-in-out
          infinite
          alternate !important;

        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        will-change: transform;
      }

      /*
       * Freeze the largest full-screen decorative animations.
       * They remain visible.
       */

      .portal-shell.portal-fold-safe .cinema-curtain,
      .portal-shell.portal-fold-safe .cinema-beam,
      .portal-shell.portal-fold-safe .cinema-ribbon,
      .portal-shell.portal-fold-safe .cinema-prism {
        animation-play-state: paused !important;
        will-change: auto !important;
      }

      /*
       * Grain animation can trigger frequent full-screen repaints.
       */

      .portal-shell.portal-fold-safe .cinema-grain {
        animation: none !important;
      }

      /*
       * Prevent Android touch from leaving desktop hover transforms
       * stuck after a tap.
       */

      .portal-shell.portal-fold-safe
      .portal-choice:hover
      .choice-backdrop,

      .portal-shell.portal-fold-safe
      .portal-choice:focus
      .choice-backdrop {
        transform: none;
      }

      @keyframes orovianFoldIntakeMotion {
        0% {
          transform: translate3d(-1.2%, 1%, 0);
        }

        33% {
          transform: translate3d(1.6%, -1%, 0);
        }

        66% {
          transform: translate3d(-0.8%, -1.5%, 0);
        }

        100% {
          transform: translate3d(1.4%, 0.8%, 0);
        }
      }

      @keyframes orovianFoldShowcaseMotion {
        0% {
          transform: translate3d(1.2%, -1%, 0);
        }

        33% {
          transform: translate3d(-1.6%, 1%, 0);
        }

        66% {
          transform: translate3d(0.8%, 1.5%, 0);
        }

        100% {
          transform: translate3d(-1.4%, -0.8%, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .portal-shell.portal-fold-safe .choice-scene {
          animation: none !important;
          transform: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const updateFoldSafeMode = () => {
    if (!shell) {
      return;
    }

    foldSafeMode =
      isAndroidTouchDevice() &&
      portalIsSideBySide();

    shell.classList.toggle(
      "portal-fold-safe",
      foldSafeMode
    );

    /*
     * Clear any desktop hover state Android may have remembered.
     */
    if (foldSafeMode) {
      delete shell.dataset.active;
    }
  };

  installFoldSafeCSS();

  /*
   * Wait until browser layout exists before measuring cards.
   */
  window.requestAnimationFrame(updateFoldSafeMode);

  /*
   * Re-check when the Fold opens/closes or browser dimensions change.
   */
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        updateFoldSafeMode();
      }, 150);
    },
    { passive: true }
  );

  window.addEventListener(
    "orientationchange",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        updateFoldSafeMode();
      }, 250);
    },
    { passive: true }
  );

  /*
   * ------------------------------------------------------------
   * YEAR
   * ------------------------------------------------------------
   */

  if (year) {
    year.textContent =
      String(new Date().getFullYear());
  }

  /*
   * ------------------------------------------------------------
   * ANALYTICS
   * ------------------------------------------------------------
   */

  const track = (eventName, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag(
        "event",
        eventName,
        parameters
      );
    }

    if (typeof window.fbq === "function") {
      window.fbq(
        "trackCustom",
        eventName,
        parameters
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * PORTAL DESTINATION HOVER / FOCUS
   * ------------------------------------------------------------
   */

  choices.forEach((choice) => {
    const destination =
      choice.dataset.portalDestination ||
      "unknown";

    const activate = () => {
      /*
       * Keep your existing expanding desktop cards.
       *
       * Do NOT activate desktop hover expansion on the Fold.
       */
      if (
        shell &&
        !foldSafeMode &&
        realHover.matches
      ) {
        shell.dataset.active = destination;
      }
    };

    const clear = () => {
      if (shell) {
        delete shell.dataset.active;
      }
    };

    choice.addEventListener(
      "pointerenter",
      activate
    );

    choice.addEventListener(
      "pointerleave",
      clear
    );

    choice.addEventListener(
      "focus",
      () => {
        /*
         * Keyboard focus still works on real desktop devices.
         */
        if (!foldSafeMode) {
          if (shell) {
            shell.dataset.active = destination;
          }
        }
      }
    );

    choice.addEventListener(
      "blur",
      clear
    );

    choice.addEventListener(
      "click",
      () => {
        clear();

        track(
          "portal_select",
          {
            event_category: "Navigation",
            destination
          }
        );
      }
    );
  });

  /*
   * ------------------------------------------------------------
   * SOCIAL LINKS
   * ------------------------------------------------------------
   */

  socialLinks.forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        track(
          "portal_social_click",
          {
            event_category: "Navigation",
            platform:
              link.dataset.social ||
              "unknown"
          }
        );
      }
    );
  });

  /*
   * ------------------------------------------------------------
   * CONTACT LINKS
   * ------------------------------------------------------------
   */

  contactLinks.forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        track(
          "portal_contact_click",
          {
            event_category: "Contact",
            method:
              link.dataset.contact ||
              "unknown"
          }
        );
      }
    );
  });

  /*
   * ------------------------------------------------------------
   * POINTER LIGHT EFFECT
   * ------------------------------------------------------------
   *
   * Desktop only.
   * Disabled in Fold-safe mode to avoid constant full-screen repaint.
   */

  if (shell) {
    let pointerFrame = 0;

    window.addEventListener(
      "pointermove",
      (event) => {
        if (
          foldSafeMode ||
          !realHover.matches ||
          pointerFrame
        ) {
          return;
        }

        pointerFrame =
          window.requestAnimationFrame(
            () => {
              shell.style.setProperty(
                "--pointer-x",
                `${
                  (
                    event.clientX /
                    window.innerWidth
                  ) * 100
                }%`
              );

              shell.style.setProperty(
                "--pointer-y",
                `${
                  (
                    event.clientY /
                    window.innerHeight
                  ) * 100
                }%`
              );

              pointerFrame = 0;
            }
          );
      },
      { passive: true }
    );
  }

  /*
   * ------------------------------------------------------------
   * CINEMA PRISMS
   * ------------------------------------------------------------
   *
   * This preserves the same prism system from your current portal.js.
   */

  if (
    prismLayer &&
    !reducedMotion.matches
  ) {
    const fragment =
      document.createDocumentFragment();

    const palettes = [
      [
        "rgba(255,214,107,.72)",
        "rgba(255,142,83,.12)"
      ],
      [
        "rgba(66,245,207,.62)",
        "rgba(49,217,255,.12)"
      ],
      [
        "rgba(165,118,255,.65)",
        "rgba(255,79,184,.12)"
      ],
      [
        "rgba(255,79,184,.55)",
        "rgba(255,214,107,.1)"
      ]
    ];

    for (
      let index = 0;
      index < 18;
      index += 1
    ) {
      const prism =
        document.createElement("i");

      const palette =
        palettes[
          index % palettes.length
        ];

      const size =
        9 + Math.random() * 22;

      prism.className =
        "cinema-prism";

      prism.style.setProperty(
        "--left",
        `${Math.random() * 100}%`
      );

      prism.style.setProperty(
        "--top",
        `${Math.random() * 100}%`
      );

      prism.style.setProperty(
        "--size",
        `${size}px`
      );

      prism.style.setProperty(
        "--opacity",
        String(
          .13 +
          Math.random() * .28
        )
      );

      prism.style.setProperty(
        "--color-a",
        palette[0]
      );

      prism.style.setProperty(
        "--color-b",
        palette[1]
      );

      prism.style.setProperty(
        "--duration",
        `${
          7 +
          Math.random() * 10
        }s`
      );

      prism.style.setProperty(
        "--delay",
        `${
          -Math.random() * 13
        }s`
      );

      prism.style.setProperty(
        "--drift-x",
        `${
          -36 +
          Math.random() * 72
        }px`
      );

      prism.style.setProperty(
        "--drift-y",
        `${
          -48 +
          Math.random() * 96
        }px`
      );

      prism.style.setProperty(
        "--rotate",
        `${
          Math.random() * 180
        }deg`
      );

      fragment.appendChild(prism);
    }

    prismLayer.appendChild(fragment);

    /*
     * Newly-created prisms appeared after our original Fold check.
     * Re-run it so their animation is immediately stabilized too.
     */
    window.requestAnimationFrame(
      updateFoldSafeMode
    );
  }
})();
