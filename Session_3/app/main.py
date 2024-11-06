from flask import Flask, request, render_template, jsonify
import os
import string
import random

app = Flask(__name__)

# Ensure the uploads directory exists
os.makedirs("uploads", exist_ok=True)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/upload/", methods=["POST"])
def upload_file():
    file = request.files['file']
    if file:
        file_path = os.path.join("uploads", file.filename)
        file.save(file_path)
        # Read the content of the uploaded file
        with open(file_path, 'r') as f:  # Assuming text files for simplicity
            content = f.read()
        return jsonify({"filename": file.filename, "content": content})  # Return content

@app.route("/preprocess/", methods=["POST"])
def preprocess_data():
    file_name = request.json['file_name']  # Changed to read JSON
    padding = request.json.get('padding', False)
    remove_punctuation = request.json.get('remove_punctuation', False)
    file_path = os.path.join("uploads", file_name)
    
    # Read the content of the uploaded file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove punctuation if selected
    if remove_punctuation:
        content = content.translate(str.maketrans('', '', string.punctuation))
    
    # Tokenization logic (simple split for this example)
    tokens = content.split()  # Tokenize the content
    
    # Create a token ID mapping
    token_ids = {token: idx for idx, token in enumerate(tokens)}
    
    # Apply padding if selected
    if padding:
        max_length = 10  # Set a maximum length for padding (can be adjusted)
        if len(tokens) < max_length:
            tokens += ['[PAD]'] * (max_length - len(tokens))  # Add padding tokens
    
    return jsonify({"token_map": token_ids})  # Return token map with IDs

@app.route("/augment/", methods=["POST"])
def augment_data():
    file_name = request.json['file_name']  # Changed to read JSON
    file_path = os.path.join("uploads", file_name)
    
    # Read the content of the uploaded file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Perform random word deletion
    augmented_text = random_word_deletion(content, deletion_rate=0.2)  # Adjust deletion rate as needed
    
    return jsonify({"message": augmented_text})  # Return augmented data

def random_word_deletion(text, deletion_rate=0.2):
    words = text.split()
    # Calculate the number of words to delete
    num_deletions = int(len(words) * deletion_rate)
    
    # Randomly select words to delete
    indices_to_delete = random.sample(range(len(words)), num_deletions)
    
    # Create a new list of words excluding the deleted ones
    new_words = [word for i, word in enumerate(words) if i not in indices_to_delete]
    
    return ' '.join(new_words)

if __name__ == "__main__":
    app.run(debug=True) 