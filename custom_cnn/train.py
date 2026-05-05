import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

from model import CustomFaceCNN

def train_model(data_dir, num_epochs=20, batch_size=32, learning_rate=0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    # Data augmentations & transformations for training
    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Basic check for Dataset Structure
    if not os.path.exists(data_dir):
        print(f"Error: Dataset directory '{data_dir}' not found.")
        print("Expected structure:")
        print(f"  {data_dir}/")
        print("  ├── train/")
        print("  │   ├── person_1/")
        print("  │   └── person_2/")
        return

    train_path = os.path.join(data_dir, 'train')
    if not os.path.exists(train_path):
        print(f"Error: 'train' folder not found inside {data_dir}. Falling back to root directory...")
        train_path = data_dir

    try:
        train_dataset = datasets.ImageFolder(root=train_path, transform=transform)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        
        num_classes = len(train_dataset.classes)
        print(f"Classes found ({num_classes}): {train_dataset.classes}")
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        return
    
    # Initialize Model, Loss criterion, and Optimizer
    model = CustomFaceCNN(num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    best_loss = float('inf')

    # Training Loop
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = 100 * correct / total
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {epoch_loss:.4f}, Accuracy: {epoch_acc:.2f}%")

        # Save Best Model Weights
        if epoch_loss < best_loss:
            best_loss = epoch_loss
            torch.save(model.state_dict(), "best_face_model.pth")
            print(" -> Checkpoint updated: best_face_model.pth")
            
            # Save classes into a text file for inference
            with open("class_names.txt", "w") as f:
                f.write("\n".join(train_dataset.classes))

    print("Training Complete!")

if __name__ == "__main__":
    # Pointing to the cleaned dataset relative to the custom_cnn folder
    train_model(data_dir="../dataset_cleaned", num_epochs=20)
