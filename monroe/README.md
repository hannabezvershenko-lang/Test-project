# MONROE / beauty salon, Stuttgart

Static three-page site in pink: home, price list, studio and booking. No build step for viewing:

```bash
python3 -m http.server 8000
# open http://localhost:8000/monroe/
```

## One file

`monroe.html` is the whole site in a single self-contained file (fonts, images and three.js inlined, works
offline from disk). The three pages become views inside it, with the same curtain transition. Rebuild it with:

```bash
python3 monroe/tools/build.py && python3 monroe/tools/bundle.py
```

## Pages

| File | What it is |
|---|---|
| `index.html` | full-screen hero with live 3D pearls, services with hover previews, first-visit picks, how booking works |
| `menu.html` | full price list: nails, lashes and brows, hair, skin, make-up |
| `studio.html` | how the salon works, opening hours, contacts (`#visit`) |
| `styles.css` | all styles; tokens at the top (colours, 0.3 / 0.5 / 0.6s timings, easing, spacing) |
| `main.js` | page curtain transition, full-screen menu, caps fitted edge to edge, hover images, cursor, reveals |
| `hero.js`, `assets/scene.js` | three.js scene for the hero; the same scene renders the still images |

The header, menu and footer are shared. Edit them in `tools/partials/` and rebuild:

```bash
python3 monroe/tools/build.py
```

## Images

All pictures are our own procedural 3D still lifes (`assets/scene.js`). To re-render them after a change:

```bash
python3 -m http.server 8123 &
node monroe/tools/render.mjs        # needs the playwright package
```

PNGs land in `tools/out/`; convert to WebP into `assets/img/`. Real salon photos can replace them one to one
(4:5 for services, 18:11 for `studio-wide.webp`).

## Replace before going live

Placeholders: phone `+49 711 000 000 00`, WhatsApp link, e-mail `hello@monroe-stuttgart.de`, street address
(only "Stuttgart-Mitte, 70173" is given), opening hours and prices. A German site also needs an Impressum and a
Datenschutzerklärung linked from the footer.

Fonts: Bodoni Moda and Jost (SIL Open Font License), self-hosted in `assets/fonts/`.
