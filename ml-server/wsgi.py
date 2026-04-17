"""
wsgi.py
-------
Gunicorn entry point.
Loads the ML model once at startup before any requests are served.
"""

from app import app, load_model

# Load model at import time so every gunicorn worker has it ready
load_model()
