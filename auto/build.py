"""Build a single self-contained HTML file (styles, script, fonts and car photos inlined).

    python3 auto/build.py        → writes noctis-motors.html in the repo root
"""
import base64, re
from pathlib import Path

AUTO = Path(__file__).resolve().parent
ROOT = AUTO.parent
MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2'}


def data_uri(path: Path) -> str:
    return f'data:{MIME[path.suffix.lower()]};base64,' + base64.b64encode(path.read_bytes()).decode()


html = (AUTO / 'index.html').read_text(encoding='utf-8')
css = (AUTO / 'styles.css').read_text(encoding='utf-8')
js = (AUTO / 'main.js').read_text(encoding='utf-8')

css = re.sub(r'url\("\.\./(assets/fonts/[^"]+)"\)', lambda m: f'url("{data_uri(ROOT / m.group(1))}")', css)


def photo(m):
    path = AUTO / m.group(2)
    # no photo yet → drop the <img>; the card keeps its silhouette and nothing 404s
    return m.group(1) + data_uri(path) + m.group(3) if path.exists() else ''


html = re.sub(r'(\s*<img src=")(assets/cars/[^"]+)("[^>]*>)', photo, html)
html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
html = html.replace('<script src="main.js" defer></script>', f'<script>\n{js}\n</script>')

out = ROOT / 'noctis-motors.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {len(html) // 1024} KB')
