# main.py
from flask import Flask, request, send_file, send_from_directory
import os

app = Flask(__name__)

# Serve static files (images)
@app.route('/static/<path:filename>', methods=['GET'])
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route("/", methods=["GET"])
def read_root():
    return send_file("index.html")

@app.route("/uploadfile/", methods=["POST"])
def upload_file():
    file = request.files['file']
    file.save(os.path.join("uploads", file.filename))
    return {
        "filename": file.filename,
        "file_size": os.path.getsize(os.path.join("uploads", file.filename)),
        "content_type": file.content_type
    }

if __name__ == "__main__":
    app.run(debug=True)  # Ensure this line is present to run the app
