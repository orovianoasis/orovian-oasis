(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");
  const choices = Array.from(document.querySelectorAll("[data-portal-destination]"));

  if (!shell || !stage || choices.length < 2) return;

  let resizeFrame = 0;

  const isAndroidTouch = () =>
    /Android/i.test(navigator.userAgent || "") &&
    (navigator.maxTouchPoints || 0) > 0;

  const usesWideTwoColumnLayout = () => {
    const left = choices[0].getBoundingClientRect();
    const right = choices[1].getBoundingClientRect();

    return (
      left.width > 0 &&
      right.width > 0 &&
      Math.abs(left.top - right.top) < 18 &&
      Math.abs(left.left - right.left) > 48
    );
  };

  const syncWideTouchMode = () => {
    const enabled = isAndroidTouch() && usesWideTwoColumnLayout();

    shell.classList.toggle("portal-wide-touch", enabled);

    // A touch can leave Chrome's desktop-style :hover / active state stuck.
    // Clear only that temporary expansion state; links/clicks still work normally.
    if (enabled) delete shell.dataset.active;
  };

  const scheduleSync = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);

    resizeFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resizeFrame = 0;
        syncWideTouchMode();
      });
    });
  };

  // portal.js is loaded first, so these handlers run after its handlers and
  // immediately undo touch-generated desktop hover expansion on wide touch screens.
  choices.forEach((choice) => {
    choice.addEventListener("pointerenter", () => {
      if (shell.classList.contains("portal-wide-touch")) {
        delete shell.dataset.active;
      }
    });

    choice.addEventListener("focus", () => {
      if (shell.classList.contains("portal-wide-touch")) {
        delete shell.dataset.active;
      }
    });

    choice.addEventListener("pointerdown", () => {
      if (shell.classList.contains("portal-wide-touch")) {
        delete shell.dataset.active;
      }
    });
  });

  scheduleSync();

  window.addEventListener("resize", scheduleSync, { passive: true });
  window.addEventListener("orientationchange", scheduleSync, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleSync, { passive: true });
  }
})();
