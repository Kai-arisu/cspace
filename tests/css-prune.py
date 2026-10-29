"""Removes CSS declarations that can never apply because a later rule, for the exact same
selector and the same @media context, sets the same property with equal or higher priority.
Works across the stylesheets in cascade order: base.css, then src/styles/ORDER.
Run with --write to change the files; without it, it only reports."""
import sys, re, tinycss2

D = 'src/styles/'
order = ['base.css'] + [l.strip() for l in open(D + 'ORDER') if l.strip() and not l.startswith('#')]

def norm(s): return re.sub(r'\s+', ' ', s).strip()

def split_top(prelude):
    parts, depth, cur = [], 0, ''
    for ch in prelude:
        if ch in '([': depth += 1
        if ch in ')]': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur); return [norm(p) for p in parts]

# pass 1: collect every declaration with its position
decls = []   # (file, rule_index_path, ctx, selectors, prop, important, seq)
seq = 0
def collect(fi, rules, ctx, path):
    global seq
    for ri, r in enumerate(rules):
        if r.type == 'qualified-rule':
            sels = split_top(tinycss2.serialize(r.prelude))
            for d in tinycss2.parse_declaration_list(r.content, skip_whitespace=True, skip_comments=True):
                if d.type == 'declaration':
                    decls.append((fi, path + (ri,), ctx, tuple(sels), d.lower_name if not d.name.startswith('--') else d.name, d.important, seq)); seq += 1
        elif r.type == 'at-rule' and r.lower_at_keyword in ('media', 'supports') and r.content is not None:
            collect(fi, tinycss2.parse_rule_list(r.content, skip_whitespace=False, skip_comments=False), ctx + (r.lower_at_keyword + norm(tinycss2.serialize(r.prelude)),), path + (ri,))

sheets = {}
for fi, f in enumerate(order):
    css = open(D + f, encoding='utf-8').read(); sheets[f] = css
    collect(fi, tinycss2.parse_stylesheet(css, skip_whitespace=False, skip_comments=False), (), ())

# the latest priority each (ctx, selector, prop) reaches from each position onward
dead = set()
best = {}   # (ctx, sel, prop) -> list of (seq, important) of later declarations
for (fi, path, ctx, sels, prop, imp, s) in reversed(decls):
    def overridden(sel):
        for (s2, imp2, where) in best.get((ctx, sel, prop), []):
            # a repeat inside the same rule is a deliberate fallback (height:100vh;height:100dvh): keep it
            if s2 > s and where != (fi, path) and (imp2 or not imp): return True
        return False
    if all(overridden(sel) for sel in sels):
        dead.add((fi, path, prop, s))
    for sel in sels:
        best.setdefault((ctx, sel, prop), []).append((s, imp, (fi, path)))

# pass 2: rewrite without the dead declarations
removed = {f: 0 for f in order}
seq = 0
def rewrite(fi, rules, path):
    global seq
    out = []
    for ri, r in enumerate(rules):
        p = path + (ri,)
        if r.type == 'qualified-rule':
            items = tinycss2.parse_declaration_list(r.content, skip_whitespace=True, skip_comments=True)
            keep = []
            for d in items:
                if d.type != 'declaration': continue
                name = d.lower_name if not d.name.startswith('--') else d.name
                if (fi, p, name, seq) in dead: removed[order[fi]] += 1
                else: keep.append(d.name + ':' + tinycss2.serialize(d.value).strip() + ('!important' if d.important else ''))
                seq += 1
            if keep:
                out.append(norm(tinycss2.serialize(r.prelude)) + '{' + ';'.join(keep) + '}')
            continue
        if r.type == 'at-rule' and r.lower_at_keyword in ('media', 'supports') and r.content is not None:
            inner = rewrite(fi, tinycss2.parse_rule_list(r.content, skip_whitespace=False, skip_comments=False), p)
            if inner: out.append('@' + r.at_keyword + ' ' + norm(tinycss2.serialize(r.prelude)) + '{\n' + '\n'.join(inner) + '\n}')
            continue
        if r.type == 'comment':
            out.append('/*' + r.value + '*/'); continue
        if r.type in ('whitespace',): continue
        out.append(tinycss2.serialize([r]).strip())
    return out

for fi, f in enumerate(order):
    new = '\n'.join(rewrite(fi, tinycss2.parse_stylesheet(sheets[f], skip_whitespace=False, skip_comments=False), ())) + '\n'
    print('%-16s %4d overridden declarations removed, %6d -> %6d bytes' % (f, removed[f], len(sheets[f]), len(new)))
    if '--write' in sys.argv: open(D + f, 'w', encoding='utf-8').write(new)
print('total', sum(removed.values()))
