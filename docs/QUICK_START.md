# Quick Start — PO Professional Tools

**What is this?** A VS Code extension that helps you create, refine, and push product backlog items to Azure DevOps faster using AI and code scanning.

---

## Step 1: Install

### Prerequisites

- **VS Code 1.96+**
- **GitHub Copilot** (with Copilot Chat)
- **Azure DevOps PAT** (personal access token) with Read/Write Work Items permission — ask IT if you don't have one

### Install the extension

**From a `.vsix` file (recommended for pinned releases):**

1. Download the `.vsix` from your team's release channel or GitHub Releases.
2. Open VS Code → **Extensions** (`Ctrl+Shift+X`).
3. Click the **⋯** menu → **Install from VSIX...**
4. Select the file and wait for installation to finish.
5. Reload VS Code if prompted (`Ctrl+R` / `Cmd+R`).

**From the Marketplace:**

Search **PO Professional Tools** in Extensions and click **Install**.

### First run

Open the Command Palette (`Ctrl+Shift+P`) and run:

- `PO Tools: Open Dashboard` — main project dashboard
- `PO Tools: Open PBI Studio` — PBI generation studio
- `PO Tools: Open Bulk Breakdown` — bulk PBI breakdown tool

### Install troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not appearing | Reload VS Code (`Ctrl+R` / `Cmd+R`) |
| Commands not found | Confirm the extension is enabled and VS Code was reloaded |
| Webview panel fails to load | Check **Output → Extension Host** for errors |

**System requirements:** VS Code 1.96+, ~512 MB RAM, ~20 MB disk. First load may take 2–3 seconds while the extension initializes.

---

## Step 2: Connect Azure DevOps

1. Open **PO Tools: Open Dashboard** (press `Ctrl+Shift+P`, type "PO Tools").
2. Click **Settings** in the sidebar.
3. Fill in:
   - Organization URL (e.g., `https://dev.azure.com/my-org`)
   - Project name
   - Default Work Item Type (PBI, User Story, etc.)
   - PAT token
4. Click **Save Settings**, then **Test Connection**.

---

## Step 3: Scan Code & Generate Items

1. Go to **Projects** → **Add Project** → pick a folder with your team's code.
2. Click **Scan** to detect routes, APIs, and code patterns.
3. Click **Generate PBIs** to create draft backlog items.
4. Open **PBI Studio** to edit and push items to Azure DevOps.

---

## Common Actions

| Action | Where | How |
|--------|-------|-----|
| **Create a PBI from scratch** | PBI Studio | Click the input fields (no repo needed). |
| **Let AI refine a story** | PBI Studio | Click "Generate full story in-panel" or "Refine with AI". |
| **Push to Azure DevOps** | PBI Studio | Click the push button next to a draft. |
| **Break a feature into many items** | Bulk Breakdown | Enter a prefix, list the children, click "Create drafts & push". |

---

**Need help?** See [docs/PO-TOOLS-SIMPLE-GUIDE.md](PO-TOOLS-SIMPLE-GUIDE.md) for more detail, or ask your team's developer.
