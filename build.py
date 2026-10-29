"""Builds the website (public/) from the source in src/.

  src/index.html      the page, with {{placeholders}} for the parts below
  src/shell.html      the app's own markup: sidebar, top bar, the main column, dialogs
  src/app/            the app script, one file per feature, joined in src/app/ORDER
  src/ts/             screens written in TypeScript, compiled with esbuild into the same script
  src/styles/         stylesheets, base.css in the head, the rest joined in src/styles/ORDER
  src/boot/boot.js    sign-in, the storage layer the app talks to, public pages
  src/landing/        the page signed-out visitors see, and its illustrations
  src/sw.js           the service worker (offline + push), stamped with a version

Run:  python3 build.py
"""
import re, os, shutil, json, hashlib, subprocess
from PIL import Image, ImageDraw

base = os.path.dirname(os.path.abspath(__file__)) + '/'
SRC = base + 'src/'

def read(p): return open(SRC + p, encoding='utf-8').read()
def ordered(folder):
    names = [l.strip() for l in read(folder + '/ORDER').splitlines() if l.strip() and not l.startswith('#')]
    missing = [n for n in names if not n.startswith('@') and not os.path.exists(SRC + folder + '/' + n)]
    assert not missing, 'listed in ORDER but missing: %s' % missing
    return names

# the TypeScript screens, compiled into one block that joins the app's scope
def typescript():
    r = subprocess.run(['npx', 'esbuild', SRC + 'ts/index.ts', '--bundle', '--format=iife', '--global-name=TS',
                        '--target=es2019', '--charset=utf8', '--log-level=warning'], cwd=base, capture_output=True, text=True)
    assert r.returncode == 0, 'esbuild failed:\n' + r.stderr
    return '/* ---------- compiled from src/ts ---------- */\n' + r.stdout.rstrip('\n')

# the app script: files joined in order, sharing one scope
app = '\n'.join(typescript() if n == '@ts' else read('app/' + n)[:-1] for n in ordered('app'))
css = '\n'.join(read('styles/' + n) for n in ordered('styles'))
landing = re.sub(r'\{\{ill:(\w+)\}\}', lambda m: read('landing/ill/' + m.group(1) + '.svg').strip(), read('landing/landing.html'))
parts = {'shell': read('shell.html'), 'app': app, 'css': css, 'landing': landing, 'boot': read('boot/boot.js'),
         'landingjs': read('landing/landing.js'), 'basecss': read('styles/base.css')}

out = read('index.html')
for k, v in parts.items():
    ph = '{{' + k + '}}'
    assert out.count(ph) == 1, ph
    out = out.replace(ph, v)
assert '{{' not in re.sub(r'<script type="text/plain" id="appjs">.*?</script>', '', out, flags=re.S).split('<div id="landing"')[0], 'unfilled placeholder'

os.makedirs(base + 'public', exist_ok=True)
open(base + 'public/index.html', 'w', encoding='utf-8').write(out)

# vendored scripts, fonts, landing pictures
for a, b in [('supabase.js', 'supabase.js'), ('591.supabase.js', '591.supabase.js'),
             ('fonts/geist-latin-wght-normal.woff2', 'geist.woff2'),
             ('fonts/instrument-sans-latin-wght-normal.woff2', 'is.woff2'),
             ('fonts/instrument-sans-latin-ext-wght-normal.woff2', 'is-ext.woff2'),
             ('fonts/instrument-serif-latin-400-normal.woff2', 'iserif.woff2'),
             ('fonts/jost-latin-wght-normal.woff2', 'jost.woff2'),
             ('fonts/jost-latin-ext-wght-normal.woff2', 'jost-ext.woff2'),
             ('fonts/young-serif-latin-400-normal.woff2', 'young.woff2')]:
    shutil.copy(base + 'vendor/' + a, base + 'public/' + b)
os.makedirs(base + 'public/lp', exist_ok=True)
for f in os.listdir(base + 'vendor/lp'): shutil.copy(base + 'vendor/lp/' + f, base + 'public/lp/' + f)

# home-screen icons and manifest
def icon(n, pad):
    im = Image.new('RGB', (n, n), (255, 194, 26)); d = ImageDraw.Draw(im)
    r = n * (0.5 - pad); c = n / 2; w = max(2, int(n * 0.1))
    d.arc([c - r * 0.55, c - r * 0.55, c + r * 0.55, c + r * 0.55], 40, 320, fill=(28, 26, 23), width=w)
    return im
icon(192, 0.1).save(base + 'public/icon-192.png'); icon(512, 0.1).save(base + 'public/icon-512.png'); icon(512, 0.2).save(base + 'public/icon-maskable.png')
open(base + 'public/manifest.webmanifest', 'w').write(json.dumps({"name": "Creator Space", "short_name": "Creator", "start_url": "/", "scope": "/", "display": "standalone", "background_color": "#FFFFFF", "theme_color": "#FFFFFF", "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}))

# service worker, versioned by the page so each release replaces the cache
open(base + 'public/sw.js', 'w').write(read('sw.js').replace('{{version}}', hashlib.sha1(out.encode()).hexdigest()[:10]))

# files the syntax check in CI reads, and a standalone app page the sync-engine test (t19) drives
os.makedirs(base + 'build', exist_ok=True)
open(base + 'build/standalone.html', 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><title>Creator Space</title><style>' + parts['basecss'] + '</style></head><body>' + parts['shell'] + '<script>' + app + '</script></body></html>')
open(base + 'build/check-app.js', 'w').write(app); open(base + 'build/check-boot.js', 'w').write(parts['boot'])
print('built', len(out))
