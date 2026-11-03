# AuraPass™ Enterprise — Model Context Protocol (MCP) Integrations

This document specifies the Model Context Protocol (MCP) architecture, configured servers, security constraints, and operational runbooks for AuraPass Enterprise.

---

## 1. Antigravity MCP Architecture Overview
Antigravity connects to MCP servers using two primary transports:
1. **Stdio Transport (Local Executables)**: Spawns local CLI processes (`npx`, `python`, binary) and communicates over standard input/output.
2. **Streamable HTTP Transport (Remote Services)**: Connects to remote HTTPS endpoints over the standardized streamable HTTP protocol.

Configuration is maintained in `~/.gemini/config/mcp_config.json` (global) and mirrored in workspace documentation.

---

## 2. Configured MCP Servers & Capabilities

```json
{
  "mcpServers": {
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
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--transport",
        "stdio"
      ],
      "env": {}
    },
    "StitchMCP": {
      "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://stitch.googleapis.com/mcp",
        "--header",
        "X-Goog-Api-Key: [REDACTED_API_KEY]"
      ],
      "env": {}
    },
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp"
    }
  }
}
```

### Detailed Server Profiles

#### 1. Playwright MCP (`playwright`)
- **Package**: `@playwright/mcp` (Official Microsoft package)
- **Transport**: Stdio
- **Primary Capabilities**:
  - `playwright_navigate`: Open URLs in sandboxed Chromium instance.
  - `playwright_screenshot`: Capture full-page or element-specific screenshots.
  - `playwright_click`, `playwright_fill`: Interact with inputs, buttons, and navigation elements.
  - `playwright_evaluate`: Execute read-only JavaScript in DOM to inspect bounding boxes and responsive layout metrics.
- **Security Boundary**:
  - Restricts navigation strictly to `--allowed-hosts localhost,127.0.0.1,13-60-225-165.sslip.io`.
  - Runs in `--headless` mode by default to prevent unauthorized display interaction.
  - Blocks navigation to arbitrary `file://` URLs outside workspace roots.

#### 2. Context7 MCP (`context7`)
- **Package**: `@upstash/context7-mcp`
- **Transport**: Stdio (`--transport stdio`)
- **Primary Capabilities**:
  - `get_docs`: Retrieve up-to-date, version-specific documentation from official library repositories.
  - Resolves exact API contracts for React 19, Vite 8, Tailwind CSS, SQLAlchemy 2.0, DeepFace, and MediaPipe.
- **Security Boundary**:
  - Read-only documentation retrieval; cannot execute code or write to the filesystem.

#### 3. Google Stitch MCP (`StitchMCP`)
- **Transport**: Stdio via `mcp-remote` bridge to `https://stitch.googleapis.com/mcp`
- **Primary Capabilities**:
  - UI project management (`create_project`, `get_project`, `list_projects`).
  - Screen generation and variant exploration (`generate_screen_from_text`, `generate_variants`).
  - Design system synchronization (`create_design_system`, `apply_design_system`).

#### 4. Supabase MCP (`supabase`)
- **Transport**: Streamable HTTP (`https://mcp.supabase.com/mcp`)
- **Primary Capabilities**:
  - Database schema inspection and project management.

---

## 3. Least-Privilege & Credential Security Guidelines
1. **Zero Secret Hardcoding in Workspace Repositories**:
   - Never commit API keys or database passwords to `mcp_config.json` inside version control.
   - Global config at `~/.gemini/config/mcp_config.json` resides outside the git tree.
2. **Network Scoping**:
   - Playwright browser instances are strictly forbidden from connecting to internal network infrastructure or cloud metadata services (`169.254.169.254`).

