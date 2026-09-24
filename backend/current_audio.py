# backend/current_audio.py
"""Singleton store for the current audio file path used by the app.
It provides a simple in‑memory reference that can be set by the
microphone capture endpoint and read by the noise‑removal service.
"""
import threading
from pathlib import Path

class CurrentAudioStore:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        # Double‑checked locking for thread safety.
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._path = None
        return cls._instance

    def set_path(self, path: Path | str | None) -> None:
        """Set the current audio file path.
        Passing ``None`` clears the store.
        """
        self._path = Path(path) if path is not None else None

    def get_path(self) -> Path | None:
        """Return the stored path, or ``None`` if not set."""
        return self._path

# Export a module‑level singleton for easy import.
current_audio_store = CurrentAudioStore()
