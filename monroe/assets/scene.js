// MONROE / procedural still lifes. One module renders the live hero and the
// still images in assets/img (see tools/render.mjs).
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const PINK = {
  pearl: 0xf9e3ea,
  petal: 0xf4b6c7,
  rose: 0xe98aa4,
  fuchsia: 0xd8427c,
  berry: 0x4a1028,
  gold: 0xd9b48a,
  cream: 0xfff3f6,
};

function satin(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.32, metalness: 0, sheen: 1, sheenRoughness: 0.35,
    sheenColor: new THREE.Color(0xffffff), clearcoat: 0.4, clearcoatRoughness: 0.25, ...extra,
  });
}
function gloss(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, ...extra,
  });
}
function pearl(color = 0xf7dce5) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [260, 640],
    sheen: 0.6, sheenColor: new THREE.Color(0xffd6e4),
  });
}

/* ---------- objects ---------- */

function buildPearls(g) {
  const big = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), pearl());
  big.castShadow = true;
  g.add(big);
  const small = [];
  const geo = new THREE.SphereGeometry(1, 64, 48);
  const seeds = [
    [-1.55, 0.75, 0.3, 0.2], [1.45, 1.05, -0.4, 0.15], [1.7, -0.55, 0.5, 0.24],
    [-1.25, -0.95, 0.7, 0.13], [0.35, 1.55, 0.6, 0.1], [-0.4, -1.45, -0.2, 0.17],
    [2.25, 0.3, -0.8, 0.09], [-2.15, 0.05, -0.5, 0.11],
  ];
  seeds.forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(geo, pearl(i % 3 === 0 ? PINK.petal : PINK.pearl));
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.userData.base = m.position.clone();
    m.userData.phase = i * 1.37;
    g.add(m);
    small.push(m);
  });
  // satin ribbon loop around the big pearl
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * 1.45, Math.sin(t * 2) * 0.18 + Math.sin(t) * 0.25, Math.sin(t) * 1.45));
  }
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, 0.035, 16, true),
    satin(PINK.fuchsia),
  );
  ribbon.rotation.set(0.5, 0, -0.35);
  ribbon.castShadow = true;
  g.add(ribbon);
  return (t) => {
    big.rotation.y = t * 0.15;
    ribbon.rotation.y = t * 0.22;
    small.forEach((m) => {
      const p = m.userData.phase;
      m.position.y = m.userData.base.y + Math.sin(t * 0.8 + p) * 0.08;
      m.position.x = m.userData.base.x + Math.cos(t * 0.6 + p) * 0.05;
    });
  };
}

function nailShape() {
  // a dense capsule, flattened, tapered to an almond tip and curved across its width
  const geo = new THREE.CapsuleGeometry(0.3, 0.62, 24, 64);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = Math.max(0, y / 0.61);
    const x = p.getX(i) * (1 - k * k * 0.55);
    p.setX(i, x);
    p.setZ(i, p.getZ(i) * 0.16 - x * x * 1.1);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildNails(g) {
  const geo = nailShape();
  const cols = [PINK.cream, PINK.petal, PINK.rose, PINK.fuchsia, PINK.berry];
  cols.forEach((c, i) => {
    const m = new THREE.Mesh(geo, gloss(c));
    const a = (i - 2) * 0.32;
    m.position.set(Math.sin(a) * 1.6, Math.cos(a) * 1.6 - 1.35, i * 0.06);
    m.rotation.z = -a;
    m.rotation.x = -0.25;
    m.scale.setScalar(1.25);
    m.castShadow = true;
    g.add(m);
  });
  // a pearl as the "stone"
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 48, 32), pearl());
  p.position.set(0.95, -0.95, 0.4);
  p.castShadow = true;
  g.add(p);
  g.position.y = 0.15;
  return (t) => { g.rotation.y = Math.sin(t * 0.4) * 0.12; };
}

