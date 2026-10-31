"""
Patch and copy the authentic Render White UI bundle into frontend dist.
"""

import os

base_dir = r"C:\AIPC\ANP"
render_js_path = os.path.join(base_dir, "render_bundle.js")
render_css_path = os.path.join(base_dir, "render_ui.css")

dist_dir = os.path.join(base_dir, "frontend", "frontend", "anpr-frontend", "dist")
dist_assets = os.path.join(dist_dir, "assets")
os.makedirs(dist_assets, exist_ok=True)

with open(render_js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Dynamic origin so it works on localhost, trycloudflare, loca.lt, and onrender
js_patched = js.replace(
    'var L="http://127.0.0.1:5000"',
    'var L=(window.location.origin||"http://127.0.0.1:5000")'
)
js_patched = js_patched.replace(
    'var gr="http://127.0.0.1:5000"',
    'var gr=(window.location.origin||"http://127.0.0.1:5000")'
)
js_patched = js_patched.replace(
    'href:`http://127.0.0.1:5000/backup/export`',
    'href:`/backup/export`'
)

target_js = os.path.join(dist_assets, "index-DU9GZy6T.js")
with open(target_js, "w", encoding="utf-8") as f:
    f.write(js_patched)

with open(render_css_path, "r", encoding="utf-8") as f:
    css = f.read()

target_css = os.path.join(dist_assets, "index-B0J8ZXb0.css")
with open(target_css, "w", encoding="utf-8") as f:
    f.write(css)

index_html = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ANPR System - Vehicle Intelligence</title>
    <script type="module" crossorigin src="/assets/index-DU9GZy6T.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-B0J8ZXb0.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>"""

target_html = os.path.join(dist_dir, "index.html")
with open(target_html, "w", encoding="utf-8") as f:
    f.write(index_html)

print("Successfully installed the White UI from render.com into dist!")
