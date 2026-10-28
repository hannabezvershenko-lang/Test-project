(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ───────────── Header: scrolled state + sliding nav pill ───────────── */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const nav = $('.nav');
  const pill = $('.nav__pill');
  const links = $$('.nav__link');
  const movePill = (el) => {
    if (!el) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';
    pill.style.width = el.offsetWidth + 'px';
    pill.style.transform = `translateX(${el.offsetLeft}px)`;
  };
  const activeLink = () => $('.nav__link.is-active');
  links.forEach((a) => a.addEventListener('mouseenter', () => movePill(a)));
  nav.addEventListener('mouseleave', () => movePill(activeLink()));
  window.addEventListener('resize', () => movePill(activeLink()));
  document.fonts && document.fonts.ready.then(() => movePill(activeLink()));
  movePill(activeLink());

  // highlight the section in view (the hero maps to "#top", which the header owns)
  const heroEl = $('.hero');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const href = e.target === heroEl ? '#top' : '#' + e.target.id;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === href));
      if (!nav.matches(':hover')) movePill(activeLink());
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spy.observe(heroEl);
  links.forEach((a) => {
    const el = document.getElementById(a.getAttribute('href').slice(1));
    if (el && el !== header) spy.observe(el);
  });

  /* ───────────── Mobile menu ───────────── */
  const burger = $('.burger');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ───────────── Custom cursor ───────────── */
  const cursor = $('.cursor');
  if (canHover && !reduceMotion) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, .car-stage, .tilt'));
    });
  }

  /* ───────────── Magnetic buttons ───────────── */
  if (canHover && !reduceMotion) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ───────────── 3D tilt + spotlight on cards ───────────── */
  if (canHover && !reduceMotion) {
    $$('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-4px)`;
        el.style.setProperty('--px', px * 100 + '%');
        el.style.setProperty('--py', py * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const cta = $('.cta__box');
    cta.addEventListener('pointermove', (e) => {
      const r = cta.getBoundingClientRect();
      const bg = $('.cta__bg', cta);
      bg.style.setProperty('--px', ((e.clientX - r.left) / r.width) * 100 + '%');
      bg.style.setProperty('--py', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  }

  /* ───────────── Hero car: doors + headlights on hover, parallax ───────────── */
  const stage = $('#carStage');
  const carTilt = $('.car-tilt', stage);
  const carShape = $('.car', stage);
  const hintText = $('.hint-text', stage);
  if (!canHover) hintText.textContent = 'Нажмите на автомобиль';

  const setOpen = (open) => stage.classList.toggle('is-open', open);
  // Open only when the pointer is over the car itself, not the empty stage around it
  const overCar = (e) => {
    const r = carShape.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0..1 across viewBox width
    const y = (e.clientY - r.top) / r.height;   // 0..1 across viewBox height (660)
    return x > 0.09 && x < 0.91 && y > 0.14 && y < 0.72;
  };

  if (canHover) {
    stage.addEventListener('pointermove', (e) => {
      setOpen(overCar(e) || (stage.classList.contains('is-open') && e.target.closest('.car')));
      if (reduceMotion) return;
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      carTilt.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 5}deg)`;
    });
    stage.addEventListener('pointerleave', () => {
      setOpen(false);
      carTilt.style.transform = '';
    });
  } else {
    stage.addEventListener('click', () => setOpen(!stage.classList.contains('is-open')));
  }
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('role', 'button');
  stage.setAttribute('aria-label', 'Noctis GT Obsidian: открыть двери и включить фары');
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!stage.classList.contains('is-open')); }
  });

  /* ───────────── Smoke (canvas particles) ───────────── */
  // Smoke sprite: fractal value noise masked by a soft radial falloff → wispy, not blobby
  function makePuff(size, rgb) {
    const N = 128;
    const grid = 8;
    const rnd = Array.from({ length: (grid + 1) * (grid + 1) * 6 }, Math.random);
    const smooth = (t) => t * t * (3 - 2 * t);
    const noise = (x, y, oct) => {
      const g = grid << oct, off = oct * (grid + 1) * (grid + 1);
      const xi = Math.floor(x * g) % g, yi = Math.floor(y * g) % g;
      const xf = smooth(x * g - Math.floor(x * g)), yf = smooth(y * g - Math.floor(y * g));
      const v = (i, j) => rnd[(off + ((j % (grid + 1)) * (grid + 1) + (i % (grid + 1)))) % rnd.length];
      const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    };
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d');
    const img = g.createImageData(N, N);
    const [r, gg, bb] = rgb.split(',').map(Number);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N;
        let n = 0, amp = 0.5;
        for (let o = 0; o < 4; o++) { n += noise(u, v, o) * amp; amp *= 0.5; }
        const dx = (u - 0.5) * 2, dy = (v - 0.5) * 2.4;
        const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        const a = Math.max(0, n - 0.38) * 1.9 * fall * fall;
        const i = (y * N + x) * 4;
        img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = bb;
        img.data[i + 3] = Math.min(255, a * 255 * 0.55);
      }
    }
    g.putImageData(img, 0, 0);
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const og = out.getContext('2d');
    og.imageSmoothingQuality = 'high';
    og.drawImage(c, 0, 0, size, size);
    return out;
  }
  const sprites = {
    warm: [makePuff(256, '255, 178, 110'), makePuff(256, '255, 150, 80')],
    cool: [makePuff(256, '205, 196, 188'), makePuff(256, '170, 160, 152')],
  };

  const mouse = { x: -9999, y: -9999 };

  function Smoke(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, parts = [], running = false, raf = 0;

    const spawn = (p, initial) => {
      // emit from a horizontal band (the "ground" under the car), wider toward the sides
      const side = Math.random() < 0.5 ? -1 : 1;
      const spread = Math.pow(Math.random(), 0.7) * opts.spread;
      p.x = w / 2 + side * spread * w;
      p.y = h * opts.ground + (Math.random() - 0.5) * h * 0.08;
      if (initial) p.y -= Math.random() * h * opts.rise;
      p.vx = side * (0.12 + Math.random() * 0.45) * opts.speed;
      p.vy = -(0.03 + Math.random() * 0.18) * opts.speed;
      p.size = (opts.minSize + Math.random() * opts.sizeVar) * Math.min(w, 1400) / 1000;
      p.grow = 0.08 + Math.random() * 0.22;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - 0.5) * 0.004;
      p.life = initial ? Math.random() : 0;
      p.ttl = 0.0012 + Math.random() * 0.0018;
      const distFromCenter = Math.abs(p.x - w / 2) / (w / 2);
      const pool = Math.random() > distFromCenter * 0.9 ? sprites.warm : sprites.cool;
      p.img = pool[(Math.random() * pool.length) | 0];
      p.alpha = opts.alpha * (0.6 + Math.random() * 0.6);
      return p;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(opts.count * Math.min(1, w / 1200 + 0.35));
      parts = Array.from({ length: count }, () => spawn({}, true));
      if (reduceMotion) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const r = canvas.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      for (const p of parts) {
        if (!reduceMotion) {
          // cursor pushes the smoke away
          const dx = p.x - mx, dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          const R = 180;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 0.6;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f * 0.6;
          }
          p.vx *= 0.992; p.vy *= 0.99;
          p.vy -= 0.0008 * opts.speed;
          p.x += p.vx; p.y += p.vy;
          p.size += p.grow; p.rot += p.vr;
          p.life += p.ttl;
          if (p.life >= 1 || p.y < -p.size || p.x < -p.size || p.x > w + p.size) spawn(p, false);
        }
        // fade in, then out
        const a = p.alpha * Math.sin(Math.min(p.life, 1) * Math.PI);
        if (a <= 0.002) continue;
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => { draw(); if (running) raf = requestAnimationFrame(tick); };
    return {
      resize,
      start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(tick); },
      stop() { running = false; cancelAnimationFrame(raf); },
    };
  }

  const smokeBack = Smoke($('.smoke--back'), { count: 50, ground: 0.8, spread: 0.5, rise: 0.35, speed: 1, minSize: 260, sizeVar: 320, alpha: 1 });
  const smokeFront = Smoke($('.smoke--front'), { count: 34, ground: 0.78, spread: 0.45, rise: 0.3, speed: 0.7, minSize: 200, sizeVar: 240, alpha: 0.6 });
  const smokes = [smokeBack, smokeFront];
  smokes.forEach((s) => s.resize());
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => smokes.forEach((s) => s.resize()), 150); });
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  // run only while the hero is on screen
  new IntersectionObserver(([e]) => smokes.forEach((s) => (e.isIntersecting ? s.start() : s.stop()))).observe(heroEl);

  /* ───────────── Reveal on scroll ───────────── */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
      el.style.transitionDelay = Math.max(0, siblings.indexOf(el)) * 80 + 'ms';
      el.classList.add('is-in');
      setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
      revealIO.unobserve(el);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ───────────── Count-up numbers ───────────── */
  const fmt = (n) => n.toLocaleString('ru-RU');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      countIO.unobserve(el);
      if (reduceMotion) { el.textContent = fmt(target); return; }
      const dur = 1600, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ───────────── Model filters ───────────── */
  const cards = $$('.model-card');
  const emptyNote = $('.empty-note');
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    $$('.filter').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    const f = btn.dataset.filter;
    let shown = 0;
    cards.forEach((c) => {
      const match = f === 'all' || c.dataset.type.split(' ').includes(f);
      c.classList.toggle('is-hidden', !match);
      if (match) {
        shown++;
        if (!reduceMotion) c.animate([{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.1,1)', delay: shown * 60, fill: 'backwards' });
      }
    });
    emptyNote.hidden = shown > 0;
  }));

  /* ───────────── Configurator ───────────── */
  const BASE = 28900000;
  const paints = {
    obsidian: { hi: '#3b3b42', mid: '#121216', lo: '#050506', paint: '#16161a', accent: '#ff9a3c' },
    ember:    { hi: '#e0752f', mid: '#7a2a0c', lo: '#1e0904', paint: '#c4521c', accent: '#ffc27a' },
    graphite: { hi: '#8a8e96', mid: '#3a3d43', lo: '#0e0f11', paint: '#5a5e66', accent: '#ffb35c' },
    bordeaux: { hi: '#8c2030', mid: '#3d0810', lo: '#100204', paint: '#5e0f18', accent: '#ff8a7a' },
    pearl:    { hi: '#f2efe9', mid: '#a7a39c', lo: '#2a2826', paint: '#d9d6d0', accent: '#ffb35c' },
  };
  const totalEl = $('#totalPrice');
  const colorName = $('#colorName');
  const configVisual = $('.config__visual');
  let colorPrice = 0;
  let shownTotal = BASE;
  const rub = (n) => fmt(Math.round(n)) + ' ₽';

  const recalc = () => {
    const pkg = +($('input[name="pkg"]:checked') || { value: 0 }).value;
    const opts = $$('.toggle input:checked').reduce((s, i) => s + +i.value, 0);
    const target = BASE + colorPrice + pkg + opts;
    const from = shownTotal, t0 = performance.now();
    shownTotal = target;
    if (reduceMotion) { totalEl.textContent = rub(target); return; }
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 600);
      totalEl.textContent = rub(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  $$('.swatch').forEach((sw) => sw.addEventListener('click', () => {
    $$('.swatch').forEach((s) => s.classList.toggle('is-active', s === sw));
    const p = paints[sw.dataset.color];
    const root = document.documentElement.style;
    root.setProperty('--car-hi', p.hi);
    root.setProperty('--car-mid', p.mid);
    root.setProperty('--car-lo', p.lo);
    configVisual.style.setProperty('--paint', p.paint);
    configVisual.style.setProperty('--paint-accent', p.accent);
    colorName.textContent = sw.dataset.name;
    $('.car-caption__name em').textContent = sw.dataset.name.split(' ')[0];
    colorPrice = +sw.dataset.price;
    recalc();
  }));
  $$('input[name="pkg"], .toggle input').forEach((i) => i.addEventListener('change', recalc));

  /* ───────────── Modal + form ───────────── */
  const modal = $('#modal');
  const form = $('.form', modal);
  const success = $('.form-success', modal);
  const modelLine = $('.form__model', modal);
  let lastFocus = null;

  const openModal = (model) => {
    lastFocus = document.activeElement;
    form.hidden = false; success.hidden = true; form.reset();
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    modelLine.hidden = !model;
    if (model) $('b', modelLine).textContent = model;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('input', form).focus(), 50);
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  $$('[data-open-modal]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal(b.dataset.model);
  }));
  $$('[data-close-modal]', modal).forEach((b) => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('button, input, a[href]', modal).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // phone mask: +7 (XXX) XXX-XX-XX
  const phone = $('input[name="phone"]', form);
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = d ? '+7' : '';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length >= 3) out += ')';
    if (p.length > 3) out += ' ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    phone.value = out;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name, agree = form.elements.agree;
    const okName = name.value.trim().length >= 2;
    const okPhone = phone.value.replace(/\D/g, '').length === 11;
    name.closest('.field').classList.toggle('is-invalid', !okName);
    phone.closest('.field').classList.toggle('is-invalid', !okPhone);
    agree.closest('.check').classList.toggle('is-invalid', !agree.checked);
    if (!okName) return name.focus();
    if (!okPhone) return phone.focus();
    if (!agree.checked) return agree.focus();
    form.hidden = true; success.hidden = false;
    $('button', success).focus();
  });
})();
