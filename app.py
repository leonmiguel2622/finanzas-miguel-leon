#!/usr/bin/env python3
"""Wrapper raíz para Render cuando Start Command = app.py (sin uvicorn).
Hace que 'app.py' funcione aunque Render haga 'bash -c app.py' y también vía 'python app.py'."""
import os
import sys

# Asegura que backend sea importable tanto desde raíz como desde backend
ROOT = os.path.dirname(__file__)
BACKEND = os.path.join(ROOT, "backend")
for p in (ROOT, BACKEND):
    if p not in sys.path:
        sys.path.insert(0, p)

# Carga backend.app
try:
    from backend.app import app  # noqa: F401
except ImportError:
    from app import app  # fallback si Root Directory=backend

def main():
    import uvicorn
    # respeta PORT de Render, si no usa API_PORT de config/.env (8000 local)
    try:
        from backend.config import API_PORT as CFG_PORT
    except ImportError:
        try:
            from config import API_PORT as CFG_PORT
        except ImportError:
            CFG_PORT = 8000
    port = int(os.getenv("PORT") or os.getenv("API_PORT") or str(CFG_PORT))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