function buildLashes(g) {
  const mat = satin(PINK.berry, { roughness: 0.25 });
  const n = 46;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const a = (u - 0.5) * 2.3;
    const len = 1.1 + Math.sin(u * Math.PI) * 0.9 + (i % 3) * 0.06;
    const base = new THREE.Vector3(Math.sin(a) * 1.4, Math.cos(a) * 0.45 - 0.9, Math.cos(a) * 0.3);
    const dir = new THREE.Vector3(Math.sin(a) * 0.7, 1, 0.15).normalize();
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const s = k / 12;
      const curl = s * s * 0.55;
      pts.push(base.clone()
        .addScaledVector(dir, s * len)
        .add(new THREE.Vector3(Math.sin(a) * curl * 0.3, -curl * 0.25, curl)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 48, 1, 6, false);
    // taper toward the tip
    const pos = tube.attributes.position;
    const tmp = new THREE.Vector3();
    for (let v = 0; v < pos.count; v++) {
      const seg = Math.floor(v / 7) / 48;
      const c = curve.getPointAt(Math.min(seg, 1));
      tmp.fromBufferAttribute(pos, v).sub(c).multiplyScalar(0.022 * (1 - seg * 0.9));
      pos.setXYZ(v, c.x + tmp.x, c.y + tmp.y, c.z + tmp.z);
    }
    tube.computeVertexNormals();
    const m = new THREE.Mesh(tube, mat);
    m.castShadow = true;
    g.add(m);
  }
  // lash band: soft pink satin bar
  const band = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40 - 0.5) * 2.4;
    band.push(new THREE.Vector3(Math.sin(a) * 1.4, Math.cos(a) * 0.45 - 0.92, Math.cos(a) * 0.3));
  }
  const b = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(band), 80, 0.07, 16), satin(PINK.rose));
  b.castShadow = true;
  g.add(b);
  const pr = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 32), pearl());
  pr.position.set(1.55, -1.25, 0.4);
  pr.castShadow = true;
  g.add(pr);
  g.rotation.x = -0.2;
  return (t) => { g.rotation.y = Math.sin(t * 0.35) * 0.18; };
}

function buildHair(g) {
  const strands = 9;
  for (let s = 0; s < strands; s++) {
    const off = (s - (strands - 1) / 2) * 0.13;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const y = 1.9 - u * 3.8;
      const x = Math.sin(u * Math.PI * 2.4 + s * 0.05) * (0.55 + u * 0.35) + off * (1 - u * 0.3);
      const z = Math.cos(u * Math.PI * 2.4) * 0.25 + off * 0.4;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const color = new THREE.Color(PINK.gold).lerp(new THREE.Color(PINK.petal), s / strands);
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.075, 16),
      satin(color, { roughness: 0.28, sheen: 1, sheenColor: new THREE.Color(0xfff0e6) }),
    );
    m.castShadow = true;
    g.add(m);
  }
  g.rotation.z = 0.25;
  return (t) => { g.rotation.y = Math.sin(t * 0.3) * 0.25; };
}

function buildSkin(g) {
  const drop = new THREE.LatheGeometry(
    Array.from({ length: 64 }, (_, i) => {
      const u = i / 63; // 0 bottom, 1 tip
      const a = u * Math.PI;
      const r = Math.sin(a) * (1 - u * 0.62) ** 1.15;
      return new THREE.Vector2(Math.max(r, 0.0001), -Math.cos(a) * 1.15 + u * 0.55);
    }), 128,
  );
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffdbe6, roughness: 0.03, metalness: 0, transmission: 1, thickness: 1.4, ior: 1.42,
    attenuationColor: new THREE.Color(PINK.rose), attenuationDistance: 1.6, clearcoat: 1,
  });
  const d = new THREE.Mesh(drop, glass);
  d.scale.setScalar(1.05);
  d.position.y = 0.35;
  d.castShadow = true;
  g.add(d);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.32, 128), satin(PINK.petal, { roughness: 0.5 }));
  disc.position.y = -1.05;
  disc.receiveShadow = true;
  disc.castShadow = true;
  g.add(disc);
  const geo = new THREE.SphereGeometry(1, 48, 32);
  [[-1.0, -0.72, 0.6, 0.14], [0.85, -0.78, 0.75, 0.09], [1.6, -1.12, -0.2, 0.12]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(geo, glass);
    m.position.set(x, y, z);
    m.scale.setScalar(r);
    g.add(m);
  });
  return (t) => { d.rotation.y = t * 0.3; };
}

