// MONROE / interactions: page curtain, full-screen menu, fitted caps, hovers.
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const SLOW = reduced ? 0 : 600;

  /* ---------- page transition: curtain in, navigate, curtain out ---------- */

  const curtain = document.querySelector('.curtain');

  function reveal() {
    if (!root.classList.contains('is-entering')) return;
    curtain.classList.add('is-in');
    root.classList.remove('is-entering');
    requestAnimationFrame(() => {
      curtain.classList.remove('is-in');
      curtain.classList.add('is-out');
      setTimeout(() => curtain.classList.remove('is-out'), SLOW);
    });
  }

  function leave(url) {
    try { sessionStorage.setItem('monroe-nav', '1'); } catch (e) { /* private mode */ }
    if (reduced) { location.href = url; return; }
    curtain.classList.remove('is-out');
    curtain.classList.add('is-in');
    setTimeout(() => { location.href = url; }, SLOW);
  }

  window.addEventListener('pageshow', (e) => {
    // coming back from the bfcache: the curtain may still be down
    if (e.persisted) {
      curtain.classList.remove('is-in', 'is-out');
      root.classList.remove('is-entering');
    }
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    e.preventDefault();
    if (samePage) {
      closeMenu();
      const target = url.hash && document.querySelector(url.hash);
      if (target) {
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        history.replaceState(null, '', url.hash);
      } else {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }
      return;
    }
    leave(url.href);
  });

  /* ---------- full-screen menu ---------- */

  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  const peek = document.querySelector('.nav__peek');
  let closeTimer;

  function openMenu() {
    clearTimeout(closeTimer);
    nav.classList.remove('is-closing');
    root.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    nav.removeAttribute('inert');
    body.style.overflow = 'hidden';
    setTimeout(() => nav.querySelector('a')?.focus({ preventScroll: true }), 300);
  }
  function closeMenu() {
    if (!root.classList.contains('menu-open')) return;
    nav.classList.add('is-closing');
    root.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    nav.setAttribute('inert', '');
    body.style.overflow = '';
    peek?.classList.remove('is-on');
    closeTimer = setTimeout(() => nav.classList.remove('is-closing'), SLOW);
  }
  menuBtn.addEventListener('click', () => (root.classList.contains('menu-open') ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // image that follows the cursor over menu items
  function follower(el) {
    if (!el || !fine) return { show() {}, hide() {} };
    const img = el.querySelector('img');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0, on = false;
    const loop = () => {
      cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
      el.style.left = cx + 'px'; el.style.top = cy + 'px';
      if (on || Math.abs(x - cx) > 0.5) raf = requestAnimationFrame(loop); else raf = 0;
    };
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (on && !raf) loop(); }, { passive: true });
    return {
      show(src) {
        if (img.getAttribute('src') !== src) img.src = src;
        if (!on) { cx = x; cy = y; }
        on = true; el.classList.add('is-on'); if (!raf) loop();
      },
      hide() { on = false; el.classList.remove('is-on'); },
    };
  }
  const navPeek = follower(peek);
  nav.querySelectorAll('[data-img]').forEach((a) => {
    a.addEventListener('pointerenter', () => navPeek.show(a.dataset.img));
    a.addEventListener('pointerleave', () => navPeek.hide());
  });

  const floatImg = follower(document.querySelector('.float-img'));
  document.querySelectorAll('.svc__row[data-img]').forEach((row) => {
    row.addEventListener('pointerenter', () => floatImg.show(row.dataset.img));
    row.addEventListener('pointerleave', () => floatImg.hide());
  });

  /* ---------- caps set edge to edge ---------- */

  const caps = [...document.querySelectorAll('.caps')];
  caps.forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });
  function fitCaps() {
    caps.forEach((el) => {
      const box = el.parentElement;
      const cs = getComputedStyle(box);
      const target = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = '100px';
      const chars = el.querySelectorAll('.ch');
      const w = chars[chars.length - 1].getBoundingClientRect().right - chars[0].getBoundingClientRect().left;
      el.style.fontSize = (100 * target / w).toFixed(2) + 'px';
      box.parentElement.style.setProperty('--caps-h', el.getBoundingClientRect().height + 'px');
    });
    dispatchEvent(new Event('caps:fit'));
  }
  fitCaps();
  document.fonts?.ready.then(fitCaps);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fitCaps, 100); });

  /* ---------- header, reveal, cursor ---------- */

  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  if (fine) {
    const c = document.createElement('div');
    c.className = 'cursor';
    body.appendChild(c);
    addEventListener('pointermove', (e) => {
      c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      c.classList.add('is-on');
      c.classList.toggle('is-link', !!e.target.closest('a, button'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  }

  /* ---------- prices page: highlight the current category ---------- */

  const catLinks = document.querySelectorAll('.prices__nav a[href^="#"]');
  if (catLinks.length) {
    const map = new Map([...catLinks].map((a) => [a.getAttribute('href').slice(1), a]));
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        catLinks.forEach((a) => a.classList.remove('is-active'));
        map.get(en.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.cat').forEach((s) => cio.observe(s));
  }

  /* ---------- go ---------- */

  if (document.readyState === 'complete') reveal();
  else addEventListener('load', reveal);
  // never leave the curtain down if something stalls
  setTimeout(reveal, 2500);
})();
