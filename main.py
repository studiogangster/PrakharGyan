from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import fitz  # PyMuPDF

doc = fitz.open("in.pdf")
print(doc.page_count)


app = FastAPI()

# Mount the public directory at the root `/`
app.mount("/", StaticFiles(directory="public", html=True), name="static")

@app.get("/newspaper")
async def list_newspaprt():
    return {"message": "Hello, World!"}



@app.get("/api")
async def root():
    return {"message": "Hello, World!"}
