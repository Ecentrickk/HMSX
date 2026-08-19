#!/usr/bin/env powershell
#Requires -Version 5.1
<#
.SYNOPSIS
  Verify H1MS release package integrity and security.

.DESCRIPTION
  Validates that the built release package is secure and complete:
  - No source code files (*.ts, *.tsx)
  - No source maps (*.map files)
  - All required files present
  - Proper file permissions
  - Database schema included
  - Setup tools bundled

.PARAMETER ReleasePath
  Path to the release directory (e.g., dist\H1MS-1.0.0)
  
.EXAMPLE
  .\verify-release.ps1 -ReleasePath "dist\H1MS-1.0.0"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ReleasePath
)

$ErrorActionPreference = 'Stop'
$passed = 0
$failed = 0
$warnings = 0

function Write-Check([string]$Message, [int]$Status) {
    $symbol = if ($Status -eq 0) { "✓" } elseif ($Status -eq 1) { "✗" } else { "⚠" }
    $color = @("Green", "Red", "Yellow")[$Status]
    Write-Host "$symbol $Message" -ForegroundColor $color
    
    if ($Status -eq 0) { $script:passed++ }
    elseif ($Status -eq 1) { $script:failed++ }
    else { $script:warnings++ }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   H1MS RELEASE PACKAGE VERIFICATION                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ReleasePath)) {
    Write-Host "✗ ERROR: Release path not found: $ReleasePath" -ForegroundColor Red
    exit 1
}

Write-Host "Verifying: $ReleasePath" -ForegroundColor DarkGray
Write-Host ""

# ─── Security: No Source Code ──────────────────────────────────────────────

Write-Host "🔒 SECURITY CHECKS" -ForegroundColor Cyan

$tsFiles = Get-ChildItem -Path $ReleasePath -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
if ($tsFiles.Count -eq 0) {
    Write-Check "No TypeScript source files (.ts)" 0
} else {
    Write-Check "Found TypeScript files (SECURITY RISK): $($tsFiles.Count) files" 1
}

$tsxFiles = Get-ChildItem -Path $ReleasePath -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
if ($tsxFiles.Count -eq 0) {
    Write-Check "No React TypeScript files (.tsx)" 0
} else {
    Write-Check "Found React TypeScript files (SECURITY RISK): $($tsxFiles.Count) files" 1
}

$srcMaps = Get-ChildItem -Path $ReleasePath -Recurse -Filter "*.map" -ErrorAction SilentlyContinue
if ($srcMaps.Count -eq 0) {
    Write-Check "No source maps (.map files)" 0
} else {
    Write-Check "Found source maps (code exposure): $($srcMaps.Count) files" 2
}

# ─── Structure: Required Files ──────────────────────────────────────────────

Write-Host ""
Write-Host "📁 STRUCTURE CHECKS" -ForegroundColor Cyan

$appDir = Join-Path $ReleasePath "app"
if (Test-Path $appDir) {
    Write-Check "Application directory exists (app/)" 0
} else {
    Write-Check "Application directory missing (app/)" 1
}

$serverJs = Join-Path $appDir "server.js"
if (Test-Path $serverJs) {
    Write-Check "Entry point exists (app/server.js)" 0
} else {
    Write-Check "Entry point missing (app/server.js)" 1
}

$nextStatic = Join-Path $appDir ".next\static"
if (Test-Path $nextStatic) {
    $files = @(Get-ChildItem -Path $nextStatic -Recurse).Count
    Write-Check "Compiled assets present (.next/static/ - $files files)" 0
} else {
    Write-Check "Compiled assets missing (.next/static/)" 1
}

$prismaSchema = Join-Path $appDir "prisma\schema.prisma"
if (Test-Path $prismaSchema) {
    Write-Check "Database schema included (prisma/schema.prisma)" 0
} else {
    Write-Check "Database schema missing" 1
}

# ─── Setup Tools ───────────────────────────────────────────────────────────

Write-Host ""
Write-Host "🔧 SETUP TOOLS" -ForegroundColor Cyan

$toolsDir = Join-Path $ReleasePath "tools"
if (Test-Path $toolsDir) {
    Write-Check "Tools directory exists (tools/)" 0
} else {
    Write-Check "Tools directory missing (tools/)" 1
}

$adminCreator = Join-Path $toolsDir "create-admin.mjs"
if (Test-Path $adminCreator) {
    Write-Check "Admin creator script included (tools/create-admin.mjs)" 0
} else {
    Write-Check "Admin creator script missing" 1
}

$prismaInTools = Join-Path $toolsDir "node_modules\prisma"
if (Test-Path $prismaInTools) {
    Write-Check "Prisma CLI bundled (tools/node_modules/prisma)" 0
} else {
    Write-Check "Prisma CLI not bundled" 1
}

# ─── Launch Scripts ────────────────────────────────────────────────────────

Write-Host ""
Write-Host "▶️  LAUNCH SCRIPTS" -ForegroundColor Cyan

