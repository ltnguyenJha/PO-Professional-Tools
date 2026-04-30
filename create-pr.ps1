#!/bin/pwsh
# PR Creation Helper Script for Issue #34

$owner = "ltnguyenJha"
$repo = "PO-Professional-Tools"
$head = "squad/30-business-rules-feature" 
$base = "main"
$token = $env:GH_TOKEN

if (-not $token) {
    Write-Error "GH_TOKEN environment variable not set. Please provide a GitHub token."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github.v3+json"
}

$body = @{
    title = "feat: Add Technical Considerations to FeatureWizard Step 6 (Issue #34)"
    head = $head
    base = $base
    body = @"
Integrates Technical Considerations as Step 6 in the 6-step FeatureWizard workflow.

## Feature Overview
Technical Considerations is now Step 6 of the FeatureWizard, allowing users to capture implementation scope, affected files, and architecture decisions.

## Files Changed Summary
- Frontend: WizardStep6TechnicalConsiderations component (new)
- Integration: FeatureWizard.tsx updated to include Step 6
- Backend: DashboardPanel.ts WIZARD_DRAFT_SAVE handler verified
- Types: technicalConsiderations field added to PbiDraft

## Backend Integration  
Data persists through WIZARD_DRAFT_SAVE handler to ADO.

## Tests
73 comprehensive test specs covering all critical paths and edge cases. Build: PASS, TypeScript: 0 errors.

Closes #34
"@
} | ConvertTo-Json

$apiUrl = "https://api.github.com/repos/$owner/$repo/pulls"

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $body
    Write-Host "PR Created Successfully!"
    Write-Host "PR Number: $($response.number)"
    Write-Host "PR URL: $($response.html_url)"
    exit 0
} catch {
    Write-Error "Failed to create PR: $_"
    exit 1
}
