const socket = io();
let lossData = {
    x: [],
    y: [],
    type: 'scatter',
    name: 'Training Loss'
};

let accuracyData = {
    x: [],
    y: [],
    type: 'scatter',
    name: 'Training Accuracy'
};

// Initialize plots
Plotly.newPlot('lossPlot', [lossData], {
    title: 'Training Loss per Epoch',
    xaxis: { title: 'Epoch' },
    yaxis: { title: 'Loss' }
});

Plotly.newPlot('accuracyPlot', [accuracyData], {
    title: 'Training Accuracy per Epoch',
    xaxis: { title: 'Epoch' },
    yaxis: { title: 'Accuracy (%)' }
});

// Add current metrics display
const metricsDiv = document.createElement('div');
metricsDiv.className = 'current-metrics';
document.querySelector('.plots').insertAdjacentElement('beforebegin', metricsDiv);

// Socket.io event handlers
socket.on('training_update', function(data) {
    const update = JSON.parse(data);
    metricsDiv.innerHTML = `
        <div class="metrics">
            <p>Current Batch: ${update.batch}</p>
            <p>Current Loss: ${update.loss.toFixed(4)}</p>
            <p>Current Accuracy: ${update.accuracy.toFixed(2)}%</p>
        </div>
    `;
});

socket.on('epoch_update', function(data) {
    const update = JSON.parse(data);
    
    Plotly.extendTraces('lossPlot', {
        x: [[update.epoch]],
        y: [[update.epoch_loss]]
    }, [0]);
    
    Plotly.extendTraces('accuracyPlot', {
        x: [[update.epoch]],
        y: [[update.epoch_accuracy]]
    }, [0]);
});

socket.on('training_complete', function(data) {
    document.getElementById('showPredictions').disabled = false;
    alert(`Training complete! Final test accuracy: ${data.accuracy.toFixed(2)}%`);
});

// Button event handlers
document.getElementById('startTraining').addEventListener('click', function() {
    this.disabled = true;
    fetch('/start_training')
        .then(response => response.json())
        .then(data => console.log(data));
});

document.getElementById('showPredictions').addEventListener('click', function() {
    fetch('/get_predictions')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('predictionResults');
            container.innerHTML = '';
            
            data.predictions.forEach((pred, i) => {
                const div = document.createElement('div');
                div.className = 'prediction-item';
                
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${data.images[i]}`;
                
                const result = document.createElement('p');
                const isCorrect = pred === data.actual_labels[i];
                result.className = isCorrect ? 'correct' : 'incorrect';
                result.textContent = `Predicted: ${pred}\nActual: ${data.actual_labels[i]}`;
                
                div.appendChild(img);
                div.appendChild(result);
                container.appendChild(div);
            });
        });
}); 