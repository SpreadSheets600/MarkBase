#!/usr/bin/env bash
# MarkBase - validate manifest + JS syntax, then zip the extension → dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'EOF'
import json
m = json.load(open("extension/manifest.json"))
required = {"manifest_version", "name", "version", "background", "action", "permissions"}
missing = required - m.keys()
assert not missing, f"manifest missing: {missing}"
print("✓ manifest valid -", m["name"], "v" + m["version"])
EOF

node --check extension/background.js && echo "✓ background.js syntax OK"
node --check extension/popup.js && echo "✓ popup.js syntax OK"
node --check extension/dwell.js && echo "✓ dwell.js syntax OK"
[[ -d capture/node_modules ]] || (cd capture && npm ci --silent)
(cd capture && node build.mjs)

mkdir -p dist
rm -f dist/markbase-extension-v*.zip
VERSION=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
OUT="dist/markbase-extension-v${VERSION}.zip"
python3 - "$VERSION" "$OUT" <<'EOF'
import sys, zipfile, os
version, out = sys.argv[1], sys.argv[2]
os.makedirs("dist", exist_ok=True)
try:
    import shutil
    if shutil.which("zip"):
        r = os.system(f'cd extension && zip -qr "../{out}" . -x "*.DS_Store"')
        if r != 0:
            raise RuntimeError("zip failed")
    else:
        raise RuntimeError("no zip binary")
except Exception:
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk("extension"):
            for f in files:
                p = os.path.join(root, f)
                z.write(p, os.path.relpath(p, "extension"))
print(f"✅ Packed: {out} ({os.path.getsize(out)//1024} KB) - upload as-is to the Chrome Web Store or load extension/ unpacked.")
EOF
echo "📦 Extension build complete → $PWD/$OUT"
