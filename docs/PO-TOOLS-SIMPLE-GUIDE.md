# PO Professional Tools — Simple guide for Product Owners

This guide explains what the tool does, what to install, and how to use it **without assuming you write code**. Share this with POs, BAs, or anyone who will drive backlog work in Azure DevOps.

---

## What you get (in plain language)

**PO Professional Tools** is an add-on for **Visual Studio Code** (or **Cursor**, which works the same way). It helps you:

- Point at a **folder on your computer** where your team’s code lives (a cloned repository).
- **Scan** that code to find routes, APIs, and related details to ground backlog items in reality.
- **Draft and refine** Product Backlog Items (PBIs) with help from **GitHub Copilot** (AI).
- **Send** those items to **Azure DevOps** so they appear on your board with the right work item type.

Everything runs **on your machine**; your Azure DevOps password token is stored securely inside the editor.

---

## Words you might see

| Term | Meaning |
|------|--------|
| **VS Code** | Microsoft’s free code editor. You use it like an app window with menus and a sidebar. |
| **Extension** | A small add-on that adds “PO Tools” menus and panels inside VS Code. |
| **Repository (repo)** | Your team’s project files, usually downloaded from Git as a folder on your PC. |
| **Azure DevOps (ADO)** | Where your backlog and boards live (`dev.azure.com/...`). |
| **PAT** | A **personal access token** — a long password-like string ADO gives you so tools can create/update work items **as you**. |
| **PBI** | Product Backlog Item (or User Story, Feature, etc., depending on your process). |

---

## Before you start: two roles

### A) Things you or **IT** set up once

- **Install VS Code** (version 1.96 or newer) or **Cursor** if your team standardizes on it.
- **GitHub Copilot** + **Copilot Chat** extensions, and a Copilot license/sign-in (your org usually assigns this).
- **Azure DevOps access** to the project where backlog items should go.
- A **PAT** with permission to **read and write work items** (IT or your ADO admin can create this with you).

### B) Things **you** do in the tool (ongoing)

- Enter your **organization URL**, **project**, **paths**, and **PAT** in **Settings**.
- **Add** your local repo folder under **Projects**, then **Scan** and **Generate PBIs**.
- Open **PBI Studio** to polish stories and **push** to Azure DevOps.

If your team delivers the extension as a **`.vsix` file**, you only need to know **Install from VSIX** (see below). You do **not** need to run `npm` or build from source unless you are helping develop the extension.

---

## Install the PO Tools extension (pick one)

### Option 1 — From a file your team sends you (`.vsix`)

1. Open **VS Code**.
2. Click the **Extensions** icon in the left sidebar (or **View → Extensions**).
3. Click the **`⋯`** menu on the Extensions panel.
4. Choose **Install from VSIX…** and select the file you received.
5. Reload VS Code if prompted.

### Option 2 — From the Visual Studio Marketplace (when published)

1. Open **Extensions**.
2. Search for **PO Professional Tools**.
3. Click **Install**.

*(Until the team publishes to the Marketplace, use Option 1.)*

---

## First-time setup (about 15 minutes)

1. **Sign in to Copilot**  
   Follow your company’s instructions so Copilot and Copilot Chat are active in VS Code.

2. **Open PO Tools**  
   Press **Ctrl+Shift+P** (Windows) or **Cmd+Shift+P** (Mac), type **PO Tools**, and run **PO Tools: Open Dashboard**.  
   You can also use **PO Tools: Open PBI Studio** or **PO Tools: Open Bulk Breakdown** from the same list.

3. **Configure Azure DevOps**  
   In the dashboard sidebar, open **Settings** and fill in:
   - **Organization URL** (example: `https://dev.azure.com/your-organization`)
   - **Project** name  
   - **Area Path** and **Iteration Path** if your team uses them  
   - **Default work item type** (often PBI or User Story)  
   - **PAT** (paste the token IT gave you)  
   Click **Save Settings**, then **Test Connection**. Fix any errors with IT before continuing.

4. **Connect a code folder**  
   Go to **Projects** → **Add Project** and choose the folder where your repo lives on your computer.

5. **Scan and generate**  
   Click **Scan**, then **Generate PBIs**. This creates **drafts** you can open in **PBI Studio**.

---

## Day-to-day workflow (typical)

1. **Projects** — Add or select the repo; **Scan** when the codebase changed a lot.  
2. **PBI Studio** — Pick a draft; use **Generate full story in-panel** for a one-click AI pass on title, description, and acceptance criteria (recommended). Review and edit in your own words.  
3. Push to Azure DevOps when the item is ready.  
4. **Bulk Breakdown** — Use when one big feature should become many smaller backlog items with a shared prefix (optional).

---

## Tips for less technical users

- **Use one repo folder per project** you track, and keep it **updated** (`git pull`) so scans reflect current code.  
- Prefer **Generate full story in-panel** over copy/paste workflows when you want the fewest steps.  
- If AI refuses or errors, confirm **Copilot is signed in** and you are online.  
- If Azure DevOps push fails, open **Settings** and run **Test Connection** again; PATs can expire.

---

## When to ask for help

| Problem | Who can help |
|--------|----------------|
| Cannot install VS Code or extensions | IT / desktop support |
| No Copilot license or sign-in fails | IT or whoever manages GitHub at your org |
| PAT denied or wrong project | Azure DevOps admin or IT |
| Extension file missing or won’t install | The team that built or ships PO Tools |
| “Scan” or “Generate” looks empty | A developer on your team (repo might be wrong folder or not cloned) |

---

## Rollout plan — making adoption easier for non-technical POs

Use this as a **checklist for your team** (not something every PO must read).

1. **Single install path**  
   Standardize on **one** method: e.g. “Install VS Code + Copilot from Company Portal, then install our **`.vsix`** from SharePoint.” Avoid asking POs to clone repos of the extension or run `npm`.

2. **Pre-flight with IT**  
   Confirm **Copilot** and **ADO PAT (Work Items Read/Write)** are approved and documented before pilot users start.

3. **15-minute live demo**  
   Walk through: open Dashboard → Settings → Test Connection → Add Project → Scan → PBI Studio → push one item.

4. **One-page cheat sheet**  
   Print or PDF: “Open Dashboard,” “Where is Settings,” “What to do if Test Connection fails.”

5. **Named support**  
   Assign one **champion** (PO or dev) for week-one questions.

6. **Later: Marketplace**  
   When stable, publishing to the **Visual Studio Marketplace** removes the VSIX handoff step and simplifies updates.

---

## Related technical documentation

For developers and contributors who build from source, see the [README](../README.md) in the repository root.
