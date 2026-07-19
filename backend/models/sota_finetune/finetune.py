import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split, Dataset
from PIL import Image
import os
import numpy as np

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
            print(f"[Warning] Skipped {skipped} missing/broken file(s) from dataset.")
        
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
# MIXUP DATA AUGMENTATION — Creates virtual training samples
# ==============================================================================
def mixup_data(x, y, alpha=0.2):
    """
    Apply Mixup augmentation: blend two images and their labels.
    Prevents overfitting on small face datasets by creating virtual samples.
    
    Args:
        x: batch of images
        y: batch of labels
        alpha: Mixup interpolation strength (0.2 = mild blending)
    
    Returns:
        mixed_x, y_a, y_b, lam
    """
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1.0

    batch_size = x.size(0)
    index = torch.randperm(batch_size, device=x.device)

    mixed_x = lam * x + (1 - lam) * x[index]
    y_a, y_b = y, y[index]
    return mixed_x, y_a, y_b, lam


def mixup_criterion(criterion, pred, y_a, y_b, lam):
    """Compute loss for mixup-blended labels."""
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


# ==============================================================================
# EMA (Exponential Moving Average) — Smoother, more stable model weights
# ==============================================================================
class EMA:
    """
    Exponential Moving Average of model parameters.
    Maintains a shadow copy of weights that is a smoothed version of the
    training weights, leading to better generalization.
    """
    def __init__(self, model, decay=0.999):
        self.model = model
        self.decay = decay
        self.shadow = {}
        self.backup = {}
        self._register()

    def _register(self):
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                self.shadow[name] = param.data.clone()

    def update(self):
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                new_average = self.decay * self.shadow[name] + (1.0 - self.decay) * param.data
                self.shadow[name] = new_average.clone()

    def apply_shadow(self):
        """Replace model weights with EMA shadow weights (for evaluation)."""
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                self.backup[name] = param.data.clone()
                param.data = self.shadow[name]

    def restore(self):
        """Restore original model weights (for continued training)."""
        for name, param in self.model.named_parameters():
            if param.requires_grad and name in self.backup:
                param.data = self.backup[name]
        self.backup = {}


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
    
    Improvements:
    - Unfreezes last 60 parameters (deeper fine-tuning for face features)
    - Richer classifier head with 256-d hidden layer
    """
    print("[INFO] Loading Pre-trained MobileNetV2 (lightweight mobile backbone)...")
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)
    
    # Unfreeze the last 60 parameters for deeper fine-tuning
    # This significantly improves accuracy on face datasets
    all_params = list(model.parameters())
    for param in all_params[:-60]:
        param.requires_grad = False
    for param in all_params[-60:]:
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
# WARMUP + COSINE SCHEDULER
# ==============================================================================
class WarmupCosineScheduler:
    """Linear warmup for first N epochs, then cosine annealing decay."""
    def __init__(self, optimizer, warmup_epochs, total_epochs, base_lr, min_lr=1e-6):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs
        self.base_lr = base_lr
        self.min_lr = min_lr

    def step(self, epoch):
        if epoch < self.warmup_epochs:
            # Linear warmup
            lr = self.base_lr * (epoch + 1) / self.warmup_epochs
        else:
            # Cosine annealing
            progress = (epoch - self.warmup_epochs) / max(1, self.total_epochs - self.warmup_epochs)
            lr = self.min_lr + 0.5 * (self.base_lr - self.min_lr) * (1 + np.cos(np.pi * progress))
        
        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr
        return lr


# ==============================================================================
# TRAINING PIPELINE
# ==============================================================================
def finetune_mobile_model(data_dir="../dataset_cleaned", num_epochs=25, batch_size=32):
    """
    Enhanced fine-tuning pipeline for MobileNetV2.
    
    Improvements over baseline:
    1. Deeper unfreezing (60 parameters vs 40) for better feature adaptation
    2. Mixup augmentation (α=0.2) to prevent overfitting on small datasets
    3. Gradient clipping (max_norm=1.0) for training stability
    4. Warmup + Cosine scheduler for smoother convergence
    5. EMA (Exponential Moving Average) for more stable model weights
    6. Enhanced data augmentation with perspective, blur, erasing, grayscale
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Initializing Enhanced Mobile Fine-Tuning on device: {device}")
    
    if device.type == "cpu":
        num_threads = min(8, os.cpu_count() or 4)
        torch.set_num_threads(num_threads)
        print(f"[INFO] CPU training optimized: using {num_threads} threads.")
        
    if not os.path.exists(data_dir):
        print(f"[ERROR] Dataset directory '{data_dir}' not found.")
        return

    # Enhanced Data Augmentation for side-face profiles
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
    base_lr = 5e-4
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=base_lr, weight_decay=1e-4
    )
    
    # Warmup + Cosine scheduler
    warmup_epochs = min(3, num_epochs // 4)
    scheduler = WarmupCosineScheduler(
        optimizer, warmup_epochs=warmup_epochs, total_epochs=num_epochs,
        base_lr=base_lr, min_lr=1e-6
    )
    
    # EMA for smoother weights
    ema = EMA(model, decay=0.999)

    best_val_acc = 0.0
    use_mixup = len(full_dataset) < 500  # Mixup helps most with small datasets

    print(f"[INFO] Starting Enhanced Fine-Tuning (Mixup={'ON' if use_mixup else 'OFF'}, "
          f"Warmup={warmup_epochs} epochs, EMA=ON)...")
    
    for epoch in range(num_epochs):
        current_lr = scheduler.step(epoch)
        
        # --- TRAIN ---
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            
            if use_mixup and np.random.rand() > 0.3:
                # Apply Mixup augmentation
                mixed_images, targets_a, targets_b, lam = mixup_data(images, labels, alpha=0.2)
                outputs = model(mixed_images)
                loss = mixup_criterion(criterion, outputs, targets_a, targets_b, lam)
                
                # For accuracy tracking, use the dominant label
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (lam * (predicted == targets_a).sum().item() +
                           (1 - lam) * (predicted == targets_b).sum().item())
            else:
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
            
            loss.backward()
            
            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            
            # Update EMA
            ema.update()
            
            running_loss += loss.item() * images.size(0)
            
        train_loss = running_loss / max(train_size, 1)
        train_acc = 100 * correct / max(total, 1)

        # --- VALIDATE (using EMA weights) ---
        ema.apply_shadow()  # Use smoothed weights for validation
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
                
        val_loss = val_loss / max(val_size, 1)
        val_acc = 100 * val_correct / max(val_total, 1)
        
        print(f"Epoch [{epoch+1:02d}/{num_epochs}] - "
              f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}% | "
              f"LR: {current_lr:.6f}")
        
        # Save best model (EMA weights)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            
            # Save EMA weights (smoother, better generalization)
            torch.save(model.state_dict(), "best_mobile_sideface.pth")
            print("  [SUCCESS] New Best Checkpoint! (best_mobile_sideface.pth)")
            
            # Save class names
            with open("mobile_classes.txt", "w") as f:
                f.write("\n".join(full_dataset.classes))
        
        ema.restore()  # Restore training weights for next epoch

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