function buildMakeup(g) {
  // gold tube
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.5, 96),
    new THREE.MeshPhysicalMaterial({ color: PINK.gold, metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
  );
  tube.position.y = -0.95;
  tube.castShadow = true;
  g.add(tube);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.35, 96), tube.material);
  ring.position.y = -0.05;
  g.add(ring);
  // bullet with a slanted cut
  const prof = [new THREE.Vector2(0.0001, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.3, 1.25), new THREE.Vector2(0.0001, 1.25)];
  const bullet = new THREE.LatheGeometry(prof, 96);
  const p = bullet.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const cut = 0.72 + p.getX(i) * 0.9;
    if (p.getY(i) > cut) p.setY(i, cut);
  }
  bullet.computeVertexNormals();
  const b = new THREE.Mesh(bullet, satin(PINK.fuchsia, { roughness: 0.35, clearcoat: 0.6 }));
  b.position.y = 0.1;
  b.castShadow = true;
  g.add(b);
  // cap lying next to it
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 1.2, 96), tube.material);
  cap.rotation.set(0, 0, Math.PI / 2);
  cap.position.set(1.35, -1.28, 0.3);
  cap.castShadow = true;
  g.add(cap);
  const pr = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), pearl());
  pr.position.set(-0.95, -1.5, 0.5);
  pr.castShadow = true;
  g.add(pr);
  g.rotation.set(0.1, -0.4, 0.12);
  return (t) => { g.rotation.y = -0.4 + Math.sin(t * 0.3) * 0.2; };
}

function buildStudio(g) {
  const tiers = [[1.6, 0.38, PINK.petal], [1.15, 0.38, PINK.rose], [0.7, 0.38, PINK.cream]];
  let y = -1.6;
  tiers.forEach(([r, h, c]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 128), satin(c, { roughness: 0.45 }));
    y += h / 2;
    m.position.y = y;
    y += h / 2;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  });
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.62, 96, 64), pearl());
  p.position.y = y + 0.62;
  p.castShadow = true;
  g.add(p);
  // arch behind
  const arch = new THREE.Shape();
  arch.moveTo(-1.3, -1.6); arch.lineTo(-1.3, 1.0);
  arch.absarc(0, 1.0, 1.3, Math.PI, 0, true);
  arch.lineTo(1.3, -1.6); arch.lineTo(-1.3, -1.6);
  const a = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arch, { depth: 0.2, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, curveSegments: 64 }),
    satin(PINK.fuchsia, { roughness: 0.5 }),
  );
  a.position.set(0.6, 0, -1.6);
  a.receiveShadow = true;
  g.add(a);
  return (t) => { p.rotation.y = t * 0.3; };
}

const BUILDERS = {
  pearls: buildPearls, nails: buildNails, lashes: buildLashes, hair: buildHair,
  skin: buildSkin, makeup: buildMakeup, studio: buildStudio,
};

/* ---------- scene ---------- */

export function createScene(canvas, { kind = 'pearls', interactive = false, fit } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !interactive });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, interactive ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9);

  const key = new THREE.DirectionalLight(0xfff1f4, 2.4);
  key.position.set(3.5, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 14;
  key.shadow.blurSamples = 20;
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, far: 40 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9fc0, 1.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffe6ee, 0xe08aa6, 0.6));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x8a2048, opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.8;
  ground.receiveShadow = true;

  const rig = new THREE.Group();
  rig.add(ground);
  const obj = new THREE.Group();
  rig.add(obj);
  scene.add(rig);
  const tick = BUILDERS[kind](obj);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (interactive) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const worldH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // fit() lets the page place the object (for example right of the headline)
    const f = fit ? fit(w, h, { worldW: worldH * camera.aspect, worldH, camY: camera.position.y }) : { x: 0, y: 0, scale: 1 };
    rig.position.set(f.x, f.y, 0);
    rig.scale.setScalar(f.scale);
    camera.updateProjectionMatrix();
  }
  resize();

  let running = true;
  let visible = true;
  const clock = new THREE.Clock();
  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    obj.rotation.x = mouse.y * 0.18;
    rig.rotation.y = mouse.x * 0.3;
    tick(t);
    renderer.render(scene, camera);
    if (interactive && visible) requestAnimationFrame(frame);
  }

  if (interactive) {
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  return {
    renderStill(t = 1.2) { tick(t); renderer.render(scene, camera); },
    stop() { running = false; },
    resize,
  };
}
