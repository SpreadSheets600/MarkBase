#!/usr/bin/env python3
"""Generate MarkBase README header image (SVG + PNG) with logo, name, and description."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

SVG_PATH = ASSETS / "header.svg"
PNG_PATH = ASSETS / "header.png"

# Dimensions
WIDTH = 1280
HEIGHT = 340

svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}">
  <defs>
    <!-- Background glow -->
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#4f46e5" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="0"/>
    </radialGradient>

    <!-- Logo squircle gradient -->
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="50%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>

    <!-- Drop shadows -->
    <filter id="logoShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#7c3aed" flood-opacity="0.4"/>
    </filter>
    <filter id="ribbonShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1e1035" flood-opacity="0.4"/>
    </filter>
  </defs>

  <style>
    .title {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 700;
      font-size: 52px;
      letter-spacing: -0.03em;
      fill: #ffffff;
      text-anchor: middle;
    }}
    .subtitle {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      font-size: 20px;
      letter-spacing: -0.01em;
      fill: #a1a1aa;
      text-anchor: middle;
    }}
  </style>

  <!-- Canvas background -->
  <rect width="{WIDTH}" height="{HEIGHT}" rx="16" fill="#09090b"/>
  <rect width="{WIDTH}" height="{HEIGHT}" rx="16" fill="url(#glow)"/>
  <rect x="0.5" y="0.5" width="{WIDTH - 1}" height="{HEIGHT - 1}" rx="15.5" fill="none" stroke="#27272a" stroke-width="1"/>

  <!-- Logo Mark centered at X=640, Y=48 -->
  <g transform="translate(586, 48)" filter="url(#logoShadow)">
    <!-- Squircle container 108x108 -->
    <rect width="108" height="108" rx="28" fill="url(#logoGrad)"/>
    <rect width="108" height="108" rx="28" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>

    <!-- Bookmark ribbon (scaled from 512 canvas: factor 108/512 = 0.2109375) -->
    <g transform="scale(0.2109375)" filter="url(#ribbonShadow)">
      <path d="M 178 126 H 334 A 24 24 0 0 1 358 150 V 382 L 256 322 L 154 382 V 150 A 24 24 0 0 1 178 126 Z" fill="#ffffff"/>
    </g>
  </g>

  <!-- Typography -->
  <text x="640" y="222" class="title">MarkBase</text>
  <text x="640" y="264" class="subtitle">Your bookmarks and reading history, everywhere.</text>
</svg>
"""

with open(SVG_PATH, "w", encoding="utf-8") as f:
    f.write(svg_content.strip())
print(f"Generated {SVG_PATH}")

subprocess.run(["rsvg-convert", "-w", str(WIDTH), "-h", str(HEIGHT), str(SVG_PATH), "-o", str(PNG_PATH)], check=True)
print(f"Rendered {PNG_PATH}")
