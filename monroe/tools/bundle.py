"""Build monroe.html: the whole site in one self-contained file.

Fonts, images, three.js and all scripts are inlined; the three pages become
views inside one document and keep the curtain transition.
Run after build.py:  python3 monroe/tools/bundle.py
"""
import base64
import re
from pathlib import Path

here = Path(__file__).parent
root = here.parent
parts = here / 'partials'


def data_url(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(Path(path).read_bytes()).decode())


def js_url(text):
    return 'data:text/javascript;base64,' + base64.b64encode(text.encode()).decode()


css = (root / 'styles.css').read_text()
css = re.sub(r'url\("(assets/fonts/[^"]+\.woff2)"\)',
             lambda m: 'url("%s")' % data_url(root / m.group(1), 'font/woff2'), css)

head = (parts / 'head.html').read_text()
head = re.sub(r'<link rel="preload"[^>]*>\n', '', head)
head = head.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '</style>')
head = re.sub(r"  try \{ if \(sessionStorage.*\n", '', head)
head = head.replace('{{title}}', 'MONROE / Beauty salon in Stuttgart')
head = head.replace('{{desc}}', 'Nails, lashes, brows, hair, skin and make-up in one pink salon in Stuttgart. Set prices, all listed online.')
head = head.replace('<body class="page page--{{page}}">', '<body class="page page--home" data-spa>')
head = head.replace('{{cur-home}}', ' aria-current="page"').replace('{{cur-menu}}', '').replace('{{cur-studio}}', '')

views = []
for vid, page, part in (('home', 'home', 'home.html'), ('prices', 'menu', 'menu.html'), ('studio', 'studio', 'studio.html')):
    body = (parts / part).read_text().strip()
    body = body.replace('<main>', '<div class="view" id="%s" data-page="%s"%s>' % (vid, page, '' if vid == 'home' else ' hidden'), 1)
    body = body[: body.rfind('</main>')] + '</div>'
    views.append(body)

vendor = root / 'assets/vendor'
three = (vendor / 'three.module.min.js').read_text()
room = (vendor / 'RoomEnvironment.js').read_text().replace("'./three.module.min.js'", "'three'")
importmap = '<script type="importmap">{"imports":{"three":"%s","three/room":"%s"}}</script>' % (js_url(three), js_url(room))

scene = (root / 'assets/scene.js').read_text()
scene = scene.replace("from './vendor/three.module.min.js'", "from 'three'")
scene = scene.replace("from './vendor/RoomEnvironment.js'", "from 'three/room'")
scene = scene.replace('export function createScene', 'function createScene')
hero = (root / 'hero.js').read_text().replace("import('./assets/scene.js')", 'Promise.resolve({ createScene })')

foot = (parts / 'foot.html').read_text()
foot = foot.replace('<script src="main.js"></script>', '<script>\n' + (root / 'main.js').read_text() + '</script>')
foot = foot.replace('{{scripts}}', importmap + '\n<script type="module">\n' + scene + '\n' + hero + '</script>')

html = head + '\n<main>\n' + '\n'.join(views) + '\n</main>\n\n' + foot

# page links become view and section ids
for a, b in (('index.html', '#home'), ('menu.html#', '#'), ('menu.html', '#prices'),
             ('studio.html#', '#'), ('studio.html', '#studio')):
    html = html.replace('href="%s' % a, 'href="%s' % b)

html = re.sub(r'(src|data-img)="(assets/img/[^"]+\.webp)"',
              lambda m: '%s="%s"' % (m.group(1), data_url(root / m.group(2), 'image/webp')), html)

(root / 'monroe.html').write_text(html)
print('wrote monroe.html, %.2f MB' % (len(html.encode()) / 1e6))
