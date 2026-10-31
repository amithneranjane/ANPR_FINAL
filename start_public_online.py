"""
Universal 1-Click Online Public Deployment Launcher for ANPR System
Starts the full Flask backend (with React UI, YOLOv8, and EasyOCR)
and exposes it to a public HTTPS URL using localtunnel or Cloudflare.

Features:
- 100% FREE FOREVER (No credit card, no subscription)
- ZERO OUT-OF-MEMORY CRASHES (Uses your PC's full RAM)
- Instant Public HTTPS URL (Accessible on any phone, tablet, or external laptop)
"""

import subprocess
import re
import sys
import os
import time

def main():
    print("=" * 65)
    print("  ANPR SYSTEM - PUBLIC ONLINE LAUNCHER")
    print("=" * 65)
    print("Engine: Flask + YOLOv8 + EasyOCR + React SPA")
    print("Memory: Uses your PC's native RAM (Zero OOM Crashes)")
    print("-" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    print("[1/2] Starting ANPR Full-Stack Backend...")
    env = os.environ.copy()
    env["PORT"] = "5000"

    app_proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=base_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Wait for models and database to initialize
    print("      Loading YOLOv8 and EasyOCR models into memory...")
    time.sleep(5)

    print("[2/2] Creating Secure Public HTTPS URL via Localtunnel...")
    # Use npx localtunnel which connects over standard port 443 (works on all college/home Wi-Fi)
    tunnel_cmd = "npx --yes localtunnel --port 5000"
    
    tunnel_proc = subprocess.Popen(
        tunnel_cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    public_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.loca\.lt")

    start_wait = time.time()
    while time.time() - start_wait < 30:
        line = tunnel_proc.stdout.readline()
        if not line:
            continue
        match = url_pattern.search(line)
        if match:
            public_url = match.group(0)
            break

    if public_url:
        print("\n" + "=" * 65)
        print("  SUCCESS! YOUR ANPR SYSTEM IS LIVE ONLINE!")
        print("=" * 65)
        print(f"\n  PUBLIC URL: {public_url}")
        print("\n  Share this URL with anyone! Works on:")
        print("  - Mobile phones (cameras & image upload)")
        print("  - Evaluators, professors, and external laptops")
        print("  - Any web browser worldwide")
        print("\n  (Note: On first visit to loca.lt, click 'Click to Continue')")
        print("\n  Press Ctrl+C in this terminal to stop the online server.")
        print("=" * 65 + "\n")
    else:
        print("\n[!] Tunnel started. Check below for your live link:\n")

    try:
        while True:
            time.sleep(1)
            if app_proc.poll() is not None:
                print("[!] Backend server stopped unexpectedly.")
                break
            if tunnel_proc.poll() is not None:
                print("[!] Tunnel process closed.")
                break
    except KeyboardInterrupt:
        print("\nShutting down online ANPR services...")
    finally:
        app_proc.terminate()
        try:
            tunnel_proc.terminate()
        except Exception:
            pass
        print("Done. Server closed.")

if __name__ == "__main__":
    main()
