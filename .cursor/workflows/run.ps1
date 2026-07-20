# Run a local Squad workflow (Cursor mirror of .github/workflows)
# Usage:
#   .\.cursor\workflows\run.ps1 board
#   .\.cursor\workflows\run.ps1 ralph
#   .\.cursor\workflows\run.ps1 watch
#   .\.cursor\workflows\run.ps1 cursor

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('board', 'ralph', 'watch', 'cursor')]
  [string]$Workflow
)

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $RepoRoot

switch ($Workflow) {
  'board' {
    node .cursor/workflows/board-status.js
  }
  'ralph' {
    node .cursor/workflows/ralph-heartbeat.js
    node .cursor/workflows/board-status.js
  }
  'watch' {
    & (Join-Path $PSScriptRoot 'ralph-watch.ps1')
  }
  'cursor' {
    agent "You are Squad (Coordinator). Follow .github/agents/squad.agent.md and .cursor/agents/squad.md. On session start: read .squad/team.md, .squad/routing.md, .squad/decisions.md; run gh issue list for squad labels; proactively offer to pick up the top issue. User says: squad"
  }
}
