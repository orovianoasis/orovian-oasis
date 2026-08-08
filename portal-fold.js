(() => {
  "use strict";

  const shell = document.getElementById("portalShell");
  const stage = document.querySelector(".portal-stage");

  const intakeScene =
    document.querySelector(
      ".portal-choice-intake .choice-scene"
    );

  const showcaseScene =
    document.querySelector(
      ".portal-choice-showcase .choice-scene"
    );

  const choices = Array.from(
    document.querySelectorAll(
      "[data-portal-destination]"
    )
  );

  if (
    !shell ||
    !stage ||
    !intakeScene ||
    !showcaseScene ||
    choices.length < 2
  ) {
    return;
  }

  let foldMode = false;
  let animationFrame = 0;
  let resizeTimer = 0;
  let lastPaint = 0;

  /* =====================================================
     FOLD DETECTION
     ===================================================== */

  const isAndroidTouch = () => {
    return (
      /Android/i.test(
        navigator.userAgent || ""
      ) &&
      (navigator.maxTouchPoints || 0) > 0
    );
  };

  const isSideBySidePortal = () => {
    const left =
      choices[0].getBoundingClientRect();

    const right =
      choices[1].getBoundingClientRect();

    return (
      left.width > 0 &&
      right.width > 0 &&
      Math.abs(
        left.top - right.top
      ) < 16 &&
      Math.abs(
        left.left - right.left
      ) > 40
    );
  };

  /* =====================================================
     FOLD-ONLY CANVAS LAYER
     ===================================================== */

  const style =
    document.createElement("style");

  style.id =
    "orovianFoldCanvasStyles";

  style.textContent = `
    /*
      These rules activate ONLY when the unfolded
      Android Fold is using the two-column layout.
    */

    .portal-shell.fold-canvas-mode
    .choice-scene > svg,
    .portal-shell.fold-canvas-mode
    .choice-scene > svg * {
      animation: none !important;
      transform: none !important;
      filter: none !important;
      will-change: auto !important;
    }

    .portal-shell.fold-canvas-mode
    .choice-scene > svg {
      visibility: hidden !important;
    }

    .fold-scene-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: none;
      pointer-events: none;
    }

    .portal-shell.fold-canvas-mode
    .fold-scene-canvas {
      display: block;
    }
  `;

  document.head.appendChild(style);

  const createCanvas = (
    scene,
    className
  ) => {
    const canvas =
      document.createElement("canvas");

    canvas.className =
      "fold-scene-canvas " +
      className;

    canvas.setAttribute(
      "aria-hidden",
      "true"
    );

    scene.appendChild(canvas);

    return canvas;
  };

  const houseCanvas =
    createCanvas(
      intakeScene,
      "fold-house-canvas"
    );

  const showcaseCanvas =
    createCanvas(
      showcaseScene,
      "fold-showcase-canvas"
    );

  const setupCanvas = (
    canvas
  ) => {
    const rect =
      canvas.getBoundingClientRect();

    if (
      rect.width < 2 ||
      rect.height < 2
    ) {
      return null;
    }

    /*
      Cap pixel density so the Fold does not
      rasterize enormous frames every refresh.
    */

    const dpr =
      Math.min(
        window.devicePixelRatio || 1,
        1.75
      );

    const pixelWidth =
      Math.round(
        rect.width * dpr
      );

    const pixelHeight =
      Math.round(
        rect.height * dpr
      );

    if (
      canvas.width !== pixelWidth ||
      canvas.height !== pixelHeight
    ) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const ctx =
      canvas.getContext(
        "2d",
        {
          alpha: true,
          desynchronized: true
        }
      );

    if (!ctx) {
      return null;
    }

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    return {
      ctx,
      width: rect.width,
      height: rect.height
    };
  };

  /* =====================================================
     ANIMATION HELPERS
     ===================================================== */

  const clamp = (
    value,
    min = 0,
    max = 1
  ) =>
    Math.max(
      min,
      Math.min(max, value)
    );

  const lerp = (
    a,
    b,
    amount
  ) =>
    a + (b - a) * amount;

  const ease = (
    value
  ) =>
    0.5 -
    0.5 *
      Math.cos(
        Math.PI *
        clamp(value)
      );

  const pingPong = (
    seconds,
    duration
  ) => {
    let progress =
      (seconds / duration) % 2;

    if (progress > 1) {
      progress =
        2 - progress;
    }

    return progress;
  };

  const sampleKeyframes = (
    keyframes,
    progress
  ) => {
    let index = 0;

    while (
      index <
        keyframes.length - 2 &&
      progress >
        keyframes[index + 1].p
    ) {
      index += 1;
    }

    const start =
      keyframes[index];

    const end =
      keyframes[index + 1];

    const localProgress =
      ease(
        (
          progress -
          start.p
        ) /
        Math.max(
          0.0001,
          end.p - start.p
        )
      );

    return {
      x: lerp(
        start.x,
        end.x,
        localProgress
      ),

      y: lerp(
        start.y,
        end.y,
        localProgress
      ),

      rotation: lerp(
        start.rotation,
        end.rotation,
        localProgress
      ),

      scale: lerp(
        start.scale,
        end.scale,
        localProgress
      )
    };
  };

  /* =====================================================
     ORIGINAL DESKTOP ROAM MOTION
     ===================================================== */

  const houseMotion = [
    {
      p: 0,
      x: -18,
      y: 10,
      rotation: -1.2,
      scale: 1.10
    },
    {
      p: 0.28,
      x: 11,
      y: -8,
      rotation: 0.8,
      scale: 1.15
    },
    {
      p: 0.57,
      x: -7,
      y: -13,
      rotation: -0.55,
      scale: 1.12
    },
    {
      p: 0.78,
      x: 18,
      y: 3,
      rotation: 1.1,
      scale: 1.16
    },
    {
      p: 1,
      x: -3,
      y: 12,
      rotation: -0.35,
      scale: 1.11
    }
  ];

  const showcaseMotion = [
    {
      p: 0,
      x: 17,
      y: -11,
      rotation: 1.2,
      scale: 1.11
    },
    {
      p: 0.27,
      x: -12,
      y: 7,
      rotation: -0.85,
      scale: 1.16
    },
    {
      p: 0.54,
      x: 7,
      y: 13,
      rotation: 0.55,
      scale: 1.13
    },
    {
      p: 0.79,
      x: -18,
      y: -3,
      rotation: -1.15,
      scale: 1.17
    },
    {
      p: 1,
      x: 3,
      y: -12,
      rotation: 0.35,
      scale: 1.12
    }
  ];

  /* =====================================================
     VECTOR PATHS
     ===================================================== */

  const paths = {
    contourOne:
      new Path2D(
        "M-15 244C77 190 132 266 222 209s158-87 310-10"
      ),

    contourTwo:
      new Path2D(
        "M-26 277c112-68 175 13 269-45s190-64 314-10"
      ),

    contourThree:
      new Path2D(
        "M-10 304c94-42 181 4 270-43s160-50 278-17"
      ),

    house:
      new Path2D(
        "M112 153 259 43l149 110v134H112Z"
      ),

    roof:
      new Path2D(
        "M72 174 259 33l190 141"
      ),

    chimney:
      new Path2D(
        "M306 78V35h52v82"
      ),

    houseDoor:
      new Path2D(
        "M226 287V187h68v100"
      ),

    door:
      new Path2D(
        "M236 276v-79h48v79Z"
      ),

    filmFrame:
      new Path2D(
        "M79 64h362v211H79Z"
      ),

    filmBars:
      new Path2D(
        "M79 102h362M79 237h362"
      ),

    filmTicks:
      new Path2D(
        "M109 64v38m42-38v38m42-38v38m42-38v38m42-38v38m42-38v38m42-38v38M109 237v38m42-38v38m42-38v38m42-38v38m42-38v38m42-38v38m42-38v38"
      ),

    prism:
      new Path2D(
        "M260 110 338 213H182Z"
      ),

    rayOne:
      new Path2D(
        "M260 110 416 152"
      ),

    rayTwo:
      new Path2D(
        "M260 110 397 210"
      ),

    rayThree:
      new Path2D(
        "M260 110 365 258"
      )
  };

  /* =====================================================
     SHARED DRAWING FUNCTIONS
     ===================================================== */

  const applySceneTransform = (
    ctx,
    width,
    height,
    state
  ) => {
    /*
      This matches the approximate 720px max SVG
      size used by your tablet/desktop CSS.
    */

    const baseScale =
      Math.min(
        (
          width * 0.90
        ) / 520,

        (
          height * 0.90
        ) / 320,

        720 / 520
      );

    ctx.translate(
      width / 2 +
        state.x *
          0.01 *
          520 *
          baseScale,

      height / 2 +
        state.y *
          0.01 *
          320 *
          baseScale
    );

    ctx.rotate(
      state.rotation *
        Math.PI /
        180
    );

    ctx.scale(
      baseScale *
        state.scale,

      baseScale *
        state.scale
    );

    ctx.translate(
      -260,
      -160
    );
  };

  const makeHouseGradient = (
    ctx
  ) => {
    const gradient =
      ctx.createLinearGradient(
        70,
        0,
        450,
        0
      );

    gradient.addColorStop(
      0,
      "#ffd66b"
    );

    gradient.addColorStop(
      0.52,
      "#ff8e53"
    );

    gradient.addColorStop(
      1,
      "#42f5cf"
    );

    return gradient;
  };

  const makeShowcaseGradient = (
    ctx
  ) => {
    const gradient =
      ctx.createLinearGradient(
        80,
        290,
        450,
        40
      );

    gradient.addColorStop(
      0,
      "#31d9ff"
    );

    gradient.addColorStop(
      0.5,
      "#a576ff"
    );

    gradient.addColorStop(
      1,
      "#ff4fb8"
    );

    return gradient;
  };

  const drawStroke = (
    ctx,
    path,
    color,
    width,
    opacity,
    glow = 0
  ) => {
    ctx.save();

    ctx.strokeStyle =
      color;

    ctx.lineWidth =
      width;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";

    ctx.globalAlpha =
      opacity;

    if (glow > 0) {
      ctx.shadowColor =
        typeof color ===
        "string"
          ? color
          : "#ffffff";

      ctx.shadowBlur =
        glow;
    }

    ctx.stroke(path);

    ctx.restore();
  };

  const drawSpark = (
    ctx,
    x,
    y,
    color,
    seconds,
    delay,
    radius
  ) => {
    const wave =
      0.5 +
      0.5 *
        Math.sin(
          (
            seconds +
            delay
          ) *
          Math.PI *
          2 /
          3.6
        );

    const size =
      radius *
      (
        0.72 +
        wave * 0.42
      );

    ctx.save();

    ctx.globalAlpha =
      0.55 +
      wave * 0.35;

    ctx.fillStyle =
      color;

    ctx.shadowColor =
      color;

    ctx.shadowBlur =
      10;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      size,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  };

  /* =====================================================
     HOUSE SMOKE
     ===================================================== */

  const drawSmoke = (
    ctx,
    seconds,
    delay,
    x,
    y,
    radius
  ) => {
    let progress =
      (
        (
          seconds +
          delay
        ) /
        5.8
      ) % 1;

    if (progress < 0) {
      progress += 1;
    }

    const offsetX =
      lerp(
        0,
        20,
        progress
      );

    const offsetY =
      lerp(
        10,
        -48,
        progress
      );

    const scale =
      lerp(
        0.55,
        1.65,
        progress
      );

    let opacity;

    if (progress < 0.12) {
      opacity = 0;
    }

    else if (
      progress < 0.28
    ) {
      opacity =
        lerp(
          0,
          0.8,
          (
            progress -
            0.12
          ) /
          0.16
        );
    }

    else if (
      progress < 0.72
    ) {
      opacity =
        lerp(
          0.8,
          0.34,
          (
            progress -
            0.28
          ) /
          0.44
        );
    }

    else {
      opacity =
        lerp(
          0.34,
          0,
          (
            progress -
            0.72
          ) /
          0.28
        );
    }

    ctx.save();

    ctx.globalAlpha =
      opacity * 0.72;

    ctx.fillStyle =
      "rgba(255,239,203,.22)";

    ctx.strokeStyle =
      "rgba(255,214,107,.28)";

    ctx.lineWidth =
      1.5;

    ctx.shadowColor =
      "rgba(255,214,107,.25)";

    ctx.shadowBlur =
      7;

    ctx.beginPath();

    ctx.arc(
      x + offsetX,
      y + offsetY,
      radius * scale,
      0,
      Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  /* =====================================================
     HOUSE DRAW
     ===================================================== */

  const drawHouse = (
    seconds
  ) => {
    const setup =
      setupCanvas(
        houseCanvas
      );

    if (!setup) {
      return;
    }

    const {
      ctx,
      width,
      height
    } = setup;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    ctx.save();

    const state =
      sampleKeyframes(
        houseMotion,
        pingPong(
          seconds,
          14
        )
      );

    applySceneTransform(
      ctx,
      width,
      height,
      state
    );

    const gradient =
      makeHouseGradient(ctx);

    /*
      Moving contour trails.
    */

    ctx.save();

    ctx.setLineDash([
      12,
      10
    ]);

    ctx.lineDashOffset =
      -(
        seconds *
        34 %
        220
      );

    drawStroke(
      ctx,
      paths.contourOne,
      gradient,
      2,
      0.28
    );

    ctx.lineDashOffset *=
      -0.75;

    drawStroke(
      ctx,
      paths.contourTwo,
      gradient,
      2,
      0.20
    );

    ctx.lineDashOffset *=
      -0.70;

    drawStroke(
      ctx,
      paths.contourThree,
      gradient,
      2,
      0.13
    );

    ctx.restore();

    /*
      House glow and outlines.
    */

    drawStroke(
      ctx,
      paths.house,
      gradient,
      17,
      0.10,
      18
    );

    drawStroke(
      ctx,
      paths.house,
      gradient,
      4.2,
      0.94,
      8
    );

    drawStroke(
      ctx,
      paths.roof,
      gradient,
      4.2,
      0.94,
      8
    );

    drawStroke(
      ctx,
      paths.chimney,
      gradient,
      4.2,
      0.94,
      8
    );

    drawStroke(
      ctx,
      paths.houseDoor,
      gradient,
      5,
      0.92,
      8
    );

    /*
      Door illumination.
    */

    ctx.save();

    ctx.globalAlpha =
      0.20 +
      0.08 *
        Math.sin(
          seconds * 1.7
        );

    ctx.fillStyle =
      gradient;

    ctx.shadowColor =
      "#ffd66b";

    ctx.shadowBlur =
      16;

    ctx.fill(
      paths.door
    );

    ctx.restore();

    /*
      Knob.
    */

    ctx.save();

    ctx.fillStyle =
      "#fff1bd";

    ctx.shadowColor =
      "#ffd66b";

    ctx.shadowBlur =
      8;

    ctx.beginPath();

    ctx.arc(
      276,
      237,
      3.5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    /*
      Smoke.
    */

    drawSmoke(
      ctx,
      seconds,
      0,
      331,
      24,
      9
    );

    drawSmoke(
      ctx,
      seconds,
      1.9,
      343,
      8,
      12
    );

    drawSmoke(
      ctx,
      seconds,
      3.8,
      326,
      -10,
      15
    );

    /*
      House sparks.
    */

    drawSpark(
      ctx,
      99,
      89,
      "#ffd66b",
      seconds,
      0,
      4
    );

    drawSpark(
      ctx,
      427,
      74,
      "#ffd66b",
      seconds,
      1.2,
      3
    );

    drawSpark(
      ctx,
      445,
      228,
      "#ffd66b",
      seconds,
      2.4,
      5
    );

    ctx.restore();
  };

  /* =====================================================
     FLOATING SHOWCASE CARDS
     ===================================================== */

  const getMediaState = (
    seconds,
    delay
  ) => {
    let progress =
      (
        (
          seconds +
          delay
        ) /
        7
      ) % 1;

    if (progress < 0) {
      progress += 1;
    }

    const frames = [
      {
        p: 0,
        x: -24,
        y: 16,
        rotation: -3,
        scale: 1.04,
        opacity: 0.58
      },
      {
        p: 0.34,
        x: 28,
        y: -24,
        rotation: 2,
        scale: 1.15,
        opacity: 0.94
      },
      {
        p: 0.68,
        x: -20,
        y: -12,
        rotation: 3,
        scale: 1.09,
        opacity: 0.76
      },
      {
        p: 1,
        x: -24,
        y: 16,
        rotation: -3,
        scale: 1.04,
        opacity: 0.58
      }
    ];

    let index = 0;

    while (
      index <
        frames.length - 2 &&
      progress >
        frames[index + 1].p
    ) {
      index += 1;
    }

    const start =
      frames[index];

    const end =
      frames[index + 1];

    const amount =
      ease(
        (
          progress -
          start.p
        ) /
        Math.max(
          0.001,
          end.p - start.p
        )
      );

    return {
      x: lerp(
        start.x,
        end.x,
        amount
      ),

      y: lerp(
        start.y,
        end.y,
        amount
      ),

      rotation: lerp(
        start.rotation,
        end.rotation,
        amount
      ),

      scale: lerp(
        start.scale,
        end.scale,
        amount
      ),

      opacity: lerp(
        start.opacity,
        end.opacity,
        amount
      )
    };
  };

  const drawMediaCard = (
    ctx,
    gradient,
    type,
    seconds,
    delay
  ) => {
    const motion =
      getMediaState(
        seconds,
        delay
      );

    const centers = {
      1: [100, 162],
      2: [417, 87],
      3: [404, 253]
    };

    const [
      centerX,
      centerY
    ] =
      centers[type];

    ctx.save();

    ctx.translate(
      centerX +
        motion.x,

      centerY +
        motion.y
    );

    ctx.rotate(
      motion.rotation *
        Math.PI /
        180
    );

    ctx.scale(
      motion.scale,
      motion.scale
    );

    ctx.translate(
      -centerX,
      -centerY
    );

    ctx.globalAlpha =
      motion.opacity;

    ctx.strokeStyle =
      gradient;

    ctx.fillStyle =
      "rgba(7,8,18,.66)";

    ctx.lineWidth =
      2;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";

    ctx.shadowColor =
      "#31d9ff";

    ctx.shadowBlur =
      8;

    if (type === 1) {
      ctx.beginPath();

      ctx.roundRect(
        42,
        126,
        116,
        72,
        10
      );

      ctx.fill();
      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        58,
        145
      );

      ctx.lineTo(
        116,
        145
      );

      ctx.moveTo(
        58,
        160
      );

      ctx.lineTo(
        138,
        160
      );

      ctx.moveTo(
        58,
        176
      );

      ctx.lineTo(
        103,
        176
      );

      ctx.stroke();
    }

    if (type === 2) {
      ctx.beginPath();

      ctx.roundRect(
        354,
        48,
        126,
        78,
        10
      );

      ctx.fill();
      ctx.stroke();

      ctx.beginPath();

      ctx.arc(
        383,
        76,
        11,
        0,
        Math.PI * 2
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        405,
        68
      );

      ctx.lineTo(
        455,
        68
      );

      ctx.moveTo(
        405,
        84
      );

      ctx.lineTo(
        441,
        84
      );

      ctx.moveTo(
        373,
        106
      );

      ctx.lineTo(
        455,
        106
      );

      ctx.stroke();
    }

    if (type === 3) {
      ctx.beginPath();

      ctx.roundRect(
        338,
        218,
        132,
        70,
        10
      );

      ctx.fill();
      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        356,
        270
      );

      ctx.lineTo(
        386,
        238
      );

      ctx.lineTo(
        408,
        260
      );

      ctx.lineTo(
        426,
        244
      );

      ctx.lineTo(
        452,
        270
      );

      ctx.stroke();
    }

    ctx.restore();
  };

  /* =====================================================
     SHOWCASE DRAW
     ===================================================== */

  const drawShowcase = (
    seconds
  ) => {
    const setup =
      setupCanvas(
        showcaseCanvas
      );

    if (!setup) {
      return;
    }

    const {
      ctx,
      width,
      height
    } = setup;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    ctx.save();

    const state =
      sampleKeyframes(
        showcaseMotion,
        pingPong(
          seconds,
          16
        )
      );

    applySceneTransform(
      ctx,
      width,
      height,
      state
    );

    const gradient =
      makeShowcaseGradient(
        ctx
      );

    /*
      Film frame.
    */

    drawStroke(
      ctx,
      paths.filmFrame,
      gradient,
      18,
      0.10,
      18
    );

    drawStroke(
      ctx,
      paths.filmFrame,
      gradient,
      4.2,
      0.94,
      8
    );

    drawStroke(
      ctx,
      paths.filmBars,
      gradient,
      4.2,
      0.94,
      8
    );

    drawStroke(
      ctx,
      paths.filmTicks,
      gradient,
      3,
      0.74,
      5
    );

    /*
      Floating media.
    */

    drawMediaCard(
      ctx,
      gradient,
      1,
      seconds,
      0
    );

    drawMediaCard(
      ctx,
      gradient,
      2,
      seconds,
      2.3
    );

    drawMediaCard(
      ctx,
      gradient,
      3,
      seconds,
      4.6
    );

    /*
      Prism.
    */

    ctx.save();

    ctx.fillStyle =
      "rgba(165,118,255,.08)";

    ctx.fill(
      paths.prism
    );

    ctx.restore();

    drawStroke(
      ctx,
      paths.prism,
      gradient,
      5,
      0.94,
      9
    );

    drawStroke(
      ctx,
      paths.rayOne,
      gradient,
      3,
      0.72,
      6
    );

    drawStroke(
      ctx,
      paths.rayTwo,
      gradient,
      3,
      0.72,
      6
    );

    drawStroke(
      ctx,
      paths.rayThree,
      gradient,
      3,
      0.72,
      6
    );

    /*
      Showcase sparks.
    */

    drawSpark(
      ctx,
      115,
      154,
      "#ff4fb8",
      seconds,
      0,
      4
    );

    drawSpark(
      ctx,
      414,
      177,
      "#ff4fb8",
      seconds,
      1.2,
      5
    );

    drawSpark(
      ctx,
      370,
      92,
      "#ff4fb8",
      seconds,
      2.4,
      3
    );

    ctx.restore();
  };

  /* =====================================================
     FRAME LOOP
     ===================================================== */

  const paint = (
    timestamp
  ) => {
    if (!foldMode) {
      animationFrame = 0;
      return;
    }

    /*
      About 30 FPS is plenty for this artwork
      and greatly reduces Fold compositor load.
    */

    if (
      document.visibilityState !==
        "hidden" &&
      (
        !lastPaint ||
        timestamp -
          lastPaint >=
          32
      )
    ) {
      const seconds =
        timestamp / 1000;

      drawHouse(seconds);

      drawShowcase(
        seconds
      );

      lastPaint =
        timestamp;
    }

    animationFrame =
      requestAnimationFrame(
        paint
      );
  };

  /* =====================================================
     ENTER / EXIT FOLD MODE
     ===================================================== */

  const syncFoldMode = () => {
    const shouldUseCanvas =
      isAndroidTouch() &&
      isSideBySidePortal();

    if (
      shouldUseCanvas ===
      foldMode
    ) {
      return;
    }

    foldMode =
      shouldUseCanvas;

    shell.classList.toggle(
      "fold-canvas-mode",
      foldMode
    );

    if (foldMode) {
      /*
        Remove any touch-generated desktop hover.
      */

      delete shell.dataset.active;

      lastPaint = 0;

      if (!animationFrame) {
        animationFrame =
          requestAnimationFrame(
            paint
          );
      }
    }

    else if (
      animationFrame
    ) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = 0;
    }
  };

  const scheduleCheck = () => {
    clearTimeout(
      resizeTimer
    );

    resizeTimer =
      setTimeout(
        syncFoldMode,
        160
      );
  };

  /*
    portal.js runs first.
    These listeners run afterward and cancel any
    touch-created fake desktop hover state.
  */

  choices.forEach(
    (choice) => {
      choice.addEventListener(
        "pointerenter",
        () => {
          if (foldMode) {
            delete shell.dataset.active;
          }
        }
      );

      choice.addEventListener(
        "focus",
        () => {
          if (foldMode) {
            delete shell.dataset.active;
          }
        }
      );
    }
  );

  requestAnimationFrame(
    syncFoldMode
  );

  window.addEventListener(
    "resize",
    scheduleCheck,
    {
      passive: true
    }
  );

  window.addEventListener(
    "orientationchange",
    scheduleCheck,
    {
      passive: true
    }
  );

  if (
    window.visualViewport
  ) {
    window.visualViewport
      .addEventListener(
        "resize",
        scheduleCheck,
        {
          passive: true
        }
      );
  }
})();
