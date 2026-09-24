"""
main.py - Signal Scissors Studio Launcher

Usage:
    python main.py              -> Launches Modern React Studio UI (Default, 60 FPS, No Lag)
    python main.py --legacy-gui -> Launches Original Tkinter Desktop GUI (Fallback)
"""

import sys
import os
import socket
import webbrowser
import threading
import time
import subprocess
import shutil

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

project_root = os.path.abspath(os.path.join(backend_dir, ".."))

# ------------------------------------------------------------
# Auto‑detect FFmpeg installed via winget (Gyan.FFmpeg) and
# add its bin directory to the process PATH if it is not already
# discoverable. This ensures `shutil.which('ffmpeg')` and
# `shutil.which('ffprobe')` succeed even when the installer did
# not modify the global PATH.
# ------------------------------------------------------------
import glob

def _add_winget_ffmpeg_to_path():
    # If FFmpeg is already on PATH, nothing to do.
    if shutil.which('ffmpeg') and shutil.which('ffprobe'):
        return
    # Look for the typical winget package location.
    possible_dirs = glob.glob(
        os.path.expanduser(r'~\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*-full_build\bin')
    )
    if possible_dirs:
        # Choose the newest version (last in sorted list).
        ffmpeg_bin = sorted(possible_dirs)[-1]
        os.environ['PATH'] = ffmpeg_bin + os.pathsep + os.environ.get('PATH', '')
        # Also expose explicit env vars used by NoiseService.
        os.environ.setdefault('NOISE_FFMPEG_PATH', 'ffmpeg')
        os.environ.setdefault('NOISE_FFPROBE_PATH', 'ffprobe')
        # Debug output so the user can see what happened.
        print(f"[INFO] Added winget FFmpeg bin to PATH: {ffmpeg_bin}")
    else:
        print('[WARNING] FFmpeg not found in PATH and winget location not detected.')

_add_winget_ffmpeg_to_path()

frontend_dir = os.path.join(project_root, "frontend")
frontend_dist = os.path.join(frontend_dir, "dist")

def find_available_port(start_port=8000, max_attempts=25):
    """Finds the first available TCP port on 127.0.0.1 starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port

def build_frontend_if_needed():
    """Builds the React frontend if dist is missing, outdated, or --build flag is supplied."""
    index_html = os.path.join(frontend_dist, "index.html")
    needs_build = not os.path.exists(index_html)

    if not needs_build and os.path.exists(index_html):
        dist_mtime = os.path.getmtime(index_html)
        src_dir = os.path.join(frontend_dir, "src")
        if os.path.exists(src_dir):
            for root, _, files in os.walk(src_dir):
                for f in files:
                    if os.path.getmtime(os.path.join(root, f)) > dist_mtime:
                        needs_build = True
                        break
                if needs_build:
                    break

    if "--build" in sys.argv:
        needs_build = True

    if needs_build and os.path.exists(frontend_dir):
        print("Building latest React Studio UI bundle...", flush=True)
        try:
            if os.name == "nt":
                subprocess.run("cmd /c npm run build", cwd=frontend_dir, shell=True, check=True)
            else:
                npm_cmd = shutil.which("npm") or "npm"
                subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
            print("✓ Frontend build completed successfully.", flush=True)
        except Exception as e:
            print(f"Note: Could not build frontend automatically ({e}). Serving existing bundle.", flush=True)

def run_legacy_gui():
    print("Launching legacy Tkinter GUI...", flush=True)
    from gui import main as legacy_main
    legacy_main()

def run_react_studio():
    build_frontend_if_needed()

    import uvicorn
    from server import app

    host = "127.0.0.1"
    port = find_available_port(8000)
    url = f"http://{host}:{port}"

    print("=" * 68, flush=True)
    print("  SIGNAL SCISSORS — CSE 220 DSP STUDIO WORKSTATION", flush=True)
    print("=" * 68, flush=True)
    print(f"  • React Studio Interface : {url}", flush=True)
    print(f"  • API Documentation      : {url}/docs", flush=True)
    print(f"  • Running DSP Engine     : Python (fourier_filter.py, audio_effects.py)", flush=True)
    print("=" * 68, flush=True)
    print("Opening browser automatically...", flush=True)

    def open_browser():
        import urllib.request
        health_url = f"{url}/api/health"
        deadline = time.time() + 60  # wait up to 60s
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(health_url, timeout=2) as resp:
                    if resp.status == 200:
                        break
            except Exception:
                pass
            time.sleep(0.5)
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Note: Could not open browser automatically: {e}", flush=True)

    threading.Thread(target=open_browser, daemon=True).start()

    # Start FastAPI server serving static React dist + DSP API
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    if "--legacy-gui" in sys.argv or "--gui" in sys.argv:
        run_legacy_gui()
    else:
        run_react_studio()