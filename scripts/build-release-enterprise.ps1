#!/usr/bin/env powershell
#Requires -Version 5.1
<#
.SYNOPSIS
  Build production-ready H1MS release for hospital distribution.

.DESCRIPTION
  Creates a secure, distributable H1MS package that:
  - Compiles Next.js with production optimizations
  - Removes all source code (*.ts, *.tsx, source maps)
  - Bundles database setup tools
  - Includes hospital setup wizard
  - Optionally bundles portable Node.js runtime
  - Creates installer and ZIP archive
  - Verifies package security

.PARAMETER Version
  Release version (default: from package.json)

.PARAMETER SkipBuild
  Skip npm build (reuse existing .next/standalone)

.PARAMETER BundleNode
  Include portable Node.js runtime (larger download)

.PARAMETER SkipInstaller
  Skip building Inno Setup installer (ZIP only)

.PARAMETER SkipVerify
  Skip release verification step

.EXAMPLE
  # Standard release build
  .\scripts\build-release.ps1

  # With bundled Node.js
  .\scripts\build-release.ps1 -BundleNode

  # Quick rebuild (skip npm build)
  .\scripts\build-release.ps1 -SkipBuild

#>

param(
    [string]$Version = '',
    [switch]$SkipBuild,
    [switch]$BundleNode,
    [switch]$SkipInstaller,
    [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$StartTime = Get-Date

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "▶ $Message" -ForegroundColor Cyan
}

function Write-Success([string]$Message) {
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning([string]$Message) {
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom([string]$Message) {
    Write-Host "✗ $Message" -ForegroundColor Red
}

# ─── Determine Version ─────────────────────────────────────────────────────

if (-not $Version) {
    $pkg = Get-Content (Join-Path $ProjectRoot 'package.json') -Raw | ConvertFrom-Json
    $Version = $pkg.version
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   H1MS HOSPITAL MANAGEMENT SYSTEM - BUILD RELEASE              ║" -ForegroundColor Cyan
Write-Host "║   Version: $Version" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$DistRoot = Join-Path $ProjectRoot "dist\H1MS-$Version"
$AppDir = Join-Path $DistRoot 'app'
$ToolsDir = Join-Path $DistRoot 'tools'
$RuntimeDir = Join-Path $DistRoot 'runtime\node'

# ─── Cleanup Previous Release ──────────────────────────────────────────────

Write-Step "Preparing build environment"
if (Test-Path $DistRoot) {
    Write-Host "Removing previous release at: $DistRoot" -ForegroundColor DarkGray
    Remove-Item $DistRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
Write-Success "Build directories ready"

# ─── Build Application ────────────────────────────────────────────────────

if (-not $SkipBuild) {
    Write-Step "Generating Prisma client"
    npm run db:generate | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        throw "Prisma generate failed"
    }
    Write-Success "Prisma client generated"

    Write-Step "Building Next.js application (production, standalone mode)"
    $env:NODE_ENV = 'production'
    npm run build | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        throw "Next.js build failed"
    }
    Write-Success "Application built successfully"
} else {
    Write-Warning "Skipping build (using existing .next/standalone)"
}

# ─── Validate Build Output ────────────────────────────────────────────────

$standalone = Join-Path $ProjectRoot '.next\standalone'
if (-not (Test-Path (Join-Path $standalone 'server.js'))) {
    throw "Standalone build not found. Run: npm run build"
}
Write-Success "Build validation passed"

# ─── Copy Application Files ───────────────────────────────────────────────

Write-Step "Copying compiled application"
Copy-Item -Path (Join-Path $standalone '*') -Destination $AppDir -Recurse -Force
Write-Success "Application files copied"

Write-Step "Copying static assets"
$staticSrc = Join-Path $ProjectRoot '.next\static'
$staticDst = Join-Path $AppDir '.next\static'
New-Item -ItemType Directory -Path $staticDst -Force | Out-Null
Copy-Item -Path (Join-Path $staticSrc '*') -Destination $staticDst -Recurse -Force
Write-Success "Static assets copied"

if (Test-Path (Join-Path $ProjectRoot 'public')) {
    Write-Step "Copying public files"
    Copy-Item -Path (Join-Path $ProjectRoot 'public') -Destination (Join-Path $AppDir 'public') -Recurse -Force
    Write-Success "Public files copied"
}

# ─── Copy Database Schema ─────────────────────────────────────────────────

Write-Step "Copying Prisma schema"
New-Item -ItemType Directory -Path (Join-Path $AppDir 'prisma') -Force | Out-Null
Copy-Item (Join-Path $ProjectRoot 'prisma\schema.prisma') (Join-Path $AppDir 'prisma\schema.prisma') -Force
Write-Success "Prisma schema included"

# ─── Copy Setup Tools ─────────────────────────────────────────────────────

Write-Step "Bundling hospital setup tools"
Copy-Item (Join-Path $ProjectRoot 'release\tools\create-admin.mjs') $ToolsDir -Force
Copy-Item (Join-Path $ProjectRoot 'release\start-h1ms.bat') $DistRoot -Force
Copy-Item (Join-Path $ProjectRoot 'release\setup-h1ms.ps1') $DistRoot -Force
Copy-Item (Join-Path $ProjectRoot 'release\INSTALL-GUIDE.txt') $DistRoot -Force
Copy-Item (Join-Path $ProjectRoot 'installer\check-requirements.ps1') $DistRoot -Force
Write-Success "Setup tools bundled"

# ─── Bundle Tool Dependencies ──────────────────────────────────────────────

Write-Step "Bundling Prisma and dependencies for setup tools"
$toolsNodeModules = Join-Path $ToolsDir 'node_modules'
New-Item -ItemType Directory -Path $toolsNodeModules -Force | Out-Null

$toolPackages = @(
    'prisma',
    '@prisma/client',
    '@prisma/engines',
    '@prisma/config',
    '@prisma/debug',
    '@prisma/fetch-engine',
    '@prisma/get-platform',
    '@prisma/instrumentation',
    'bcryptjs'
)

$bundledCount = 0
foreach ($pkg in $toolPackages) {
    $src = Join-Path $ProjectRoot "node_modules\$pkg"
    if (Test-Path $src) {
        $dest = Join-Path $toolsNodeModules $pkg
        New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
        Copy-Item $src $dest -Recurse -Force
        $bundledCount++
    }
}

$dotPrisma = Join-Path $ProjectRoot 'node_modules\.prisma'
if (Test-Path $dotPrisma) {
    Copy-Item $dotPrisma (Join-Path $toolsNodeModules '.prisma') -Recurse -Force
}
Write-Success "Bundled $bundledCount packages and tools"

# ─── Remove Source Code (Security) ────────────────────────────────────────

Write-Step "Removing source code and development artifacts (security)"

$mapCount = 0
Get-ChildItem -Path $AppDir -Recurse -Filter '*.map' -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    $mapCount++
}
if ($mapCount -gt 0) {
    Write-Host "Removed $mapCount source map files" -ForegroundColor DarkGray
}

$stripPatterns = @('*.ts', '*.tsx', '*.mts', 'tsconfig.json', '.eslintrc.json', '.env*', '.gitignore')
$strippedCount = 0
foreach ($pattern in $stripPatterns) {
    Get-ChildItem -Path $AppDir -Recurse -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        $strippedCount++
    }
}
if ($strippedCount -gt 0) {
    Write-Host "Removed $strippedCount development files" -ForegroundColor DarkGray
}
Write-Success "Development artifacts removed"

# ─── Optional: Bundle Node.js Runtime ─────────────────────────────────────

if ($BundleNode) {
    Write-Step "Bundling portable Node.js runtime"
    New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
    
    $nodeZip = Join-Path $env:TEMP 'node-portable.zip'
    $nodeVersion = 'v20.18.0'
    $nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
    
    Write-Host "Downloading Node.js $nodeVersion..." -ForegroundColor DarkGray
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip -UseBasicParsing -ErrorAction Stop
        Write-Host "Extracting..." -ForegroundColor DarkGray
        Expand-Archive -Path $nodeZip -DestinationPath (Join-Path $env:TEMP 'node-portable') -Force
        Copy-Item (Join-Path $env:TEMP "node-portable\node-$nodeVersion-win-x64\*") $RuntimeDir -Recurse -Force
        Remove-Item $nodeZip -Force -ErrorAction SilentlyContinue
        Write-Success "Node.js $nodeVersion bundled (runtime\node\)"
    } catch {
        Write-Warning "Could not download Node.js - hospitals must install separately"
    }
}

