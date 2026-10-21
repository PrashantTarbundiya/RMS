#!/bin/bash
# ==============================================================================
# RMS Face AI — Automated AWS EC2 Environment Setup Script
# Works on: Ubuntu 22.04 LTS / 24.04 LTS (AWS Free Tier t2.micro / t3.micro)
# ==============================================================================
set -e

echo "=========================================================="
echo "  RMS Face AI — AWS EC2 Free Tier Automated Setup"
echo "=========================================================="

# 1. Update and install prerequisites
echo "[1/5] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw htop ca-certificates gnupg lsb-release

# 2. Configure Swap Space (Essential for ML stability on 1GB RAM Free Tier)
echo "[2/5] Configuring swap space for ML stability..."
if [ ! -f /swapfile ]; then
    AVAIL_MB=$(df -m / | awk 'NR==2 {print $4}')
    if [ "$AVAIL_MB" -gt 12000 ]; then
        SWAP_SIZE="4G"
        SWAP_COUNT=4096
    elif [ "$AVAIL_MB" -gt 5000 ]; then
        SWAP_SIZE="2G"
        SWAP_COUNT=2048
    else
        SWAP_SIZE="1536M"
        SWAP_COUNT=1536
    fi
    echo "Allocating ${SWAP_SIZE} swap based on ${AVAIL_MB}MB available disk..."
    sudo fallocate -l $SWAP_SIZE /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=$SWAP_COUNT
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    # Optimize swappiness for memory balance
    echo 'vm.swappiness=15' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    echo "Swap configured successfully:"
    free -h
else
    echo "Swapfile already exists."
fi

# 3. Install Docker Engine and Docker Compose Plugin
echo "[3/5] Installing Docker Engine & Docker Compose Plugin..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed successfully: $(docker --version)"
else
    echo "Docker already installed: $(docker --version)"
fi

# 4. Configure Firewall (UFW)
echo "[4/5] Configuring firewall rules (SSH, HTTP, HTTPS)..."
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable

# 5. Create default environment file if missing
echo "[5/5] Checking environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.docker ]; then
        cp .env.docker .env
        echo "Created .env from .env.docker template."
    fi
fi

chmod +x deploy.sh 2>/dev/null || true

echo "=========================================================="
echo "  Setup complete!"
echo "  To apply Docker group permissions without logging out, run:"
echo "    newgrp docker"
echo "  Then deploy with:"
echo "    ./deploy.sh"
echo "=========================================================="
