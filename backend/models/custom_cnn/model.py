import torch
import torch.nn as nn
import torch.nn.functional as F

class CustomFaceCNN(nn.Module):
    def __init__(self, num_classes=2):
        super(CustomFaceCNN, self).__init__()
        # Input image size: (3, 128, 128)
        
        # Convolutional Block 1
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2) # 128 -> 64
        
        # Convolutional Block 2
        self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2) # 64 -> 32
        
        # Convolutional Block 3
        self.conv3 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2) # 32 -> 16
        
        # Convolutional Block 4
        self.conv4 = nn.Conv2d(in_channels=128, out_channels=256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.pool4 = nn.MaxPool2d(kernel_size=2, stride=2) # 16 -> 8
        
        # Fully Connected Layers
        # 256 channels * 8 * 8 = 16384 features
        self.fc1 = nn.Linear(256 * 8 * 8, 512)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.pool1(F.relu(self.bn1(self.conv1(x))))
        x = self.pool2(F.relu(self.bn2(self.conv2(x))))
        x = self.pool3(F.relu(self.bn3(self.conv3(x))))
        x = self.pool4(F.relu(self.bn4(self.conv4(x))))
        
        x = x.view(x.size(0), -1) # Flatten the tensor
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

if __name__ == "__main__":
    # Test the model structure and shape outputs
    model = CustomFaceCNN(num_classes=5)
    dummy_input = torch.randn(1, 3, 128, 128)
    output = model(dummy_input)
    print(f"Model Summary:")
    print(f"Input shape: {dummy_input.shape}")
    print(f"Output shape: {output.shape} (Expected: 1, 5)")
