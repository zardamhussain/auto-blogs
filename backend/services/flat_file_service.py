from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List
from threading import Lock

class FlatFileService:
    """Very small helper around a single JSON file used for quick prototyping.

    NOT intended for production  the whole file is read & written on every call.
    A coarse in-process lock is used to avoid write races when running under Uvicorn
    with multiple workers.  For multi-process safety you would need an OS lock 
    out-of-scope for this spike.
    """

    _lock: Lock = Lock()

    def __init__(self, path: Path | str):
        self.path = Path(path)
        # Ensure file exists
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------
    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        try:
            return json.loads(self.path.read_text())
        except json.JSONDecodeError:
            # Corrupted file – start fresh during dev (do *not* do this in prod!)
            return {}

    def _save(self, data: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------
    def get(self, key: str, default: Any = None) -> Any:
        """Return the value stored under *key* (deep copy is *not* done)."""
        with self._lock:
            return self._load().get(key, default)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            data = self._load()
            data[key] = value
            self._save(data)

    def append(self, key: str, item: Any) -> None:
        with self._lock:
            data = self._load()
            arr: List[Any] = data.get(key, [])
            arr.append(item)
            data[key] = arr
            self._save(data)

    # Convenience: append and return stored object (may mutate caller with dict copy)
    def append_and_get(self, key: str, item: Dict[str, Any]) -> Dict[str, Any]:
        self.append(key, item)
        return item 