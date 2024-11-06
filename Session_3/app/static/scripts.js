// app/templates/scripts.js
let uploadedFileName = ""; // Variable to store the uploaded file name

async function handleUpload(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('/upload/', { method: 'POST', body: formData });
    const data = await response.json();
    console.log(data);
    if (data.content) {
        document.getElementById('uploadedContent').value = data.content; // Use textarea for uploaded content
        uploadedFileName = data.filename; // Store the uploaded file name
    } else {
        document.getElementById('uploadedContent').value = "No content returned.";
    }
}

async function handlePreprocess() {
    const padding = document.getElementById('padding').checked;
    const removePunctuation = document.getElementById('removePunctuation').checked;
    const response = await fetch('/preprocess/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            file_name: uploadedFileName,
            padding: padding,
            remove_punctuation: removePunctuation
        }) // Use the uploaded file name and options
    });
    const data = await response.json();
    console.log(data);
    
    const tokenMapDisplay = document.getElementById('preprocessedData');
    tokenMapDisplay.value = Object.entries(data.token_map)
        .map(([token, id]) => `${token}: ${id}`) // Format as "token: ID"
        .join('\n'); // Join with new lines for better readability
}

async function handleAugment() {
    const response = await fetch('/augment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_name: uploadedFileName }) // Use the uploaded file name
    });
    const data = await response.json();
    console.log(data);
    document.getElementById('augmentedData').value = data.message; // Use textarea for augmented data
}