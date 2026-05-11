from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


BACKEND_MAIN = Path(__file__).resolve().parent / "sentinel-backend" / "main.py"
SPEC = spec_from_file_location("sentinel_backend_main", BACKEND_MAIN)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load backend app from {BACKEND_MAIN}")

module = module_from_spec(SPEC)
SPEC.loader.exec_module(module)
app = module.app
