import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split, Dataset
from PIL import Image
import os

# ==============================================================================
# SAFE DATASET: Skips missing/corrupt images instead of crashing
# ==============================================================================
class SafeImageFolder(Dataset):
    """
    A wrapper around ImageFolder that gracefully skips missing or corrupt files.
    """
    def __init__(self, root, transform=None):
        self.dataset = datasets.ImageFolder(root=root)
        self.transform = transform
        self.classes = self.dataset.classes
        self.class_to_idx = self.dataset.class_to_idx
        
        # Filter out files that don't exist on disk
        valid_samples = []
        skipped = 0
        for path, label in self.dataset.samples:
            if os.path.exists(path):
                valid_samples.append((path, label))
            else:
                skipped += 1
        
        if skipped > 0:
            print(f"⚠️ Skipped {skipped} missing/broken file(s) from dataset.")
        
        self.samples = valid_samples
        
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            image = Image.open(path).convert('RGB')
        except Exception:
            # If image is corrupt, return a blank placeholder
            image = Image.new('RGB', (224, 224), (0, 0, 0))
            
        if self.transform:
            image = self.transform(image)
        return image, label


# ==============================================================================
# MODEL: MobileNetV2 — Ultra-lightweight, designed for on-device mobile inference
# Only ~3.5MB Perfect for React Native apps.
# ==============================================================================
def build_mobile_model(num_classes):
    """
    Builds a lightweight MobileNetV2 model for mobile deployment.
    - ~3.5MB model size 
    - Runs in real-time on mobile CPUs (no GPU needed)
    - Exportable to ONNX / TFLite for React Native
    """
    print("[INFO] Loading Pre-trained MobileNetV2 (lightweight mobile backbone)...")
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)
    
    # Unfreeze the last 40 parameters (more layers) for deeper fine-tuning
    # This significantly improves accuracy on small face datasets
    all_params = list(model.parameters())
    for param in all_params[:-40]:
        param.requires_grad = False
    for param in all_params[-40:]:
        param.requires_grad = True
    
    # Replace classifier head with a richer head for face classification
    num_ftrs = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(num_ftrs, 256),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(256, num_classes)
    )
    
    return model


# ==============================================================================
# ONNX EXPORT: Convert the trained model to ONNX format for React Native
# ==============================================================================
def export_to_onnx(model, num_classes, output_path="sideface_mobile.onnx"):
    """
    Exports the trained PyTorch model to ONNX format.
    This can be loaded directly in React Native using onnxruntime-react-native.
    """
    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224)
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[SUCCESS] ONNX model exported: {output_path} ({file_size_mb:.1f} MB)")
    print(f"   -> Use this in React Native with 'onnxruntime-react-native' package")


# ==============================================================================
# TRAINING PIPELINE
# ==============================================================================
def finetune_mobile_model(data_dir="../dataset_cleaned", num_epochs=25, batch_size=32):
    """
    Lightweight fine-tuning pipeline optimized for mobile deployment.
    Uses MobileNetV2 backbone with side-face-specific augmentation.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Initializing Mobile Fine-Tuning on device: {device}")
    
    if not os.path.exists(data_dir):
        print(f"[ERROR] Dataset directory '{data_dir}' not found.")
        return

    # Enhanced Data Augmentation for side-face profiles
    # Includes perspective, blur, erasing, and grayscale for robustness
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(20),
        transforms.RandomPerspective(distortion_scale=0.15, p=0.3),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.3, hue=0.05),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.RandomGrayscale(p=0.1),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Use SafeImageFolder to skip missing/corrupt images
    full_dataset = SafeImageFolder(root=data_dir, transform=train_transform)
    num_classes = len(full_dataset.classes)
    print(f"[INFO] Found {len(full_dataset)} valid images across {num_classes} face classes.")

    # Split: 80% Train / 20% Validation
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Build model
    model = build_mobile_model(num_classes=num_classes).to(device)
    
    # Count trainable parameters
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"[INFO] Parameters: {trainable:,} trainable / {total:,} total")

    # Loss with label smoothing for regularization
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    
    # AdamW optimizer with lower LR for stability
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=5e-4, weight_decay=1e-4
    )
    
    # CosineAnnealing scheduler for smoother convergence
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)

    best_val_acc = 0.0

    print("[INFO] Starting Mobile Fine-Tuning...")
    for epoch in range(num_epochs):
        
        # --- TRAIN ---
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
            
        train_loss = running_loss / train_size
        train_acc = 100 * correct / total

        # --- VALIDATE ---
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
                
        val_loss = val_loss / val_size
        val_acc = 100 * val_correct / val_total
        
        scheduler.step()
        
        print(f"Epoch [{epoch+1:02d}/{num_epochs}] - Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            
            # Save PyTorch weights
            torch.save(model.state_dict(), "best_mobile_sideface.pth")
            print("  [SUCCESS] New Best Checkpoint! (best_mobile_sideface.pth)")
            
            # Save class names
            with open("mobile_classes.txt", "w") as f:
                f.write("\n".join(full_dataset.classes))

    print(f"\n[INFO] Training Complete! Best Validation Accuracy: {best_val_acc:.2f}%")
    
    # === EXPORT TO ONNX FOR REACT NATIVE ===
    print("\n[INFO] Exporting to ONNX for React Native deployment...")
    best_model = build_mobile_model(num_classes=num_classes)
    best_model.load_state_dict(torch.load("best_mobile_sideface.pth", map_location="cpu"))
    export_to_onnx(best_model, num_classes)
    
    print("\n" + "=" * 60)
    print("  REACT NATIVE INTEGRATION GUIDE:")
    print("=" * 60)
    print("1. Install: npm install onnxruntime-react-native")
    print("2. Copy 'sideface_mobile.onnx' + 'mobile_classes.txt' to assets/")
    print("3. Load model with InferenceSession.create('sideface_mobile.onnx')")
    print("=" * 60)

if __name__ == "__main__":
    finetune_mobile_model(data_dir="../dataset_cleaned", num_epochs=25)
