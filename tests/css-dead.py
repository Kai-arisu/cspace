"""Finds (and with --write removes) CSS selectors that can never match: they name a class or id
that appears nowhere in the app's source. Dynamic names built like "k-"+kind count as used
when their prefix is built in code."""
import sys, os, re, glob
import tinycss2

SRC = 'src/'
code = ''
for p in glob.glob(SRC + 'app/**/*.js', recursive=True) + glob.glob(SRC + 'ts/**/*.ts', recursive=True) + \
         [SRC + 'boot/boot.js', SRC + 'landing/landing.js', SRC + 'landing/landing.html', SRC + 'shell.html', SRC + 'index.html'] + \
         glob.glob(SRC + 'landing/ill/*.svg'):
    code += open(p, encoding='utf-8').read() + '\n'
# prefixes used to build names in code: "k-"+x, 'l-'+x, `ic-${x}`
dyn = set(re.findall(r'["\'`\s]([a-zA-Z][\w-]*-)["\']\s*\+', code)) | set(re.findall(r'([a-zA-Z][\w-]*-)\$\{', code))

def used(name):
    if re.search(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', code): return True
    return any(name.startswith(p) for p in dyn)

def selector_dead(sel):
    names = re.findall(r'[.#](-?[A-Za-z_][\w-]*)', re.sub(r'\[[^\]]*\]', '', re.sub(r':(?:not|is|where|has)\(', '(', sel)))
    # names inside :not() don't need to exist for the selector to match
    neg = set(re.findall(r':not\(\s*[.#](-?[A-Za-z_][\w-]*)', sel))
    return [n for n in names if n not in neg and not used(n)]

def process(css):
    rules = tinycss2.parse_stylesheet(css, skip_whitespace=False, skip_comments=False)
    removed = []
    def walk(rules):
        out = []
        for r in rules:
            if r.type == 'qualified-rule':
                prelude = tinycss2.serialize(r.prelude)
                sels = [s.strip() for s in split_top(prelude)]
                keep = [s for s in sels if not selector_dead(s) or '%' in s or s in ('from', 'to')]
                if not keep:
                    removed.append(prelude.strip()); continue
                if len(keep) < len(sels):
                    removed.extend(s for s in sels if s not in keep)
                    lead = prelude[:len(prelude) - len(prelude.lstrip())]
                    out.append(lead + ','.join(keep) + '{' + tinycss2.serialize(r.content) + '}'); continue
                out.append(tinycss2.serialize([r])); continue
            if r.type == 'at-rule' and r.lower_at_keyword in ('media', 'supports') and r.content is not None:
                inner = walk(tinycss2.parse_rule_list(r.content, skip_whitespace=False, skip_comments=False))
                if not ''.join(inner).strip(): removed.append('@' + r.at_keyword + tinycss2.serialize(r.prelude) + ' (now empty)'); continue
                out.append('@' + r.at_keyword + tinycss2.serialize(r.prelude) + '{' + ''.join(inner) + '}'); continue
            out.append(tinycss2.serialize([r]))
        return out
    return ''.join(walk(rules)), removed

def split_top(prelude):
    parts, depth, cur = [], 0, ''
    for ch in prelude:
        if ch in '([': depth += 1
        if ch in ')]': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur)
    return parts

total = 0
for f in sorted(glob.glob(SRC + 'styles/*.css')):
    css = open(f, encoding='utf-8').read()
    new, removed = process(css)
    total += len(removed)
    print('%-28s %4d dead selectors, %6d -> %6d bytes' % (os.path.basename(f), len(removed), len(css), len(new)))
    if '-v' in sys.argv:
        for r in removed[:400]: print('    ', r[:110])
    if '--write' in sys.argv: open(f, 'w', encoding='utf-8').write(new)
print('total', total)
