# PO Professional Tools

A local-first VS Code extension that helps Product Owners scan codebases, generate AI-powered backlog items, and sync to Azure DevOps.

## Quick Start

### Prerequisites
- Node.js 20+
- VS Code 1.96+
- GitHub Copilot + Copilot Chat extensions
- Azure DevOps PAT (Work Items: Read & Write)

### Setup
```powershell
npm install
npm install --prefix webview-ui
npm run build
```

### Run
1. Press `F5` in VS Code to open Extension Development Host
2. Run command: **PO Tools: Open Dashboard**
3. Configure Azure DevOps in **Settings** tab
4. Add a project, scan, and generate PBIs

## Documentation

📖 **For PO Users:** See [docs/QUICK_START.md](docs/QUICK_START.md)  
🛠️ **For Developers:** See [dev/DEVELOPMENT_GUIDE.md](dev/DEVELOPMENT_GUIDE.md)  
📋 **For Project Status:** See [dev/PROJECT_PLAN.md](dev/PROJECT_PLAN.md)  
🎯 **Product Vision:** See [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)

## Project Structure

- **`docs/`** — End-user and stakeholder documentation
- **`dev/`** — Developer documentation and project tracking
- **`deploy/`** — Deployment and operations guides
- **`build/`** — Build configuration and tooling
- **`src/`** — Extension source code (TypeScript)
- **`webview-ui/`** — React UI source code (Vite + TypeScript)

## Troubleshooting

- **Build fails:** Re-run `npm install` and `npm install --prefix webview-ui`, then `npm run build`
- **Webview not found:** Run `npm run build`
- **ADO push fails:** Verify PAT permissions and Work Item Type exists in target process
- **AI refinement fails:** Ensure GitHub Copilot is signed in and enabled
