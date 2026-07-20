# PO Professional Tools — Agent Instructions

Shared baseline for Cursor, Copilot, and other coding agents.

## Project

- **App:** PO Professional Tools — VS Code extension for Product Owners (codebase scan, AI PBI generation, Azure DevOps sync)
- **Stack:** TypeScript, VS Code Extension API, esbuild, React 18 + Vite + Tailwind (webview), Jest (extension), Vitest (webview)
- **Layout:** `src/` (extension host), `webview-ui/` (React UI), `src/shared/messages.ts` ↔ `webview-ui/src/types.ts` (manual sync)

## Squad — structure parity (`.github` vs `.cursor`)

Both surfaces use **one coordinator + shared `.squad/` state**. Members are not defined per-tool.

| Concern | GitHub / Copilot | Cursor |
|---------|------------------|--------|
| Coordinator | `.github/agents/squad.agent.md` | `.cursor/agents/squad.md` (adapter only) |
| Project instructions | `.github/copilot-instructions.md` | `AGENTS.md` + `.cursor/rules/*.mdc` |
| Automation | `.github/workflows/squad-*.yml` | `.cursor/hooks.json` + `.cursor/hooks/` + `.cursor/workflows/` |
| Roster | `.squad/team.md` | `.squad/team.md` (same file) |
| Routing | `.squad/routing.md` | `.squad/routing.md` (same file) |
| Member charters | `.squad/agents/{name}/charter.md` | `.squad/agents/{name}/charter.md` (same files) |
| Decisions | `.squad/decisions.md` | `.squad/decisions.md` (same file) |
| Process skills | `.github/skills/` | `.github/skills/` (shared) |

Say **"squad"** to greet the coordinator, or address members by name — identity comes from `.squad/`, not from `.cursor/agents/`.

**Cursor FORCE Squad:** Every session delegates domain work via `Task` to `.squad/` members (see `.cursor/rules/squad-force.mdc`). The coordinator does not implement or diagnose solo.

## Authoritative sources (read before non-trivial work)

1. `.github/agents/squad.agent.md` — coordinator protocol
2. `.squad/decisions.md` — hard rules
3. `.squad/team.md` + `.squad/routing.md` — who does what
4. `.cursor/agents/squad.md` — Cursor `Task` tool mapping only

## Hard rules

- **Feature branch only:** never commit to `main` — see `.squad/git-workflow.md`
- **PR pre-flight:** `npm run lint`, type-check both packages, `npm run build` — then open PR
- **Message contract:** update `src/shared/messages.ts` and `webview-ui/src/types.ts` together
- **Secrets:** ADO PAT in VS Code SecretStorage only — never commit or log
- **Simplicity first:** prefer the smallest correct diff; reuse existing patterns

## Local commands

**Build & validate:**

```powershell
npm install
npm install --prefix webview-ui
npm run build
npm run lint
npx tsc --noEmit
npx tsc --noEmit --project webview-ui/tsconfig.json
```

**Tests:**

```powershell
npm test                              # extension (Jest)
npm --prefix webview-ui test            # webview (Vitest)
```

**Debug:** F5 → "Run Extension (Clean)" → Command Palette → **PO Tools: Open Dashboard**

## Workflow parity: `.github/workflows` → `.cursor/workflows`

GitHub workflows are **cloud event automation**. Cursor uses **local scripts + hooks + `agent` CLI**. Keep both — they complement each other.

| GitHub workflow | What it does | Cursor local equivalent |
|-----------------|--------------|-------------------------|
| `squad-triage.yml` | Label `squad` → assign `squad:{member}` | `.\.cursor\workflows\run.ps1 ralph` |
| `squad-heartbeat.yml` | Ralph auto-triage on issue/PR events | `.\.cursor\workflows\ralph-watch.ps1` (polling loop) |
| `squad-issue-assign.yml` | Acknowledge `squad:{member}` label | Cursor `agent` picks up issue when you say *"Linus, work on #N"* |
| `sync-squad-labels.yml` | Sync labels from `team.md` | Still runs on GitHub when `team.md` changes |
| `squad-ci.yml` | PR tests | Still runs on GitHub Actions |
| Session hooks (N/A on GitHub) | — | `.cursor/hooks/session-start.js` injects backlog at chat start |

### Cursor CLI — local entry points

**Before any PR:**

```powershell
npm run lint
npx tsc --noEmit
npx tsc --noEmit --project webview-ui/tsconfig.json
npm run build
gh pr create ...
```

**Interactive Squad session:**

```powershell
.\.cursor\workflows\run.ps1 cursor
# or
agent "squad"
```

**Ralph board check:**

```powershell
.\.cursor\workflows\run.ps1 board
```

**Ralph triage:**

```powershell
.\.cursor\workflows\run.ps1 ralph
```

**Ralph watch** (local daemon):

```powershell
.\.cursor\workflows\ralph-watch.ps1
.\.cursor\workflows\ralph-watch.ps1 -IntervalMinutes 5
```

**Headless agent:**

```powershell
agent --print --trust "squad — Ralph, go. Work highest-priority squad issue."
```

### Recommended daily flow

1. `.\.cursor\workflows\run.ps1 board` — see backlog
2. `agent "squad"` — coordinator greets you, offers issue pickup
3. *"Rusty, work on #N"* — routes to member via `Task`, charter from `.squad/`
4. Optional background: `.\.cursor\workflows\ralph-watch.ps1` while you work elsewhere

GitHub workflows still handle triage when issues are labeled in the repo. Local workflows handle **your machine** when you are in Cursor.
