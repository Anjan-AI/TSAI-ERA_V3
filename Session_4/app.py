from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from train import Trainer
import threading

app = Flask(__name__)
socketio = SocketIO(app)
trainer = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_training')
def start_training():
    global trainer
    trainer = Trainer(socketio)
    
    def train_model():
        trainer.train()
        accuracy = trainer.test()
        socketio.emit('training_complete', {'accuracy': accuracy})
    
    thread = threading.Thread(target=train_model)
    thread.start()
    return jsonify({'status': 'Training started'})

@app.route('/get_predictions')
def get_predictions():
    if trainer is None:
        return jsonify({'error': 'Model not trained yet'})
    
    images, predictions, actual_labels = trainer.get_random_predictions()
    return jsonify({
        'predictions': predictions,
        'actual_labels': actual_labels,
        'images': images
    })

if __name__ == '__main__':
    socketio.run(app, debug=True) 