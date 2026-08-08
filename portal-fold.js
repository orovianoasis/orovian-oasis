(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");
  const choices = Array.from(document.querySelectorAll("[data-portal-destination]"));

  if (!shell || !stage || choices.length < 2) return;

  let resizeTimer = 0;

  const isAndroidTouch = () =>
    /Android/i.test(navigator.userAgent || "") &&
    (navigator.maxTouchPoints || 0) > 0;

  const isSideBySide = () => {
    const left = choices[0].getBoundingClientRect();
    const right = choices[1].getBoundingClientRect();

    return (
      left.width > 0 &&
      right.width > 0 &&
      Math.abs(left.top - right.top) < 16 &&
      Math.abs(left.left - right.left) > 40
    );
  };

  const syncFoldMode = () => {
    const foldOpen = isAndroidTouch() && isSideBySide();
    shell.classList.toggle("fold-open-static-root", foldOpen);

    // Android touch can retain a desktop-style hover state.
    if (foldOpen) delete shell.dataset.active;
  };

  const scheduleSync = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncFoldMode, 140);
  };

  // Clear fake desktop hover after the original portal.js handlers run.
  choices.forEach((choice) => {
    choice.addEventListener("pointerenter", () => {
      if (shell.classList.contains("fold-open-static-root")) {
        delete shell.dataset.active;
      }
    });

    choice.addEventListener("focus", () => {
      if (shell.classList.contains("fold-open-static-root")) {
        delete shell.dataset.active;
      }
    });
  });

  requestAnimationFrame(syncFoldMode);
  window.addEventListener("resize", scheduleSync, { passive: true });
  window.addEventListener("orientationchange", scheduleSync, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleSync, { passive: true });
  }
})();
