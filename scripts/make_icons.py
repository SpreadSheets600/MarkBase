import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_PATH = os.path.join(BASE_DIR, "scripts", "markbase_icon.svg")

SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="50%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#1e1035" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background: Smooth rounded squircle -->
  <rect x="24" y="24" width="464" height="464" rx="120" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="464" height="464" rx="120" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="6"/>

  <!-- One object: The iconic solid bookmark ribbon -->
  <path d="M 178 126 H 334 A 24 24 0 0 1 358 150 V 382 L 256 322 L 154 382 V 150 A 24 24 0 0 1 178 126 Z" fill="#ffffff" filter="url(#shadow)"/>
</svg>
"""

with open(SVG_PATH, "w") as f:
    f.write(SVG_CONTENT)


def render(size, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    subprocess.run(
        ["rsvg-convert", "-w", str(size), "-h", str(size), SVG_PATH, "-o", out_path],
        check=True,
    )
    print(f"✓ {os.path.relpath(out_path, BASE_DIR)} ({size}x{size})")


# Chrome Extension icons
for sz in (16, 32, 48, 128):
    render(sz, os.path.join(BASE_DIR, "extension", "icons", f"icon{sz}.png"))

# Web App & PWA icons
for sz in (192, 512):
    render(sz, os.path.join(BASE_DIR, "api", "public", "icons", f"icon{sz}.png"))
render(32, os.path.join(BASE_DIR, "api", "public", "favicon.png"))
render(180, os.path.join(BASE_DIR, "api", "public", "apple-touch-icon.png"))

# Create .ico Multi-Resolution Favicon Using ImageMagick
subprocess.run(
    [
        "magick",
        os.path.join(BASE_DIR, "extension", "icons", "icon16.png"),
        os.path.join(BASE_DIR, "extension", "icons", "icon32.png"),
        os.path.join(BASE_DIR, "extension", "icons", "icon48.png"),
        os.path.join(BASE_DIR, "api", "public", "favicon.ico"),
    ],
    check=True,
)
print("api/public/favicon.ico")

# Flutter Web icons
render(32, os.path.join(BASE_DIR, "app", "web", "favicon.png"))
for sz in (192, 512):
    render(sz, os.path.join(BASE_DIR, "app", "web", "icons", f"Icon-{sz}.png"))
    render(sz, os.path.join(BASE_DIR, "app", "web", "icons", f"Icon-maskable-{sz}.png"))

if os.path.exists(os.path.join(BASE_DIR, "api", "public", "app")):
    render(32, os.path.join(BASE_DIR, "api", "public", "app", "favicon.png"))
    for sz in (192, 512):
        render(
            sz,
            os.path.join(BASE_DIR, "api", "public", "app", "icons", f"Icon-{sz}.png"),
        )
        render(
            sz,
            os.path.join(
                BASE_DIR, "api", "public", "app", "icons", f"Icon-maskable-{sz}.png"
            ),
        )

# Android App launcher icons
android_res = os.path.join(BASE_DIR, "app", "android", "app", "src", "main", "res")
android_densities = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
for folder, sz in android_densities.items():
    render(sz, os.path.join(android_res, folder, "ic_launcher.png"))

print("\nMarkBase Icons Generated And Deployed!")
