"""
train_antispoof.py — Training script for the anti-spoof MobileNetV2 binary classifier.

Usage:
  python train_antispoof.py --data_dir /path/to/dataset --epochs 15

Expected dataset structure:
  data_dir/
    real/         # Real face images
      img001.jpg
      img002.jpg
    spoof/        # Spoof images (printed photos, screen replays, video replays)
      img001.jpg
      img002.jpg

Recommended datasets (verify licensing before commercial use):
  - CelebA-Spoof: https://github.com/ZhangYuanhan-AI/CelebA-Spoof
  - CASIA-SURF: https://sites.google.com/view/face-anti-spoofing-challenge
  - Replay-Attack: https://www.idiap.ch/dataset/replayattack
  - OULU-NPU: https://sites.google.com/site/aborahmoun/oulu-npu

Output:
  Saves trained weights to: backend/models/antispoof/antispoof_mobilenet.pth
"""

import os
import sys
import argparse
import logging

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('antispoof-train')

# Output path for trained model
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'models', 'antispoof')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'antispoof_mobilenet.pth')


def build_model(num_classes=2):
    """Build MobileNetV2 with frozen backbone and trainable binary head."""
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    
    # Freeze backbone features
    for param in model.features.parameters():
        param.requires_grad = False
    
    # Trainable binary classification head
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(model.last_channel, 128),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(128, num_classes)
    )
    
    return model


def get_transforms():
    """Training and validation transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    
    return train_transform, val_transform


def train(data_dir, epochs=15, batch_size=32, lr=0.001):
    """Train the anti-spoof model."""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Device: {device}")
    
    train_transform, val_transform = get_transforms()
    
    # Load dataset
    full_dataset = datasets.ImageFolder(data_dir, transform=train_transform)
    class_names = full_dataset.classes
    logger.info(f"Classes: {class_names}")
    logger.info(f"Total images: {len(full_dataset)}")
    
    # Verify we have 'real' and 'spoof' folders
    if 'real' not in class_names or 'spoof' not in class_names:
        logger.error(f"Expected folders 'real/' and 'spoof/' in {data_dir}, "
                     f"found: {class_names}")
        sys.exit(1)
    
    # 80/20 train/val split
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Override transform for validation set
    val_dataset.dataset.transform = val_transform
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    
    logger.info(f"Train: {train_size}, Val: {val_size}")
    
    # Build model
    model = build_model(num_classes=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
    
    best_val_acc = 0.0
    
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        train_acc = train_correct / train_total
        train_loss = train_loss / train_total
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_acc = val_correct / val_total
        
        logger.info(f"Epoch {epoch+1}/{epochs} | "
                     f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f} | "
                     f"Val Acc: {val_acc:.4f}")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            torch.save(model.state_dict(), OUTPUT_PATH)
            logger.info(f"  -> Saved best model (Val Acc: {val_acc:.4f})")
        
        scheduler.step()
    
    logger.info(f"\nTraining complete. Best Val Accuracy: {best_val_acc:.4f}")
    logger.info(f"Model saved to: {OUTPUT_PATH}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train anti-spoof MobileNetV2 classifier')
    parser.add_argument('--data_dir', required=True, help='Path to dataset with real/ and spoof/ folders')
    parser.add_argument('--epochs', type=int, default=15, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    
    args = parser.parse_args()
    train(args.data_dir, args.epochs, args.batch_size, args.lr)
