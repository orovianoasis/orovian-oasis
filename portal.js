(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");
  const prismLayer = document.getElementById("cinemaPrisms");
  const year = document.getElementById("portalYear");
  const choices = Array.from(document.querySelectorAll("[data-portal-destination]"));
  const socialLinks = document.querySelectorAll("[data-social]");
  const contactLinks = document.querySelectorAll("[data-contact]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let foldOpen = false;
  let resizeTimer = 0;

  const isAndroidTouch = () =>
    /Android/i.test(navigator.userAgent || "") &&
    (navigator.maxTouchPoints || 0) > 0;

  const isSideBySide = () => {
    if (!stage || choices.length < 2) return false;

    const left = choices[0].getBoundingClientRect();
    const right = choices[1].getBoundingClientRect();

    return (
      left.width > 0 &&
      right.width > 0 &&
      Math.abs(left.top - right.top) < 16 &&
      Math.abs(left.left - right.left) > 40
    );
  };

  const style = document.createElement("style");
  style.id = "orovianFoldRenderingProfile";

  style.textContent = `
    /*
      ONLY activates on:
      Android + touch + actual side-by-side portal layout.
    */

    .portal-shell.is-fold-open .cinema-world,
    .portal-shell.is-fold-open .portal-choice,
    .portal-shell.is-fold-open .choice-scene {
      isolation: isolate;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

    .portal-shell.is-fold-open .cinema-world {
      contain: paint;
    }

    .portal-shell.is-fold-open .portal-choice {
      contain: layout paint style;
    }

    /*
      Do not move the filtered SVG root itself.
      Keep everything inside the SVG animated,
      but move the scene canvas instead.
    */

    .portal-shell.is-fold-open .scene-house,
    .portal-shell.is-fold-open .scene-showcase {
      animation: none !important;
      transform: none !important;
      will-change: auto !important;
    }

    .portal-shell.is-fold-open .choice-scene {
      contain: layout paint style;
      transform: translate3d(0, 0, 0);
      will-change: transform;
    }

    .portal-shell.is-fold-open
    .portal-choice-intake
    .choice-scene {
      animation:
        foldHouseRoam
        14s
        ease-in-out
        infinite
        alternate !important;
    }

    .portal-shell.is-fold-open
    .portal-choice-showcase
    .choice-scene {
      animation:
        foldShowcaseRoam
        16s
        ease-in-out
        infinite
        alternate !important;
    }

    /*
      Keep these animations moving.
      Only remove their expensive live blur filters.
    */

    .portal-shell.is-fold-open .cinema-beam {
      filter: none !important;
    }

    .portal-shell.is-fold-open .cinema-ribbon {
      filter: none !important;
      box-shadow: 0 0 16px currentColor;
    }

    .portal-shell.is-fold-open .cinema-prism {
      filter: none !important;
      box-shadow: 0 0 9px var(--color-a);
    }

    /*
      Original grain uses a full-screen animated SVG
      feTurbulence filter.

      Keep animated grain, but use lightweight CSS
      texture only on the unfolded Fold.
    */

    .portal-shell.is-fold-open .cinema-grain {
      background-image:
        radial-gradient(
          circle at 20% 25%,
          rgba(255,255,255,.34) 0 .55px,
          transparent .75px
        ),
        radial-gradient(
          circle at 70% 65%,
          rgba(255,255,255,.24) 0 .45px,
          transparent .70px
        ),
        radial-gradient(
          circle at 45% 80%,
          rgba(255,255,255,.18) 0 .40px,
          transparent .65px
        ) !important;

      background-size:
        4px 4px,
        7px 7px,
        9px 9px !important;

      mix-blend-mode: screen;
      will-change: transform;
    }

    /*
      Prevent Chrome from constantly re-blurring
      the moving page underneath the header.
    */

    .portal-shell.is-fold-open .portal-header {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;

      background:
        linear-gradient(
          180deg,
          rgba(3,2,6,.98),
          rgba(3,2,6,.78)
        ) !important;
    }

    /*
      The text glow remains because the radial
      gradient already creates it.
    */

    .portal-shell.is-fold-open .choice-copy::before {
      filter: none !important;
    }

    /*
      Fold versions of the SAME roaming motions.
      Movement stays, but occurs on the scene layer.
    */

    @keyframes foldHouseRoam {
      0% {
        transform:
          translate3d(-8%, 5%, 0)
          rotate(-1.2deg)
          scale(1.10);
      }

      28% {
        transform:
          translate3d(5%, -4%, 0)
          rotate(.8deg)
          scale(1.15);
      }

      57% {
        transform:
          translate3d(-3%, -7%, 0)
          rotate(-.55deg)
          scale(1.12);
      }

      78% {
        transform:
          translate3d(8%, 2%, 0)
          rotate(1.1deg)
          scale(1.16);
      }

      100% {
        transform:
          translate3d(-1%, 6%, 0)
          rotate(-.35deg)
          scale(1.11);
      }
    }

    @keyframes foldShowcaseRoam {
      0% {
        transform:
          translate3d(8%, -5%, 0)
          rotate(1.2deg)
          scale(1.11);
      }

      27% {
        transform:
          translate3d(-5%, 4%, 0)
          rotate(-.85deg)
          scale(1.16);
      }

      54% {
        transform:
          translate3d(3%, 7%, 0)
          rotate(.55deg)
          scale(1.13);
      }

      79% {
        transform:
          translate3d(-8%, -2%, 0)
          rotate(-1.15deg)
          scale(1.17);
      }

      100% {
        transform:
          translate3d(1%, -6%, 0)
          rotate(.35deg)
          scale(1.12);
      }
    }
  `;

  document.head.appendChild(style);

  const syncFoldMode = () => {
    if (!shell) return;

    foldOpen =
      isAndroidTouch() &&
      isSideBySide();

    shell.classList.toggle(
      "is-fold-open",
      foldOpen
    );

    /*
      Touch devices can leave a fake hover state.
      Clear only the desktop expansion state.
    */

    if (foldOpen) {
      delete shell.dataset.active;
    }
  };

  const scheduleFoldCheck = () => {
    clearTimeout(resizeTimer);

    resizeTimer =
      setTimeout(syncFoldMode, 140);
  };

  requestAnimationFrame(syncFoldMode);

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
      /*
        Desktop keeps normal hover expansion.

        Fold-open touch mode does not trigger
        a fake hover/grid resize.
      */

      if (
        shell &&
        !foldOpen &&
        finePointer.matches
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
      activate
    );

    choice.addEventListener(
      "pointerleave",
      clear
    );

    choice.addEventListener(
      "focus",
      () => {
        if (
          shell &&
          !foldOpen
        ) {
          shell.dataset.active =
            destination;
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
    Pointer-follow lighting remains desktop-only.
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
                    innerWidth
                  ) * 100
                }%`
              );

              shell.style.setProperty(
                "--pointer-y",
                `${
                  (
                    event.clientY /
                    innerHeight
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
    Original prism generation preserved.
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
