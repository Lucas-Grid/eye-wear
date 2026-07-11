import os, re, html.parser

ROOT = os.path.dirname(os.path.abspath(__file__))
pages = ["index.html", "collection.html", "about.html", "contact.html"]
asset_refs = []
problems = []

def collect(page):
    p = os.path.join(ROOT, page)
    with open(p, encoding="utf-8") as f:
        txt = f.read()
    for m in re.finditer(r'(?:src|href)="([^"]+)"', txt):
        ref = m.group(1)
        if ref.startswith("assets/") or ref.startswith("./assets/"):
            asset_refs.append((page, ref))
        elif ref.startswith("#") or ref.startswith("http") or ref in ("",):
            continue
        elif ref.endswith(".html"):
            # internal page link
            tgt = os.path.join(ROOT, ref)
            if not os.path.exists(tgt):
                problems.append(f"{page}: missing internal link target '{ref}'")

# gather asset refs
for pg in pages:
    collect(pg)

# verify each asset exists
for page, ref in asset_refs:
    path = os.path.normpath(os.path.join(ROOT, ref))
    if not os.path.exists(path):
        problems.append(f"{page}: MISSING asset '{ref}' -> {path}")

# HTML well-formedness (tag balance) per page
class V(html.parser.HTMLParser):
    void = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
    def __init__(self):
        super().__init__(); self.stack=[]; self.err=[]
    def handle_starttag(self, tag, attrs):
        if tag not in self.void: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.void: return
        if self.stack and self.stack[-1]==tag: self.stack.pop()
        else:
            # try to find match
            if tag in self.stack:
                while self.stack and self.stack[-1]!=tag: self.stack.pop()
                if self.stack: self.stack.pop()
            else:
                self.err.append(f"stray </{tag}>")

print("=== ASSET CHECK ===")
print(f"Total asset references: {len(asset_refs)}")
print("=== HTML BALANCE ===")
for pg in pages:
    v = V()
    with open(os.path.join(ROOT, pg), encoding="utf-8") as f:
        v.feed(f.read())
    status = "OK" if not v.stack and not v.err else f"UNBALANCED leftover={v.stack} err={v.err}"
    print(f"  {pg}: {status}")

print("=== PROBLEMS ===")
if problems:
    for p in problems: print("  -", p)
else:
    print("  none 🎉")

# asset inventory
print("=== REPO INVENTORY ===")
for dirpath, dirs, files in os.walk(ROOT):
    if ".git" in dirpath: continue
    for fn in files:
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, ROOT)
        size = os.path.getsize(full)
        print(f"  {rel}  ({size//1024} KB)")
