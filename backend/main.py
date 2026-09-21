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

def run_legacy_gui():
    print("Launching legacy Tkinter GUI...")
    from gui import main as legacy_main
    legacy_main()

def run_react_studio():
    # pyrefly: ignore [missing-import]
    import uvicorn
    from server import app

    host = "127.0.0.1"
    port = find_available_port(8000)
    url = f"http://{host}:{port}"

    print("=" * 68)
    print("  SIGNAL SCISSORS — CSE 220 DSP STUDIO WORKSTATION")
    print("=" * 68)
    print(f"  • React Studio Interface : {url}")
    print(f"  • API Documentation      : {url}/docs")
    print(f"  • Running DSP Engine     : Python (fourier_filter.py, audio_effects.py)")
    print("=" * 68)
    print("Opening browser automatically...")

    def open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Note: Could not open browser automatically: {e}")

    threading.Thread(target=open_browser, daemon=True).start()

    # Start FastAPI server serving static React dist + DSP API
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    if "--legacy-gui" in sys.argv or "--gui" in sys.argv:
        run_legacy_gui()
    else:
        run_react_studio()