"""Assemble the three pages from partials: python3 monroe/tools/build.py"""
from pathlib import Path

here = Path(__file__).parent
root = here.parent
head = (here / 'partials/head.html').read_text()
foot = (here / 'partials/foot.html').read_text()

pages = {
    'index.html': ('home', 'home.html', 'MONROE / Beauty salon in Stuttgart',
                   'Nails, lashes, brows, hair, skin and make-up in one pink salon in Stuttgart. Set prices, all listed online.',
                   '<script type="module" src="hero.js"></script>'),
    'menu.html': ('menu', 'menu.html', 'Prices / MONROE Beauty Salon Stuttgart',
                  'Full price list of MONROE in Stuttgart: nails, lashes and brows, hair, skin and make-up, with times.', ''),
    'studio.html': ('studio', 'studio.html', 'Studio and booking / MONROE Stuttgart',
                    'How we work, opening hours and how to book a visit at MONROE in Stuttgart.', ''),
}

for out, (key, part, title, desc, scripts) in pages.items():
    h = head.replace('{{title}}', title).replace('{{desc}}', desc).replace('{{page}}', key)
    for k in ('home', 'menu', 'studio'):
        h = h.replace('{{cur-%s}}' % k, ' aria-current="page"' if k == key else '')
    body = (here / 'partials' / part).read_text()
    f = foot.replace('{{scripts}}', scripts)
    (root / out).write_text(h + '\n' + body + '\n' + f)
    print('wrote', out)