# ─── Create Distributable Archives ────────────────────────────────────────

Write-Step "Creating release archives"
$zipPath = Join-Path $ProjectRoot "dist\H1MS-$Version-win64.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $DistRoot -DestinationPath $zipPath -Force
Write-Success "ZIP archive created: H1MS-$Version-win64.zip"

# ─── Build Inno Setup Installer (if available) ────────────────────────────

if (-not $SkipInstaller) {
    $issPath = Join-Path $ProjectRoot 'installer\h1ms-setup.iss'
    $iscc = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($iscc -and (Test-Path $issPath)) {
        Write-Step "Building Windows installer with Inno Setup"
        & $iscc "/DMyAppVersion=$Version" "/DReleaseDir=$DistRoot" $issPath | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Installer created: H1MS-Setup-$Version-Enterprise.exe"
        } else {
            Write-Warning "Installer build failed"
        }
    } else {
        if (-not $iscc) {
            Write-Warning "Inno Setup 6 not found - ZIP created only"
            Write-Host "  To build the installer, install Inno Setup 6:" -ForegroundColor DarkGray
            Write-Host "  https://jrsoftware.org/isdl.php" -ForegroundColor DarkGray
        }
    }
}

# ─── Verify Release Package ───────────────────────────────────────────────

if (-not $SkipVerify) {
    Write-Step "Verifying release package security"
    & (Join-Path $ProjectRoot "scripts\verify-release.ps1") -ReleasePath $DistRoot
}

