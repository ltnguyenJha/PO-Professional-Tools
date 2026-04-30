# Git Workflow Policy

## Core Principle: Never Work on Main

**🚫 NO direct commits to `main` branch.**  
**✅ ALL work flows through feature branches → pull requests.**

This policy ensures code review, quality checks, and prevents accidental breakage of the stable main branch.

---

## Branch Naming Convention

All feature branches follow a consistent naming pattern:

```
feature/{issue-number}-{kebab-case-description}
```

Examples:
- `feature/42-add-oauth-support`
- `feature/123-fix-wizard-validation`
- `feature/99-refactor-copilot-service`

If no GitHub issue exists:
```
squad/{session-id}-{task}
```

Examples:
- `squad/20250101-polish-ui`
- `squad/urgent-hotfix`

---

## Workflow Steps

### 1. Before Starting Work

**ALWAYS check which branch you're on:**

```bash
git rev-parse --abbrev-ref HEAD
```

**If you're on `main`:**
- ❌ DO NOT proceed with changes
- ✅ Run the auto-branch script: `.squad/scripts/ensure-feature-branch.ps1`
- ✅ OR manually create a feature branch: `git checkout -b feature/your-task`

**If you're already on a feature branch:**
- ✅ Continue with your work

### 2. During Work

- Commit frequently with clear messages
- Follow conventional commit format: `{type}: {description}`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Example: `feat: add OAuth login flow`

### 3. After Work is Complete

1. **Push your feature branch:**
   ```bash
   git push origin feature/your-task
   ```

2. **Create a Pull Request (PR) on GitHub:**
   - Title should reference issue: `Fix #42: Add OAuth support`
   - Description must explain:
     - What changed
     - Why it changed
     - How to test/verify

3. **Request code review** (typically Danny for architectural review)

4. **Wait for approval** — do not merge your own PR

5. **After approval, merge is performed by:**
   - Danny (Lead)
   - Or approved maintainers with merge authority

---

## Automation Script

Use `.squad/scripts/ensure-feature-branch.ps1` (Windows) to automate the branch check:

**What it does:**
1. Checks if you're on `main` branch
2. If yes: auto-creates a feature branch with timestamp
3. If no: does nothing (you're already safe)

**When to run:**
- Before starting ANY file operations
- Embedded in agent charters as pre-work check
- Can be run manually: `pwsh .squad/scripts/ensure-feature-branch.ps1`

**Idempotent:** Safe to run multiple times — won't create duplicate branches.

---

## Why This Policy Exists

1. **Code Review Required** — Every change gets at least one review before merge
2. **CI/CD Validation** — Tests and builds run on PR before merge
3. **Prevents Accidents** — Can't accidentally break `main` with untested code
4. **Clear History** — PRs provide context and discussion for every change
5. **Rollback Safety** — Easy to revert PRs if issues arise

---

## Emergency Override

**Only Danny (Lead) can approve direct commits to `main` in true emergencies.**

Emergency criteria:
- Production is down
- Security vulnerability needs immediate patch
- No time for PR review process

Even then, a post-merge PR should be created for documentation.

---

## Branch Protection (Recommended GitHub Settings)

Enable these on the `main` branch:

- ✅ Require pull request before merging
- ✅ Require approvals (minimum: 1)
- ✅ Require status checks to pass before merging
- ✅ Require conversation resolution before merging
- ❌ Do not allow bypassing required pull requests
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

---

## Squad Member Responsibilities

**All agents (Rusty, Linus, Livingston, Danny, Ralph):**
- MUST check branch before starting work
- MUST use feature branches for all changes
- MUST create PR when work is complete
- MUST NOT merge their own PRs (except Danny in emergencies)

**Danny (Lead):**
- Reviews and approves PRs
- Performs final merge to `main`
- Can override policy in documented emergencies

---

## Quick Reference Card

```
❌ NEVER: git commit (on main)
❌ NEVER: git push origin main (with new commits)

✅ ALWAYS: Check branch first
✅ ALWAYS: Create feature branch if on main
✅ ALWAYS: Push feature branch
✅ ALWAYS: Create PR
✅ ALWAYS: Wait for review + approval
```

---

**Policy Owner:** Danny (Lead)  
**Last Updated:** 2025-01-09  
**Enforcement:** Automated via `.squad/scripts/ensure-feature-branch.ps1`
