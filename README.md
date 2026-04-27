# PO Professional Tools

Local-first VS Code extension that helps Product Owners:
- import and remove local cloned repos
- scan code for routes, API endpoints, and SQL objects
- generate, edit, and refine PBIs (with Copilot round-trip or chat hand-off)
- break a big feature into many prefixed child items, with optional parent Feature linking
- push backlog items to Azure DevOps with the correct work item type

Project tracking:
- Overall plan and progress: [docs/PLAN.md](docs/PLAN.md)

## 1) Prerequisites

Install these first:
- Node.js 20+
- VS Code or VS Code Insiders (1.96+)
- GitHub Copilot + Copilot Chat extensions
- Azure DevOps PAT (Work Items: Read & Write)

## 2) Install Dependencies

```powershell
npm install
npm install --prefix webview-ui
```

## 3) Build

```powershell
npm run build
```

## 4) Run Locally (Development)

1. Open this folder in VS Code.
2. Open Run and Debug.
3. Start **Run Extension (Clean)** (press `F5`).
4. In the new Extension Development Host, open the Command Palette and run **PO Tools: Open Dashboard**.

## 5) Navigation

The dashboard has 5 sections in the left sidebar:

- **Dashboard** — KPIs, recent activity, quick actions.
- **Projects** — add, scan, generate PBIs, push all, and **remove** a project.
- **PBI Studio** — **create a new PBI from scratch** (no repo required), or edit drafts from scans. Use **Build story in Copilot Chat** to start in VS Code Chat and co-author the user story and acceptance criteria, then paste JSON into **Apply AI Result**. Push to ADO when ready.
- **Bulk Breakdown** — produce many prefixed children (e.g. `PAL Guest Payment - Login`, `PAL Guest Payment - API Loan-verify`) from Manual input, AI suggestion, or an existing scan, and optionally link them under a parent Feature/Epic in ADO.
- **Settings** — Azure DevOps connection, default Work Item Type, PAT (stored in VS Code Secret Storage), and theme (Light / Dark / Auto).

## 6) First-Time Setup

1. Open **Settings** and fill in:
   - Organization URL (example: `https://dev.azure.com/your-org`)
   - Project
   - Area Path (optional)
   - Iteration Path
   - Default Work Item Type (PBI / User Story / Feature / Epic / Task / Bug)
   - PAT
2. Click **Save Settings**, then **Test Connection**.
3. In **Projects**, click **Add Project** and select your local cloned repo folder.
4. Click **Scan** and then **Generate PBIs**.
5. Open **PBI Studio**, edit a draft, and push it to ADO.

## 7) Copilot refinement

Inside **PBI Studio**, pick a draft and use one of:

- **Generate full story in-panel** (recommended for a one-click flow) — calls GitHub Copilot via the **VS Code Language Model API** (not Copilot Chat), with prompts tuned for **4–7 testable acceptance criteria**, then **applies** title, description, criteria, and tests to the item automatically. No copy/paste. Add optional **Business context** or rely on the Description field.
- **Refine with AI** — same API, but returns a reviewable suggestion you apply per field.
- **Build / Refine in Copilot Chat** — opens Copilot Chat. VS Code does **not** allow extensions to read Chat replies automatically; use **Auto-apply** when pasting JSON, or prefer **Generate full story in-panel** instead.

## 8) Bulk Breakdown

1. Enter a prefix (e.g. `PAL Guest Payment`) and the separator (default ` - `).
2. Choose the Child Work Item Type and, optionally, a Parent Work Item Type.
3. Populate children in one of three ways:
   - **Manual** — one suffix per line.
   - **AI-assisted** — describe the feature and let Copilot propose a breakdown.
   - **From scan** — use routes/endpoints from a scanned project.
4. Click **Save as drafts** to review in PBI Studio, or **Create drafts & push to ADO** to create them immediately (and, if requested, create and link a parent).

## Troubleshooting

- Build fails: re-run `npm install` and `npm install --prefix webview-ui`, then `npm run build`.
- Dashboard says webview build not found: run `npm run build`.
- ADO push fails: check **Test Connection** in Settings; verify PAT has Work Items Read/Write and that the Work Item Type exists in the target process.
- AI refinement fails: make sure GitHub Copilot is signed in and the Copilot Chat extension is enabled.

## Useful Commands

```powershell
npm run build
npm run watch
npm run watch:webview
```
