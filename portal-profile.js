(() => {
  "use strict";

  const root = document.documentElement;
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const noHover = window.matchMedia("(hover: none)");
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  const viewport = () => {
    const vv = window.visualViewport;
    const width = Math.round((vv && vv.width) || window.innerWidth || root.clientWidth || 0);
    const height = Math.round((vv && vv.height) || window.innerHeight || root.clientHeight || 0);
    return { width, height };
  };

  const detect = () => {
    const { width, height } = viewport();
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    const aspect = shortSide > 0 ? longSide / shortSide : Infinity;
    const hasTouch = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
    const touchFirst = coarsePointer.matches || noHover.matches;
    const uaMobile = typeof navigator.userAgentData?.mobile === "boolean"
      ? navigator.userAgentData.mobile
      : /Mobi|Android.+Mobile/i.test(navigator.userAgent || "");

    // Compact, near-square, wide touch viewport = unfolded foldable profile.
    // Chromium's mobile hint helps distinguish an unfolded phone from a tablet;
    // geometry remains the fallback because browser/device reporting varies.
    const foldGeometry =
      shortSide >= 560 && shortSide <= 1000 &&
      longSide >= 720 && longSide <= 1500 &&
      aspect <= 1.6;
    const compactFoldFallback = longSide <= 1150 && aspect <= 1.5;

    if (hasTouch && foldGeometry && (touchFirst || !fineHover.matches) && (uaMobile || compactFoldFallback)) {
      return "fold-open";
    }

    // Closed foldables naturally land here because their short side is phone-sized.
    if (shortSide < 560 || (width <= 900 && height >= width)) {
      return "mobile";
    }

    // Touch-first, larger viewports that are not fold-like use the tablet profile.
    if (hasTouch && touchFirst && shortSide >= 560) {
      return "tablet";
    }

    return "desktop";
  };

  let current = "";

  const apply = () => {
    const next = detect();
    if (next === current) return next;

    const previous = current;
    current = next;
    root.dataset.portalProfile = next;

    window.dispatchEvent(new CustomEvent("orovian:profilechange", {
      detail: { profile: next, previous }
    }));

    return next;
  };

  window.OROVIAN_PORTAL_PROFILE = {
    detect,
    apply,
    get: () => current || apply()
  };

  apply();

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      apply();
      frame = 0;
    });
  };

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", schedule, { passive: true });
  }
})();
