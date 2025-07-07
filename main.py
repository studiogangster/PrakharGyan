from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import Query
from fastapi.responses import JSONResponse
import os

import fitz  # PyMuPDF

import threading
import time
import sys

# --- Watchdog for directory monitoring ---
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Please install watchdog: pip install watchdog", file=sys.stderr)
    Observer = None
    FileSystemEventHandler = object

WATCH_DIR = "pdf_storage"  # Directory to monitor
OUTPUT_GEN_IMAGE_DIR = "pdf_image_storage"  # Directory to monitor

class ChangeHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        print(f"[WATCHDOG] {event.event_type}: {event.src_path}")

def start_watcher():
    if Observer is None:
        print("Watchdog not installed, skipping directory monitoring.", file=sys.stderr)
        return
    event_handler = ChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=True)
    observer.start()
    print(f"[WATCHDOG] Monitoring directory: {WATCH_DIR}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

def run_watcher_in_thread():
    t = threading.Thread(target=start_watcher, daemon=True)
    t.start()




app = FastAPI()

# Start the background watcher on startup
@app.on_event("startup")
def startup_event():
    run_watcher_in_thread()

# Mount the public directory at the root `/`

@app.get("/newspaper")
async def list_newspaprt():
    return {"message": "Hello, World!"}






@app.get("/api/filesystem")
async def filesystem(
    path: str = Query("", description="Relative path within pdf_storage"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):

    # Sanitize and resolve path
    safe_path = os.path.normpath(os.path.join(OUTPUT_GEN_IMAGE_DIR, path))
    if not safe_path.startswith(OUTPUT_GEN_IMAGE_DIR):
        return JSONResponse(status_code=400, content={"error": "Invalid path"})

    if not os.path.exists(safe_path) or not os.path.isdir(safe_path):
        return JSONResponse(status_code=404, content={"error": "Directory not found"})

    # List directories and files
    entries = []
    try:
        for entry in os.scandir(safe_path):
            if entry.is_dir():
                entries.append({"name": entry.name, "type": "directory"})
        for entry in os.scandir(safe_path):
            if entry.is_file():
                entries.append({"name": entry.name, "type": "file"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    # Pagination
    total = len(entries)
    start = (page - 1) * page_size
    end = start + page_size
    paged_entries = entries[start:end]
    has_more = end < total

    return {
        "path": os.path.relpath(safe_path, OUTPUT_GEN_IMAGE_DIR),
        "items": paged_entries,
        "page": page,
        "page_size": page_size,
        "has_more": has_more
    }


app.mount("/", StaticFiles(directory="public", html=True), name="static")
