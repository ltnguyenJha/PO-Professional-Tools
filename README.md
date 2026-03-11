# PO Professional Tools

Simple local tool for Product Owners to:
- import local cloned repos
- scan code routes/endpoints
- generate draft PBIs with criteria and test scenarios
- push work items to Azure DevOps

Project tracking:
- Overall plan and progress: [docs/PLAN.md](docs/PLAN.md)

## 1) Prerequisites

Install these first:
- Node.js 20+
- VS Code or VS Code Insiders
- GitHub Copilot + Copilot Chat extensions in VS Code
- Azure DevOps PAT (Work Items: Read & Write)

## 2) Install Dependencies

From project root:

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
4. A new Extension Development Host window opens.

In that new window:
1. Open Command Palette (`Ctrl+Shift+P`).
2. Run `PO Tools: Open Dashboard`.
3. Use the dashboard:
  - **Add Project**
  - **Scan**
  - **Generate PBIs**
  - **Push to ADO**

## 5) First-Time Setup in the App

Inside the dashboard:
1. Fill Azure DevOps settings:
   - Organization URL (example: `https://dev.azure.com/your-org`)
   - Project Name
   - Area Path (optional)
   - Iteration Path (optional)
   - PAT
2. Click **Save ADO Settings**.
3. Click **Add Project** and select your local cloned repo folder.
4. Click **Scan**.
5. Click **Generate PBIs**.
6. Click **Push to ADO** when ready.

## 6) Typical Local Workflow

1. Clone repo(s) locally.
2. Add project folder(s) in dashboard.
3. Scan project.
4. Generate PBIs.
5. Review/edit.
6. Push to ADO.

## Troubleshooting

- I pressed F5 and saw many warnings:
  - If warnings mention `github.copilot-chat` or `extensionHostProcess`, they are usually from other extensions and not from PO Tools.
  - Use **Run Extension (Clean)** to launch only this extension and avoid noisy logs.
  - Common warnings like `punycode deprecated` and `SQLite experimental` can be ignored for local development.

- Build fails:
  - Re-run `npm install` and `npm install --prefix webview-ui`
  - Then run `npm run build` again

- Dashboard says webview build not found:
  - Run `npm run build`

- ADO push fails:
  - Confirm PAT has Work Items Read/Write
  - Confirm org URL and project name are correct

## Useful Commands

```powershell
npm run build
npm run watch
npm run watch:webview
```
