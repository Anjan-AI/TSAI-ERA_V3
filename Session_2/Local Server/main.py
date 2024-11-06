# main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()  # Ensure this line is present

# Serve static files (images)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return FileResponse("index.html")

@app.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "file_size": file.spool_max_size,
        "content_type": file.content_type
    }
