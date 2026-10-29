"""python3 tests/visual-diff.py <before-dir> <after-dir> : lists screenshots that differ, with the share of pixels changed."""
import sys, os
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]
bad = 0
for f in sorted(os.listdir(a)):
    if not f.endswith('.png'): continue
    if not os.path.exists(os.path.join(b, f)): print('missing', f); bad += 1; continue
    x, y = Image.open(os.path.join(a, f)).convert('RGB'), Image.open(os.path.join(b, f)).convert('RGB')
    if x.size != y.size: print('size differs', f, x.size, y.size); bad += 1; continue
    d = ImageChops.difference(x, y).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = sum(d.histogram()[255:]); share = n / (x.size[0] * x.size[1])
    if n: print('%-60s %.3f%% (%d px) box %s' % (f, share * 100, n, d.getbbox())); bad += 1
print('identical' if not bad else '%d differ' % bad)
