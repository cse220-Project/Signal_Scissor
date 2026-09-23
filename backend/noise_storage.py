"""Private, expiring files. Only server-generated names are ever resolved/deleted."""

import logging
import re
import secrets
import shutil
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)
TOKEN = re.compile(r"^[a-f0-9]{64}$")


class NoiseStorage:
    def __init__(self, config):
        self.config = config
        # Dedicated children ensure cleanup never sweeps the configured parent.
        self.root = config.storage_dir / "noise-removal-v1"
        self.results = self.root / "results"
        self.work = self.root / "work"

    def prepare(self):
        for path in (self.root, self.results, self.work):
            path.mkdir(parents=True, exist_ok=True, mode=0o700)
            if path.is_symlink():
                raise OSError("Noise storage must not be a symlink")
            path.chmod(0o700)

    @contextmanager
    def workspace(self):
        self.prepare()
        with tempfile.TemporaryDirectory(prefix="job-", dir=self.work) as directory:
            yield Path(directory)

    def publish(self, source):
        token = secrets.token_hex(32)
        target = self.results / f"{token}.wav"
        source.chmod(0o600)
        # Same filesystem: a result becomes visible only after processing completes.
        source.replace(target)
        return token, target

    def resolve(self, token):
        if not TOKEN.fullmatch(token):
            return None
        path = self.results / f"{token}.wav"
        if path.is_symlink() or not path.is_file():
            return None
        if time.time() - path.stat().st_mtime >= self.config.retention:
            return None
        return path

    def cleanup(self):
        self.prepare()
        now = time.time()
        for path in self.results.iterdir():
            try:
                if (
                    path.suffix == ".wav"
                    and TOKEN.fullmatch(path.stem)
                    and not path.is_symlink()
                    and path.is_file()
                    and now - path.stat().st_mtime >= self.config.retention
                ):
                    path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not clean expired noise result", exc_info=True)
        # Normal requests remove their workspace in finally. Reap crash leftovers
        # only after a grace period longer than the entire processing deadline.
        for path in self.work.iterdir():
            try:
                if (
                    re.fullmatch(r"job-[a-z0-9_]+", path.name)
                    and not path.is_symlink()
                    and path.is_dir()
                    and now - path.stat().st_mtime > self.config.timeout + 3600
                ):
                    shutil.rmtree(path)
            except OSError:
                logger.warning(
                    "Could not clean abandoned noise workspace", exc_info=True
                )
