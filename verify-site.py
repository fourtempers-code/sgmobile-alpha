from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
site=root/'site'
expected=json.loads((root/'SITE_SHA256.json').read_text())
actual={}
for p in site.rglob('*'):
    if p.is_symlink():raise SystemExit('Linked app content is forbidden')
    if p.is_file():actual[p.relative_to(site).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
    elif not p.is_dir():raise SystemExit('Special app file is forbidden')
if actual!=expected:raise SystemExit('App inventory/hash mismatch; do not deploy')
print('Verified',len(actual),'selected app files')
