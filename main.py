from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import Query
from fastapi.responses import JSONResponse
import os

import fitz 

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


def flatten_pdf_pages(input_path, output_base_path, input_root="./"):
    """
    Splits a PDF into single-page PDFs.
    - input_path: full path to input PDF
    - output_base_path: root directory for outputs
    - input_root: root directory for input PDFs (for relative path calculation)
    Output structure: output_base_path/<relative_path_of_input>/<input_filename>_page_{n}.pdf
    """
    # Compute relative path of input PDF to input_root
    rel_dir = os.path.dirname(os.path.relpath(input_path, input_root))
    input_filename = os.path.splitext(os.path.basename(input_path))[0]
    output_dir = os.path.join(output_base_path, rel_dir)
    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(input_path)

    for page_number in range(len(doc)):
        single_page_pdf = fitz.open()
        single_page_pdf.insert_pdf(doc, from_page=page_number, to_page=page_number)
        output_path = os.path.join(
            output_dir,
            f"{input_filename}_page_{page_number + 1}.pdf"
        )
        single_page_pdf.save(output_path)
        single_page_pdf.close()

    doc.close()
    print(f"Saved pages to: {output_dir}")




flatten_pdf_pages("pdf_storage/test/Upgrade form.pdf", "test/pdf/out/", "pdf_storage")

import threading

class ChangeHandler(FileSystemEventHandler):
    def on_created(self, event):
        # Only process .pdf files
        if not event.is_directory and event.src_path.lower().endswith(".pdf"):
            print(f"[WATCHDOG] Detected new PDF: {event.src_path}")
            threading.Thread(target=self._wait_for_complete, args=(event.src_path,), daemon=True).start()

    def _wait_for_complete(self, filepath, stable_time=2.0, poll_interval=0.5):
        """
        Wait until the file size is stable for 'stable_time' seconds.
        """
        import time
        last_size = -1
        stable_since = None
        while True:
            try:
                size = os.path.getsize(filepath)
            except Exception:
                size = -1
            now = time.time()
            if size == last_size and size > 0:
                if stable_since is None:
                    stable_since = now
                elif now - stable_since >= stable_time:
                    print(f"[WATCHDOG] PDF is fully written: {filepath}")

                    # Place processing logic here (e.g., call flatten_pdf_pages)
                    break
            else:
                stable_since = None
            last_size = size
            time.sleep(poll_interval)

        flatten_pdf_pages(filepath, "test/pdf/out/", WATCH_DIR)
        




def start_watcher():
    if Observer is None:
        print("Watchdog not installed, skipping directory monitoring.", file=sys.stderr)
        return

    event_handler = ChangeHandler()
    processed_files = set()

    # Initial scan for all .pdf files
    for root, dirs, files in os.walk(WATCH_DIR):
        for fname in files:
            if fname.lower().endswith(".pdf"):
                fpath = os.path.join(root, fname)
                processed_files.add(os.path.abspath(fpath))
                print(f"[WATCHDOG] Initial scan: found PDF {fpath}")
                threading.Thread(target=event_handler._wait_for_complete, args=(fpath,), daemon=True).start()

    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=True)
    observer.start()
    print(f"[WATCHDOG] Monitoring directory: {WATCH_DIR}")

    # Second quick scan to catch files added during initial scan
    for root, dirs, files in os.walk(WATCH_DIR):
        for fname in files:
            if fname.lower().endswith(".pdf"):
                fpath = os.path.abspath(os.path.join(root, fname))
                if fpath not in processed_files:
                    print(f"[WATCHDOG] Second scan: found new PDF {fpath}")
                    threading.Thread(target=event_handler._wait_for_complete, args=(fpath,), daemon=True).start()
                    processed_files.add(fpath)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

def run_watcher_in_thread():
    t = threading.Thread(target=start_watcher, daemon=True)
    t.start()



from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    run_watcher_in_thread()
    yield

app = FastAPI(lifespan=lifespan)

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
