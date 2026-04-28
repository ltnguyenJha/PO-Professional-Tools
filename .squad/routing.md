# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| React components, views, styles, webview UX | Rusty | New components, CSS, PbiStudio changes, UserStoryWizard |
| Extension backend, message handlers, Copilot API | Linus | DashboardPanel, CopilotService, message types, esbuild |
| Architecture, scope, code review, PR review | Danny | Design decisions, trade-off analysis, reviewing PRs |
| Tests, quality, edge cases, build validation | Livingston | Writing tests, verifying TypeScript clean, build checks |
| Session logging, decisions, cross-agent memory | Scribe | Automatic — never needs routing |
| Work queue, backlog, GitHub issue monitoring | Ralph | Backlog status, issue triage, PR monitoring |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Danny |
| `squad:danny` | Lead work: architecture, review, scope | Danny |
| `squad:rusty` | Frontend work: UI, components, styles | Rusty |
| `squad:linus` | Backend work: extension API, services | Linus |
| `squad:livingston` | Testing: test cases, quality review | Livingston |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, **Danny** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Danny's review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Livingston to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Danny handles all `squad` (base label) triage.

## Branch & PR Workflow (Enforced)

**🚫 No direct pushes to `main` branch. All work must go through feature branches and pull requests.**

1. **Feature branches required**: All development uses feature branches following naming convention:
   - `feature/{brief-description}` — new features
   - `fix/{brief-description}` — bug fixes
   - `refactor/{brief-description}` — refactoring
   - `squad/{issue-number}-{slug}` — issue-based work

2. **Pull Request mandatory**: Every feature branch must have a PR before merge to main:
   - PR title must reference issue number if applicable (e.g., `Fix #42: Resolve auth timeout`)
   - PR description must explain the change
   - At minimum one code review required (typically Danny for architectural review)

3. **PR Best Practices**:
   - Commit messages follow: `{type}: {description}` (e.g., `feat: add OAuth support`)
   - All tests must pass before merge (Livingston verifies)
   - Build must succeed (validated in CI/CD)
   - No merge commits — squash or rebase before merging

4. **Main branch protection**:
   - GitHub branch protection rules should enforce: require PR review, require status checks to pass
   - Deletions of main branch not allowed
   - Force pushes to main not allowed

5. **Merge authority**: Only Danny (Lead) or approved maintainers may merge PRs to main
