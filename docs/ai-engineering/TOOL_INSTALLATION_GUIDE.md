# AuraPass™ Enterprise — Tool Installation & Verification Guide

This runbook provides reproducible, verified installation and verification instructions for all developer productivity, AI engineering, and DevSecOps tools in AuraPass Enterprise.

---

## 1. Prerequisites
- **Operating System**: Windows 10/11, macOS, or Ubuntu 22.04+
- **Python**: Version `3.10.x` (Python 3.10.13 verified)
- **Node.js**: Version `20.x` LTS or `22.x` (v20.19.6 verified)
- **Package Managers**: `npm >= 10.0` and `pip >= 24.0`

---

## 2. MCP Server Configuration

### 2.1 Playwright MCP (`@playwright/mcp`)
1. **Verification**:
   ```powershell
   npx -y @playwright/mcp --help
   ```
2. **Install Chromium Browser**:
   ```powershell
   npx -y playwright install chromium
   ```
3. **Configuration**:
   Add to `~/.gemini/config/mcp_config.json`:
   ```json
   "playwright": {
     "command": "npx",
     "args": [
       "-y",
       "@playwright/mcp",
       "--headless",
       "--allowed-hosts",
       "localhost,127.0.0.1,13-60-225-165.sslip.io"
     ],
     "env": {}
   }
   ```

### 2.2 Context7 Documentation MCP (`@upstash/context7-mcp`)
1. **Verification**:
   ```powershell
   npx -y @upstash/context7-mcp --help
   ```
2. **Configuration**:
   Add to `~/.gemini/config/mcp_config.json`:
   ```json
   "context7": {
     "command": "npx",
     "args": [
       "-y",
       "@upstash/context7-mcp",
       "--transport",
       "stdio"
     ],
     "env": {}
   }
   ```

---

## 3. Codebase Analysis & Security Tools

### 3.1 Repomix Codebase Bundler
1. **Verification**:
   ```powershell
   npx -y repomix --version
   ```
2. **Usage**:
   ```powershell
   npx repomix --include "backend/routes/**/*.py,backend/database/**/*.py" --ignore "**/*.pickle,**/*.pth,**/*.db"
   ```

### 3.2 Static Security Scanning (Semgrep)
1. **Installation** (into backend venv):
   ```powershell
   & "backend/venv/Scripts/pip.exe" install semgrep
   ```
2. **Execution**:
   ```powershell
   & "backend/venv/Scripts/semgrep.exe" scan --config "p/security-audit" backend/
   ```

### 3.3 Git Secret Detection (Gitleaks)
1. **Verification / Execution via Docker or standalone binary**:
   ```powershell
   docker run --rm -v "e:\RMS:/path" zricethezav/gitleaks:latest detect --source="/path" --verbose
   ```

---

## 4. Application Runtimes

### 4.1 Backend Environment Setup
```powershell
cd e:\RMS
python -m venv backend/venv
& "backend/venv/Scripts/pip.exe" install -r requirements.txt
& "backend/venv/Scripts/python.exe" backend/database/db.py
```

### 4.2 Frontend Environment Setup
```powershell
cd e:\RMS\frontend
npm install
npm run build
```

### 4.3 Unified Local Development Launch
```powershell
# From e:\RMS root:
.\dev.bat
```

