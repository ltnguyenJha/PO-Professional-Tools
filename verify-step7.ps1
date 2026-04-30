# Comprehensive Step 7 Verification Script
# This script verifies that Step 7 (Technical Considerations) is ready to display

Write-Host "════════════════════════════════════════════════════════════"
Write-Host "Step 7 (Technical Considerations) Verification"
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n✓ BUILD VERIFICATION"
Write-Host "──────────────────────────────────────────────────────────"

# Check extension build
if (Test-Path "dist\extension.js") {
    $size = (Get-Item "dist\extension.js").Length / 1MB
    Write-Host "✓ dist\extension.js exists ($([Math]::Round($size, 1)) MB)"
} else {
    Write-Host "✗ dist\extension.js MISSING"
    exit 1
}

# Check webview build
if (Test-Path "webview-ui\dist\index.html") {
    Write-Host "✓ webview-ui\dist\index.html exists"
} else {
    Write-Host "✗ webview-ui\dist\index.html MISSING"
    exit 1
}

# Check assets
$assetCount = @(Get-ChildItem "webview-ui\dist\assets\*" -File -ErrorAction SilentlyContinue).Count
if ($assetCount -gt 0) {
    Write-Host "✓ Assets exist ($assetCount files)"
} else {
    Write-Host "✗ No assets found"
    exit 1
}

# Check Step 7 in bundle
Write-Host "`n✓ STEP 7 PRESENCE CHECK"
Write-Host "──────────────────────────────────────────────────────────"
$jsFile = Get-ChildItem "webview-ui\dist\assets\index-*.js" -File | Select-Object -First 1
if ($jsFile) {
    $content = Get-Content $jsFile.FullName -Raw
    if ($content -match "TechnicalConsiderations") {
        Write-Host "✓ Step 7 (TechnicalConsiderations) found in $($jsFile.Name)"
    } else {
        Write-Host "✗ Step 7 NOT found in bundle"
        exit 1
    }
} else {
    Write-Host "✗ No JavaScript bundle found"
    exit 1
}

Write-Host "`n✓ ALL CHECKS PASSED"
Write-Host "══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "Step 7 is ready! Now follow these steps to see it in VS Code:"
Write-Host ""
Write-Host "1. Run: code ."
Write-Host "2. Once VS Code opens, trigger the extension:"
Write-Host "   - Press Ctrl+Shift+P"
Write-Host "   - Search for 'PO Professional Tools'"
Write-Host "   - Select the command to open the panel"
Write-Host "3. Click the 'Wizard' button in the panel"
Write-Host "4. Navigate to Step 7 - you should see Technical Considerations"
Write-Host ""
Write-Host "If still not visible:"
Write-Host "   - Press Ctrl+Shift+P → Developer: Hard Reload"
Write-Host "   - If still missing, restart VS Code completely"
Write-Host ""
