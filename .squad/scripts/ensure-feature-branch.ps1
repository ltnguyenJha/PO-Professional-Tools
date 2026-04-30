# ensure-feature-branch.ps1
# Ensures we're not working directly on main branch
# If on main, auto-creates and switches to a feature branch

$ErrorActionPreference = "Stop"

function Get-CurrentBranch {
    try {
        $branch = git rev-parse --abbrev-ref HEAD 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Not in a git repository"
        }
        return $branch.Trim()
    } catch {
        Write-Error "Failed to get current branch: $_"
        exit 1
    }
}

function Create-FeatureBranch {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $branchName = "squad/auto-$timestamp"
    
    Write-Host "⚠️  You are on the 'main' branch!" -ForegroundColor Yellow
    Write-Host "🔧 Auto-creating feature branch: $branchName" -ForegroundColor Cyan
    
    try {
        git checkout -b $branchName 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create branch"
        }
        
        Write-Host "✅ Switched to new branch: $branchName" -ForegroundColor Green
        Write-Host "💡 You can rename it later with: git branch -m feature/your-task" -ForegroundColor Gray
        return $true
    } catch {
        Write-Error "Failed to create feature branch: $_"
        exit 1
    }
}

function Main {
    Write-Host "🔍 Checking current branch..." -ForegroundColor Cyan
    
    $currentBranch = Get-CurrentBranch
    
    if ($currentBranch -eq "main") {
        Create-FeatureBranch
    } else {
        Write-Host "✅ Already on feature branch: $currentBranch" -ForegroundColor Green
        Write-Host "💡 Safe to proceed with work" -ForegroundColor Gray
    }
    
    exit 0
}

# Run main function
Main