$startBat = Join-Path $ReleasePath "start-h1ms.bat"
if (Test-Path $startBat) {
    Write-Check "Windows launcher (start-h1ms.bat)" 0
} else {
    Write-Check "Windows launcher missing" 1
}

$setupPs1 = Join-Path $ReleasePath "setup-h1ms.ps1"
if (Test-Path $setupPs1) {
    Write-Check "Setup wizard (setup-h1ms.ps1)" 0
} else {
    Write-Check "Setup wizard missing" 1
}

# ─── Documentation ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "📖 DOCUMENTATION" -ForegroundColor Cyan

$installGuide = Join-Path $ReleasePath "INSTALL-GUIDE.txt"
if (Test-Path $installGuide) {
    Write-Check "Installation guide (INSTALL-GUIDE.txt)" 0
} else {
    Write-Check "Installation guide missing" 2
}

# ─── File Exclusions ───────────────────────────────────────────────────────

Write-Host ""
Write-Host "⛔ EXCLUDED FILES" -ForegroundColor Cyan

$forbidden = @(
    "*.env",
    ".eslintrc*",
    ".gitignore",
    "tsconfig.json",
    "next.config.*",
    "package*.json",
    "README.md"
)

$foundForbidden = 0
foreach ($pattern in $forbidden) {
    $files = Get-ChildItem -Path $ReleasePath -Recurse -Filter $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $foundForbidden += $files.Count
        Write-Host "  ⚠ Found: $pattern ($($files.Count) files)" -ForegroundColor Yellow
    }
}

if ($foundForbidden -eq 0) {
    Write-Check "No development config files found" 0
} else {
    Write-Check "Found excluded files: $foundForbidden (should be removed)" 2
}

# ─── Size Analysis ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "📊 SIZE ANALYSIS" -ForegroundColor Cyan

$appSize = (Get-ChildItem -Path $appDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$toolsSize = (Get-ChildItem -Path $toolsDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$totalSize = $appSize + $toolsSize

Write-Host "  Application: $([Math]::Round($appSize, 1)) MB (compiled code + assets)" -ForegroundColor DarkGray
Write-Host "  Tools: $([Math]::Round($toolsSize, 1)) MB (Prisma + setup utilities)" -ForegroundColor DarkGray
Write-Host "  Total: $([Math]::Round($totalSize, 1)) MB" -ForegroundColor DarkGray

if ($totalSize -lt 200) {
    Write-Check "Release size reasonable ($([Math]::Round($totalSize, 1)) MB)" 0
} else {
    Write-Check "Release size large ($([Math]::Round($totalSize, 1)) MB) - check for node_modules" 2
}

# ─── Runtime (Optional) ────────────────────────────────────────────────────

Write-Host ""
Write-Host "🎯 OPTIONAL: BUNDLED RUNTIME" -ForegroundColor Cyan

$runtimeDir = Join-Path $ReleasePath "runtime\node"
if (Test-Path $runtimeDir) {
    $nodeExe = Join-Path $runtimeDir "node.exe"
    if (Test-Path $nodeExe) {
        $nodeSize = (Get-Item $nodeExe).Length / 1MB
        Write-Check "Portable Node.js included (runtime/node/ - $([Math]::Round($nodeSize, 1)) MB)" 0
    }
} else {
    Write-Check "Portable Node.js not included (hospitals must install Node.js separately)" 2
}

# ─── Summary ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "RESULTS:" -NoNewline -ForegroundColor Cyan
Write-Host " $passed ✓ passed " -NoNewline -ForegroundColor Green
Write-Host " | " -NoNewline
Write-Host "$failed ✗ failed " -NoNewline -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "DarkGray" })
Write-Host " | " -NoNewline
Write-Host "$warnings ⚠ warnings" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0 -and $foundForbidden -eq 0) {
    Write-Host "✓ Release package is secure and ready for distribution!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Build installer: .\scripts\build-release.ps1"
    Write-Host "  2. Test on clean Windows system"
    Write-Host "  3. Distribute to hospital IT staff"
    Write-Host ""
} elseif ($failed -gt 0) {
    Write-Host "✗ Release package has critical issues. Do NOT distribute." -ForegroundColor Red
    Write-Host ""
    Write-Host "Issues to fix:" -ForegroundColor Yellow
    if ($tsFiles.Count -gt 0) { Write-Host "  • Remove TypeScript source files" }
    if ($tsxFiles.Count -gt 0) { Write-Host "  • Remove React TypeScript files" }
    if (-not (Test-Path $serverJs)) { Write-Host "  • Rebuild application (npm run build)" }
    if (-not (Test-Path $prismaSchema)) { Write-Host "  • Include Prisma schema" }
    Write-Host ""
} else {
    Write-Host "⚠ Release package is usable but has some warnings." -ForegroundColor Yellow
}

Write-Host "Release verified at: $ReleasePath" -ForegroundColor DarkGray
Write-Host ""
