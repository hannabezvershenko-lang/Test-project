// Live 3D hero: pearls in the empty middle of the first screen.
const hero = document.querySelector('.hero');
const canvas = document.querySelector('.hero__canvas');
const stage = document.querySelector('.hero__stage');

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

if (hero && canvas && webgl()) {
  import('./assets/scene.js').then(({ createScene }) => {
    const scene = createScene(canvas, {
      kind: 'pearls',
      interactive: !matchMedia('(prefers-reduced-motion: reduce)').matches,
      // map the stage box (CSS pixels) to world units so the object never runs under the text
      fit(w, h, { worldW, worldH, camY }) {
        const hr = hero.getBoundingClientRect();
        const r = stage.getBoundingClientRect();
        const cx = (r.left - hr.left + r.width / 2) / w;
        const cy = (r.top - hr.top + r.height / 2) / h;
        const scale = Math.min((r.width / w) * worldW / 4.8, (r.height / h) * worldH / 3.7);
        return { x: (cx - 0.5) * worldW, y: camY + (0.5 - cy) * worldH, scale };
      },
    });
    scene.renderStill(0);
    hero.classList.add('is-live');
    addEventListener('load', () => scene.resize());
    addEventListener('caps:fit', () => scene.resize());
    document.fonts?.ready.then(() => scene.resize());
  }).catch(() => { /* the poster image stays */ });
}
