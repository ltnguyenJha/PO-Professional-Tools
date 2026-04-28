# Quick Start — PO Professional Tools

**What is this?** A VS Code extension that helps you create, refine, and push product backlog items to Azure DevOps faster using AI and code scanning.

---

## Step 1: Install

1. Get **VS Code 1.96+** and **GitHub Copilot** (with Copilot Chat).
2. Ask IT for an **Azure DevOps PAT** (personal access token) with Read/Write Work Items permission.
3. Install the PO Tools extension:
   - If you have a `.vsix` file: **Extensions → ⋯ menu → Install from VSIX**.
   - Otherwise: Search "PO Professional Tools" in Extensions and click Install.

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
