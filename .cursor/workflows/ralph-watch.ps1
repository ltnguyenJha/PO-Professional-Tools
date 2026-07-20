# Local Ralph watchdog — mirrors squad-cli watch + squad-heartbeat.yml
# Usage: .\.cursor\workflows\ralph-watch.ps1
#        .\.cursor\workflows\ralph-watch.ps1 -IntervalMinutes 5

param(
  [int]$IntervalMinutes = 10
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Set-Location $RepoRoot

Write-Host "🔄 Ralph watch started — every $IntervalMinutes minute(s). Ctrl+C to stop."

while ($true) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "`n[$ts] Ralph heartbeat..."
  try {
    node .cursor/workflows/ralph-heartbeat.js
    node .cursor/workflows/board-status.js
  } catch {
    Write-Host "⚠️ Heartbeat error: $_"
  }

  Write-Host "[$ts] Spawning Cursor agent for backlog pickup..."
  try {
    agent --print --trust "You are Squad (Coordinator). Follow .github/agents/squad.agent.md and .cursor/agents/squad.md. Read .squad/decisions.md first. Ralph, go — pick up the highest-priority open squad issue assigned to a member and start work. Report what you did in 3 sentences."
  } catch {
    Write-Host "⚠️ agent CLI failed (is Cursor agent installed?): $_"
  }

  Start-Sleep -Seconds ($IntervalMinutes * 60)
}
