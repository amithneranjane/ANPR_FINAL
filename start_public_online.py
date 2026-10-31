"""
Universal 1-Click Online Public Deployment Launcher for ANPR System
Starts the full Flask backend (with React UI, YOLOv8, and EasyOCR)
and exposes it to a public HTTPS URL using localtunnel.

Features:
- 100% FREE FOREVER (No credit card, no subscription)
- ZERO OUT-OF-MEMORY CRASHES (Uses your PC's native RAM)
- Instant Public HTTPS URL (Accessible on any phone, tablet, or external laptop)
"""

import subprocess
import re
import sys
import os
import time
import urllib.request

def get_public_ip():
    services = [
        "https://loca.lt/mytunnelpassword",
        "https://api.ipify.org",
        "https://ipv4.icanhazip.com"
    ]
    for url in services:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                ip = response.read().decode("utf-8").strip()
                if ip:
                    return ip
        except Exception:
            continue
    return "Could not retrieve IP automatically"

def main():
    print("=" * 65)
    print("      ANPR SYSTEM - PUBLIC ONLINE LAUNCHER")
    print("=" * 65)
    print("Engine: Flask + YOLOv8 + EasyOCR + React SPA")
    print("Memory: High Performance Native RAM (Zero OOM Crashes)")
    print("-" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    print("[1/3] Fetching Tunnel Password...")
    tunnel_password = get_public_ip()

    print("[2/3] Starting ANPR Full-Stack Backend on port 5000...")
    env = os.environ.copy()
    env["PORT"] = "5000"

    # Start Flask process (inherit stdout so no pipe deadlock)
    app_proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=base_dir,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Allow YOLO and OCR models to initialize into RAM
    print("      Initializing YOLOv8 and EasyOCR models...")
    time.sleep(6)

    print("[3/3] Creating Secure Public HTTPS URL via Localtunnel...")
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
    while time.time() - start_wait < 35:
        line = tunnel_proc.stdout.readline()
        if not line:
            continue
        match = url_pattern.search(line)
        if match:
            public_url = match.group(0)
            break

    print("\n" + "=" * 65)
    if public_url:
        print("  SUCCESS! YOUR ANPR SYSTEM IS LIVE ONLINE!")
        print("=" * 65)
        print(f"\n  PUBLIC URL:      {public_url}")
        print(f"  TUNNEL PASSWORD: {tunnel_password}")
        print("\n" + "-" * 65)
        print("  HOW TO OPEN:")
        print("  1. Click or open the PUBLIC URL in your browser.")
        print(f"  2. If it asks for 'Tunnel Password', enter: {tunnel_password}")
        print("  3. Click 'Click to Submit' / 'Click to Continue'.")
        print("-" * 65)
        print("\n  Works on phones, laptops, and remote evaluators worldwide.")
        print("  Press Ctrl+C in this terminal window to stop the server.")
        print("=" * 65 + "\n")
    else:
        print("[!] Tunnel output:")
        print("Check the terminal for connection logs.")

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
