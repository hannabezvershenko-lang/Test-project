(() => {
  "use strict";

  const FRAME_COUNT = 36;
  // label anchors projected from the 3D scene (x of the layer's right edge, y of its centre), 0..1 of the frame
  const LABELS = [{"label": "лаваш", "right": 0.7137, "y": 0.6523}, {"label": "салат латук", "right": 0.6679, "y": 0.5774}, {"label": "куриное филе", "right": 0.7071, "y": 0.502}, {"label": "томат", "right": 0.6441, "y": 0.4261}, {"label": "свежий огурец", "right": 0.6647, "y": 0.3497}, {"label": "красный лук", "right": 0.6476, "y": 0.2729}, {"label": "чесночный соус", "right": 0.6266, "y": 0.1956}, {"label": "зелень", "right": 0.6478, "y": 0.1178}];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  document.getElementById("year").textContent = new Date().getFullYear();

  // ───────────── pointer state shared by every effect ─────────────
  const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, nx: 0, ny: 0, active: false };
  addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = e.clientX / innerWidth - 0.5;
    pointer.ny = e.clientY / innerHeight - 0.5;
    pointer.active = true;
  }, { passive: true });

  // ───────────── custom cursor ─────────────
  const cursor = document.querySelector(".cursor");
  const cursorLabel = cursor.querySelector(".cursor__label");
  const cur = { x: pointer.x, y: pointer.y };
  if (finePointer) {
    document.body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      cursor.classList.toggle("is-product", !!t.closest(".product"));
      cursor.classList.toggle("is-link", !t.closest(".product") && !!t.closest("a, button"));
    });
    document.addEventListener("pointerleave", () => (cursor.style.opacity = 0));
    document.addEventListener("pointerenter", () => (cursor.style.opacity = 1));
  }

  // ───────────── product: frame sequence opening on hover ─────────────
  const product = document.getElementById("product");
  const canvas = product.querySelector(".product__canvas");
  const ctx = canvas.getContext("2d");
  const tilt = product.querySelector(".product__tilt");
  const frames = [];
  let loaded = 0;
  let progress = 0;
  let target = 0;
  let drawn = -1;

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.decoding = "async";
    img.src = `assets/frames/f${String(i).padStart(2, "0")}.webp`;
    img.onload = () => {
      if (++loaded === FRAME_COUNT) {
        product.classList.add("is-ready");
        drawn = -1;
      }
    };
    frames.push(img);
  }

  function drawProduct() {
    if (loaded < FRAME_COUNT) return;
    const pos = progress * (FRAME_COUNT - 1);
    if (Math.abs(pos - drawn) < 0.002) return;
    drawn = pos;
    const i = Math.floor(pos);
    const f = pos - i;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // additive cross-fade of premultiplied frames = exact blend, no ghosting on transparent areas
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 - f;
    ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
    if (f > 0.001 && i + 1 < FRAME_COUNT) {
      ctx.globalAlpha = f;
      ctx.drawImage(frames[i + 1], 0, 0, canvas.width, canvas.height);
    }
  }

  // ingredient labels with leader lines, shown as each layer lands
  const labelList = product.querySelector(".product__labels");
  const labelCol = LABELS.length ? Math.max(...LABELS.map((l) => l.right)) + 0.05 : 0;
  const labelEls = LABELS.map((l, i) => {
    const li = document.createElement("li");
    li.textContent = l.label;
    li.style.top = `${l.y * 100}%`;
    li.style.left = `${(l.right + 0.01) * 100}%`;
    labelList.appendChild(li);
    return { li, l, at: 0.5 + 0.055 * i };
  });
  function layoutLabels() {
    const w = product.getBoundingClientRect().width;
    for (const { li, l } of labelEls) li.style.setProperty("--line-w", `${Math.max(16, (labelCol - l.right) * w)}px`);
  }
  layoutLabels();
  addEventListener("resize", layoutLabels);
  function updateLabels() {
    for (const e of labelEls) e.li.classList.toggle("is-on", progress >= e.at);
  }

  const setOpen = (open) => {
    target = open ? 1 : 0;
    product.classList.toggle("is-open", open);
    cursorLabel.textContent = open ? "Приятного" : "Открыть";
    product.setAttribute("aria-pressed", String(open));
  };
  if (finePointer) {
    product.addEventListener("pointerenter", () => setOpen(true));
    product.addEventListener("pointerleave", () => setOpen(false));
  } else {
    product.querySelector(".product__hint span").textContent = "Нажми — раскроется";
    product.addEventListener("click", () => setOpen(target === 0));
  }
  product.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(target === 0);
    }
  });

  // ───────────── parallax + tilt ─────────────
  const depthEls = [...document.querySelectorAll("[data-depth]")].map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
  const par = { x: 0, y: 0 };
  const tl = { x: 0, y: 0 };

  // ───────────── embers ─────────────
  const ec = document.querySelector(".embers");
  const ex = ec.getContext("2d");
  let ew = 0, eh = 0, dpr = 1;
  const embers = [];
  function resizeEmbers() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    ew = innerWidth;
    eh = innerHeight;
    ec.width = ew * dpr;
    ec.height = eh * dpr;
    ex.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn(ember, initial) {
    ember.x = ew * (0.5 + (Math.random() - 0.5) * 0.7);
    ember.y = initial ? Math.random() * eh : eh + 10;
    ember.vx = (Math.random() - 0.5) * 0.25;
    ember.vy = -(0.25 + Math.random() * 0.7);
    ember.r = 0.6 + Math.random() * 1.6;
    ember.life = 0;
    ember.max = 400 + Math.random() * 600;
    ember.hue = 18 + Math.random() * 22;
  }
  resizeEmbers();
  addEventListener("resize", resizeEmbers);
  const EMBER_COUNT = reduceMotion ? 0 : innerWidth < 760 ? 30 : 70;
  for (let i = 0; i < EMBER_COUNT; i++) {
    const e = {};
    spawn(e, true);
    embers.push(e);
  }
  function drawEmbers() {
    ex.clearRect(0, 0, ew, eh);
    ex.globalCompositeOperation = "lighter";
    const boost = 1 + progress * 1.5; // the fire flares up when the wrap opens
    for (const e of embers) {
      const dx = e.x - pointer.x;
      const dy = e.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (pointer.active && d2 < 22000) { // embers swirl away from the cursor
        const f = (1 - d2 / 22000) * 0.6;
        const d = Math.sqrt(d2) || 1;
        e.vx += (dx / d) * f;
        e.vy += (dy / d) * f * 0.5;
      }
      e.vx = e.vx * 0.97 + Math.sin((e.life + e.hue * 10) * 0.02) * 0.02;
      e.x += e.vx;
      e.y += e.vy * boost;
      e.life++;
      if (e.life > e.max || e.y < -20 || e.x < -20 || e.x > ew + 20) spawn(e, false);
      const a = Math.sin((e.life / e.max) * Math.PI) * 0.8;
      const g = ex.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
      g.addColorStop(0, `hsla(${e.hue}, 95%, 70%, ${a})`);
      g.addColorStop(1, `hsla(${e.hue}, 95%, 50%, 0)`);
      ex.fillStyle = g;
      ex.beginPath();
      ex.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
      ex.fill();
    }
  }

  // ───────────── main loop ─────────────
  const root = document.documentElement;
  const hero = document.querySelector(".hero");
  let heroVisible = true;
  new IntersectionObserver(([en]) => (heroVisible = en.isIntersecting)).observe(hero);
  const mobile = window.matchMedia("(max-width: 760px)");

  function frame() {
    // product opening eases toward its target
    progress = reduceMotion ? target : lerp(progress, target, 0.085);
    if (Math.abs(progress - target) < 0.0005) progress = target;
    drawProduct();
    updateLabels();

    if (finePointer) {
      cur.x = lerp(cur.x, pointer.x, 0.22);
      cur.y = lerp(cur.y, pointer.y, 0.22);
      cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      root.style.setProperty("--mx", `${pointer.x}px`);
      root.style.setProperty("--my", `${pointer.y}px`);
    }

    if (heroVisible && finePointer && !reduceMotion && !mobile.matches) {
      par.x = lerp(par.x, pointer.nx, 0.06);
      par.y = lerp(par.y, pointer.ny, 0.06);
      for (const { el, d } of depthEls) {
        el.style.translate = `${(-par.x * 30 * d).toFixed(2)}px ${(-par.y * 18 * d).toFixed(2)}px`;
      }
      tl.x = lerp(tl.x, pointer.nx, 0.08);
      tl.y = lerp(tl.y, pointer.ny, 0.08);
      tilt.style.transform = `perspective(1200px) rotateY(${(tl.x * 14).toFixed(2)}deg) rotateX(${(-tl.y * 8).toFixed(2)}deg) translate3d(${(tl.x * 18).toFixed(2)}px, ${(tl.y * 10).toFixed(2)}px, 0) scale(${1 + progress * 0.04})`;
    }

    if (EMBER_COUNT) drawEmbers();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ───────────── magnetic buttons ─────────────
  if (finePointer && !reduceMotion) {
    for (const el of document.querySelectorAll(".magnetic")) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.2,.7,.1,1), color .45s";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    }

    // ───────────── 3D tilt cards + inner light ─────────────
    for (const el of document.querySelectorAll(".tilt")) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--x", `${px * 100}%`);
        el.style.setProperty("--y", `${py * 100}%`);
        el.style.transition = "transform .15s ease-out";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .8s cubic-bezier(.2,.7,.1,1)";
        el.style.transform = "";
      });
    }
  }

  // ───────────── order counter ─────────────
  const orderPill = document.querySelector(".nav .pill");
  const orderLabel = orderPill.firstChild;
  let count = 0;
  function bumpOrder(delta) {
    count = Math.max(0, count + delta);
    orderLabel.textContent = count ? `Заказать · ${count} ` : "Заказать ";
    orderPill.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 400 });
  }
  for (const btn of document.querySelectorAll(".add")) {
    btn.addEventListener("click", () => {
      const added = btn.classList.toggle("is-added");
      btn.textContent = added ? "✓" : "+";
      bumpOrder(added ? 1 : -1);
    });
  }

  // ───────────── game: build your own shawarma ─────────────
  const INGREDIENTS = [
    { key: "chicken", name: "Курица", price: 3.0, w: 56, h: 12 },
    { key: "lettuce", name: "Салат", price: 0.5, w: 58, h: 11 },
    { key: "tomato", name: "Томат", price: 0.6, w: 52, h: 10 },
    { key: "cucumber", name: "Огурец", price: 0.5, w: 50, h: 9 },
    { key: "onion", name: "Красный лук", price: 0.4, w: 48, h: 9 },
    { key: "sauce", name: "Чесночный соус", price: 0.7, w: 48, h: 10 },
    { key: "herbs", name: "Зелень", price: 0.3, w: 44, h: 8 },
  ];
  const BASE_PRICE = 2.9;
  const euro = (v) => `${v.toFixed(2).replace(".", ",")} €`;
  const board = document.getElementById("board");
  const stack = document.getElementById("stack");
  const pantry = document.getElementById("pantry");
  const priceEl = document.getElementById("game-price");
  const mainBtn = document.getElementById("game-main");
  const resetBtn = document.getElementById("game-reset");
  const doneEl = document.getElementById("game-done");
  const steps = [...document.querySelectorAll(".game__steps li")];
  const burst = board.querySelector(".board__burst");
  let picked = []; // keys in the order they were added
  let stage = "build"; // build → wrapped → ordered

  const chips = INGREDIENTS.map((ing) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ing";
    b.dataset.key = ing.key;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<img src="assets/img/ing/${ing.key}.webp" alt="" draggable="false"><b>${ing.name}</b><small>+${euro(ing.price)}</small>`;
    pantry.appendChild(b);
    return b;
  });

  function setStep(n) {
    steps.forEach((li, i) => {
      li.classList.toggle("is-active", i === n - 1);
      li.classList.toggle("is-done", i < n - 1);
    });
  }

  function render() {
    const total = BASE_PRICE + picked.reduce((s, k) => s + INGREDIENTS.find((i) => i.key === k).price, 0);
    priceEl.textContent = euro(total);
    board.classList.toggle("has-items", picked.length > 0);
    // restack: each layer sits on the one below it
    let bottom = 22;
    const items = [...stack.children].filter((el) => !el.classList.contains("is-leaving"));
    const step = picked.length > 5 ? 0.75 : 1;
    for (const el of items) {
      const ing = INGREDIENTS.find((i) => i.key === el.dataset.key);
      el.style.setProperty("--b", `${bottom}%`);
      el.style.setProperty("--w", `${ing.w}%`);
      bottom += ing.h * step;
    }
    for (const c of chips) {
      const on = picked.includes(c.dataset.key);
      c.classList.toggle("is-in", on);
      c.setAttribute("aria-pressed", String(on));
      c.disabled = stage !== "build";
    }
    if (stage === "build") {
      mainBtn.disabled = picked.length === 0;
      mainBtn.firstChild.textContent = "Завернуть ";
    }
    if (stage === "wrapped") {
      mainBtn.disabled = false;
      mainBtn.firstChild.textContent = `Заказать · ${euro(total)} `;
    }
    if (stage === "ordered") mainBtn.disabled = true;
  }

  function toggle(key, forceAdd = false) {
    if (stage !== "build") return;
    const chip = chips.find((c) => c.dataset.key === key);
    if (picked.includes(key)) {
      if (forceAdd) {
        chip.classList.remove("is-wiggle"); void chip.offsetWidth; chip.classList.add("is-wiggle");
        return;
      }
      picked = picked.filter((k) => k !== key);
      const el = stack.querySelector(`[data-key="${key}"]`);
      el.classList.add("is-leaving");
      setTimeout(() => { el.remove(); render(); }, 400);
    } else {
      picked.push(key);
      const img = document.createElement("img");
      img.src = `assets/img/ing/${key}.webp`;
      img.alt = INGREDIENTS.find((i) => i.key === key).name;
      img.dataset.key = key;
      img.draggable = false;
      stack.appendChild(img);
    }
    render();
  }

  function sparkle() {
    const colors = ["#e3793c", "#d6b07a", "#f1e8dc", "#7fae3a", "#c8321f"];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("i");
      const a = (i / 26) * Math.PI * 2;
      const d = 120 + Math.random() * 120;
      s.style.setProperty("--x", `${Math.cos(a) * d}px`);
      s.style.setProperty("--y", `${Math.sin(a) * d}px`);
      s.style.setProperty("--c", colors[i % colors.length]);
      burst.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  mainBtn.addEventListener("click", () => {
    if (stage === "build" && picked.length) {
      stage = "wrapped";
      board.classList.add("is-wrapping");
      setTimeout(() => { board.classList.add("is-wrapped"); sparkle(); }, 700);
      setStep(3);
      render();
    } else if (stage === "wrapped") {
      stage = "ordered";
      bumpOrder(1);
      doneEl.hidden = false;
      sparkle();
      steps.forEach((li) => { li.classList.remove("is-active"); li.classList.add("is-done"); });
      render();
    }
  });

  resetBtn.addEventListener("click", () => {
    stage = "build";
    picked = [];
    stack.innerHTML = "";
    board.classList.remove("is-wrapping", "is-wrapped");
    doneEl.hidden = true;
    setStep(1);
    render();
  });

  // tap to add / remove, or drag a chip onto the lavash
  for (const chip of chips) {
    let start = null;
    let ghost = null;
    chip.addEventListener("pointerdown", (e) => {
      if (chip.disabled) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      chip.setPointerCapture(e.pointerId);
    });
    chip.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        ghost = document.createElement("img");
        ghost.src = `assets/img/ing/${chip.dataset.key}.webp`;
        ghost.className = "drag-ghost";
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        const r = board.getBoundingClientRect();
        board.classList.toggle("is-over", e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
      }
    });
    const end = (e) => {
      if (!start) return;
      if (ghost) {
        const over = board.classList.contains("is-over");
        ghost.remove();
        ghost = null;
        board.classList.remove("is-over");
        if (over) toggle(chip.dataset.key, true);
      } else if (e.type === "pointerup") {
        toggle(chip.dataset.key);
      }
      start = null;
    };
    chip.addEventListener("pointerup", end);
    chip.addEventListener("pointercancel", end);
    // keyboard
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(chip.dataset.key); }
    });
  }
  render();

  // ───────────── scroll reveal ─────────────
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });
})();
