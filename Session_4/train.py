import torch
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
from model import FashionCNN
import json
from flask_socketio import SocketIO
import numpy as np
from tqdm import tqdm

class Trainer:
    def __init__(self, socketio):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.socketio = socketio
        
        # Data loading and preprocessing
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])
        
        self.train_dataset = torchvision.datasets.FashionMNIST(
            root='./data',
            train=True,
            transform=transform,
            download=True
        )
        
        self.test_dataset = torchvision.datasets.FashionMNIST(
            root='./data',
            train=False,
            transform=transform,
            download=True
        )
        
        self.train_loader = torch.utils.data.DataLoader(
            self.train_dataset,
            batch_size=100,
            shuffle=True
        )
        
        self.test_loader = torch.utils.data.DataLoader(
            self.test_dataset,
            batch_size=100,
            shuffle=False
        )
        
        self.model = FashionCNN().to(self.device)
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
    def train(self, num_epochs=6):
        epoch_losses = []
        epoch_accs = []
        
        for epoch in range(num_epochs):
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            
            # Add tqdm progress bar for batches
            pbar = tqdm(self.train_loader, desc=f'Epoch {epoch+1}/{num_epochs}')
            
            for i, (images, labels) in enumerate(pbar):
                images = images.to(self.device)
                labels = labels.to(self.device)
                
                self.optimizer.zero_grad()
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()
                
                running_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                
                # Update progress bar with current metrics
                batch_loss = loss.item()
                batch_acc = 100 * correct / total
                pbar.set_postfix({'loss': f'{batch_loss:.4f}', 'accuracy': f'{batch_acc:.2f}%'})
                
                # Emit batch-wise updates
                data = {
                    'loss': batch_loss,
                    'accuracy': batch_acc,
                    'epoch': epoch + 1,
                    'batch': i + 1
                }
                self.socketio.emit('training_update', json.dumps(data))
            
            # Calculate epoch metrics
            epoch_loss = running_loss / len(self.train_loader)
            epoch_accuracy = 100 * correct / total
            epoch_losses.append(epoch_loss)
            epoch_accs.append(epoch_accuracy)
            
            # Emit epoch-wise updates
            epoch_data = {
                'epoch_loss': epoch_loss,
                'epoch_accuracy': epoch_accuracy,
                'epoch': epoch + 1
            }
            self.socketio.emit('epoch_update', json.dumps(epoch_data))
        
        torch.save(self.model.state_dict(), 'fashion_cnn.pth')
        
    def test(self):
        self.model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in self.test_loader:
                images = images.to(self.device)
                labels = labels.to(self.device)
                outputs = self.model(images)
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        accuracy = 100 * correct / total
        return accuracy
    
    def get_random_predictions(self, num_samples=10):
        self.model.eval()
        indices = np.random.randint(0, len(self.test_dataset), num_samples)
        images = []
        predictions = []
        actual_labels = []
        
        class_names = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat',
                      'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']
        
        with torch.no_grad():
            for idx in indices:
                image, label = self.test_dataset[idx]
                output = self.model(image.unsqueeze(0).to(self.device))
                _, predicted = torch.max(output.data, 1)
                
                # Convert image to base64 string for display
                img_array = (image.numpy().squeeze() * 0.5 + 0.5) * 255  # Denormalize
                img_array = img_array.astype(np.uint8)
                import base64
                from PIL import Image
                import io
                
                # Convert numpy array to PIL Image
                img_pil = Image.fromarray(img_array)
                
                # Save image to bytes buffer
                buffer = io.BytesIO()
                img_pil.save(buffer, format='PNG')
                
                # Convert to base64 string
                img_str = base64.b64encode(buffer.getvalue()).decode()
                
                images.append(img_str)
                predictions.append(class_names[predicted.item()])
                actual_labels.append(class_names[label])
        
        return images, predictions, actual_labels 