(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");
  const prismLayer = document.getElementById("cinemaPrisms");
  const year = document.getElementById("portalYear");
  const choices = Array.from(document.querySelectorAll("[data-portal-destination]"));
  const socialLinks = document.querySelectorAll("[data-social]");
  const contactLinks = document.querySelectorAll("[data-contact]");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  let foldOpen = false;
  let resizeTimer = 0;

  const isAndroidTouch = () => {
    return /Android/i.test(navigator.userAgent || "") &&
      (navigator.maxTouchPoints || 0) > 0;
  };

  const isSideBySide = () => {
    if (!stage || choices.length < 2) return false;

    const first = choices[0].getBoundingClientRect();
    const second = choices[1].getBoundingClientRect();

    return (
      first.width > 0 &&
      second.width > 0 &&
      Math.abs(first.top - second.top) < 16 &&
      Math.abs(first.left - second.left) > 40
    );
  };

  const installFoldStyles = () => {
    if (document.getElementById("orovianFoldStableStyles")) return;

    const style = document.createElement("style");
    style.id = "orovianFoldStableStyles";

    style.textContent = `
      /*
       * IMPORTANT:
       * We do NOT override .scene-house, .scene-showcase,
       * or .choice-scene animation/transform behavior.
       *
       * The original artwork motion remains intact.
       */

      .portal-shell.fold-open-stable .choice-scene,
      .portal-shell.fold-open-stable .scene-house,
      .portal-shell.fold-open-stable .scene-showcase {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      /*
       * Keep all SVG animations.
       * Remove only the expensive outer moving drop-shadow.
       */
      .portal-shell.fold-open-stable .choice-scene svg {
        filter: none !important;
      }

      /*
       * These elements still animate.
       * Only their live SVG blur/filter is removed.
       */
      .portal-shell.fold-open-stable .house-halo,
      .portal-shell.fold-open-stable .film-halo,
      .portal-shell.fold-open-stable .door-light,
      .portal-shell.fold-open-stable .house-spark,
      .portal-shell.fold-open-stable .showcase-spark,
      .portal-shell.fold-open-stable .smoke-puff {
        filter: none !important;
      }

      .portal-shell.fold-open-stable .house-halo,
      .portal-shell.fold-open-stable .film-halo {
        opacity: .20 !important;
      }

      /*
       * Beams still sweep.
       * Remove live blur + screen blending on Fold only.
       */
      .portal-shell.fold-open-stable .cinema-beam {
        filter: none !important;
        mix-blend-mode: normal !important;
        opacity: .10;
      }

      /*
       * Ribbons still move.
       */
      .portal-shell.fold-open-stable .cinema-ribbon {
        filter: none !important;
        box-shadow: 0 0 14px currentColor;
      }

      /*
       * Curtains still breathe.
       */
      .portal-shell.fold-open-stable .cinema-curtain {
        filter: none !important;
      }

      /*
       * Prisms still float.
       * Box shadow replaces GPU drop-shadow.
       */
      .portal-shell.fold-open-stable .cinema-prism {
        filter: none !important;
        box-shadow: 0 0 9px var(--color-a);
      }

      /*
       * Keep animated grain,
       * but replace SVG feTurbulence with lightweight CSS grain.
       */
      .portal-shell.fold-open-stable .cinema-grain {
        background-image:
          radial-gradient(
            circle,
            rgba(255,255,255,.30) 0 .45px,
            transparent .65px
          ),
          radial-gradient(
            circle,
            rgba(255,255,255,.18) 0 .40px,
            transparent .60px
          ) !important;

        background-position:
          0 0,
          3px 4px;

        background-size:
          5px 5px,
          8px 8px;

        mix-blend-mode: normal !important;
        opacity: .035 !important;

        animation:
          foldGrainMove
          .42s
          steps(2)
          infinite !important;
      }

      @keyframes foldGrainMove {
        0% {
          transform: translate3d(0,0,0);
        }

        25% {
          transform: translate3d(-4px,3px,0);
        }

        50% {
          transform: translate3d(3px,-4px,0);
        }

        75% {
          transform: translate3d(4px,3px,0);
        }

        100% {
          transform: translate3d(-3px,-3px,0);
        }
      }

      /*
       * Backdrop blur repeatedly samples everything moving behind it.
       * Replace only that blur on Fold-open.
       */
      .portal-shell.fold-open-stable .portal-header {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;

        background:
          linear-gradient(
            180deg,
            rgba(3,2,6,.97),
            rgba(3,2,6,.70)
          ) !important;
      }

      .portal-shell.fold-open-stable .portal-footer {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;

        background:
          linear-gradient(
            180deg,
            rgba(5,3,8,.88),
            rgba(3,2,6,.98)
          ) !important;
      }

      .portal-shell.fold-open-stable .choice-button,
      .portal-shell.fold-open-stable .portal-center-mark b {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      /*
       * Keep the text halo,
       * but remove the blur operation itself.
       */
      .portal-shell.fold-open-stable .choice-copy::before {
        filter: none !important;
      }
    `;

    document.head.appendChild(style);
  };

  const syncFoldMode = () => {
    if (!shell) return;

    foldOpen =
      isAndroidTouch() &&
      isSideBySide();

    shell.classList.toggle(
      "fold-open-stable",
      foldOpen
    );

    if (foldOpen) {
      delete shell.dataset.active;
    }
  };

  const scheduleFoldCheck = () => {
    clearTimeout(resizeTimer);

    resizeTimer =
      setTimeout(
        syncFoldMode,
        140
      );
  };

  installFoldStyles();

  requestAnimationFrame(
    syncFoldMode
  );

  window.addEventListener(
    "resize",
    scheduleFoldCheck,
    { passive: true }
  );

  window.addEventListener(
    "orientationchange",
    scheduleFoldCheck,
    { passive: true }
  );

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      scheduleFoldCheck,
      { passive: true }
    );
  }

  if (year) {
    year.textContent =
      String(new Date().getFullYear());
  }

  const track = (
    eventName,
    parameters = {}
  ) => {
    if (
      typeof window.gtag === "function"
    ) {
      window.gtag(
        "event",
        eventName,
        parameters
      );
    }

    if (
      typeof window.fbq === "function"
    ) {
      window.fbq(
        "trackCustom",
        eventName,
        parameters
      );
    }
  };

  choices.forEach((choice) => {
    const destination =
      choice.dataset.portalDestination ||
      "unknown";

    const activate = () => {
      if (
        shell &&
        !foldOpen
      ) {
        shell.dataset.active =
          destination;
      }
    };

    const clear = () => {
      if (shell) {
        delete shell.dataset.active;
      }
    };

    choice.addEventListener(
      "pointerenter",
      () => {
        if (
          finePointer.matches
        ) {
          activate();
        }
      }
    );

    choice.addEventListener(
      "pointerleave",
      clear
    );

    choice.addEventListener(
      "focus",
      () => {
        if (!foldOpen) {
          activate();
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
            event_category:
              "Navigation",
            destination
          }
        );
      }
    );
  });

  socialLinks.forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        track(
          "portal_social_click",
          {
            event_category:
              "Navigation",

            platform:
              link.dataset.social ||
              "unknown"
          }
        );
      }
    );
  });

  contactLinks.forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        track(
          "portal_contact_click",
          {
            event_category:
              "Contact",

            method:
              link.dataset.contact ||
              "unknown"
          }
        );
      }
    );
  });

  /*
   * Pointer glow stays unchanged on real desktop.
   * Fold-open doesn't need mouse-follow behavior.
   */
  if (
    shell &&
    finePointer.matches
  ) {
    let frame = 0;

    window.addEventListener(
      "pointermove",
      (event) => {
        if (
          foldOpen ||
          frame
        ) {
          return;
        }

        frame =
          requestAnimationFrame(
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

              frame = 0;
            }
          );
      },
      { passive: true }
    );
  }

  /*
   * Original prism generation preserved.
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
          index %
          palettes.length
        ];

      const size =
        9 +
        Math.random() * 22;

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

      fragment.appendChild(
        prism
      );
    }

    prismLayer.appendChild(
      fragment
    );
  }
})();
