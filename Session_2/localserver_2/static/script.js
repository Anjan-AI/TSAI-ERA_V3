// script.js
const animalImage = document.getElementById('animalImage');
const fileInfo = document.getElementById('fileInfo');
const fileInput = document.getElementById('fileInput');

// Add event listeners to radio buttons
document.querySelectorAll('input[name="animal"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        // Display the image for the selected animal
        const selectedAnimal = document.querySelector('input[name="animal"]:checked');
        if (selectedAnimal) {
            const animal = selectedAnimal.value;
            animalImage.src = `/static/${animal}.jpg`; // Assuming images are stored in static folder
            animalImage.style.display = 'block';
        } else {
            animalImage.style.display = 'none';
        }
    });
});

// Display file information on file selection
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size; // Get the file size in bytes

        fileInfo.innerHTML = `
            <strong>File Name:</strong> ${fileName}<br>
            <strong>File Size:</strong> ${fileSize} bytes<br>
            <strong>Type:</strong> ${fileType}
        `;
    } else {
        fileInfo.innerHTML = '';
    }
});