# ─── Summary ───────────────────────────────────────────────────────────────

$EndTime = Get-Date
$Duration = ($EndTime - $StartTime).TotalSeconds

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   BUILD COMPLETE ✓                                             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Release Package: " -NoNewline -ForegroundColor Yellow
Write-Host "dist\H1MS-$Version" -ForegroundColor Green

Write-Host "📂 Archive: " -NoNewline -ForegroundColor Yellow
Write-Host "dist\H1MS-$Version-win64.zip" -ForegroundColor Green

if (Test-Path (Join-Path $ProjectRoot "dist\H1MS-Setup-$Version-Enterprise.exe")) {
    Write-Host "⚙️  Installer: " -NoNewline -ForegroundColor Yellow
    Write-Host "dist\H1MS-Setup-$Version-Enterprise.exe" -ForegroundColor Green
}

Write-Host ""
Write-Host "⏱️  Build time: $([Math]::Round($Duration, 1)) seconds" -ForegroundColor DarkGray
Write-Host ""

Write-Host "✓ Package is secure for hospital distribution" -ForegroundColor Green
Write-Host "  • No source code included" -ForegroundColor DarkGray
Write-Host "  • No source maps" -ForegroundColor DarkGray
Write-Host "  • No development files" -ForegroundColor DarkGray
Write-Host "  • Compiled and minified" -ForegroundColor DarkGray
Write-Host ""

Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test on a clean Windows system" -ForegroundColor DarkGray
Write-Host "  2. Distribute installer or ZIP to hospitals" -ForegroundColor DarkGray
Write-Host "  3. Hospitals run: Initial Setup Wizard" -ForegroundColor DarkGray
Write-Host "  4. Hospitals start: start-h1ms.bat" -ForegroundColor DarkGray
Write-Host ""

Write-Host "⚠️  Reminder:" -ForegroundColor Yellow
Write-Host "  Share ONLY the installer or ZIP with hospitals" -ForegroundColor DarkGray
Write-Host "  DO NOT share your development folder" -ForegroundColor DarkGray
Write-Host "  DO NOT share source code or .git folder" -ForegroundColor DarkGray
Write-Host ""
