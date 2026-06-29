// Optional dynamic enhancements for Orovian Oasis.
// This file is safe to delete. The main website does not depend on it.

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("enhancements-ready");

  if (reduceMotion) return;

  let frame = null;

  function updateGlow(event) {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      const x = Math.round((event.clientX / window.innerWidth) * 100);
      const y = Math.round((event.clientY / window.innerHeight) * 100);

      document.body.style.setProperty("--glow-x", `${x}%`);
      document.body.style.setProperty("--glow-y", `${y}%`);
    });
  }

  window.addEventListener("pointermove", updateGlow, { passive: true });
})();
