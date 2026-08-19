#Requires -Version 5.1
<#
.SYNOPSIS
  Build a distributable H1MS release (compiled only, no source code).

.DESCRIPTION
  Creates dist/H1MS-<version>/ with:
  - Next.js standalone production build (minified JS)
  - Prisma schema + setup tools
  - Hospital setup wizard and launcher scripts
  - Optional ZIP and Inno Setup installer

.PARAMETER Version
  Release version label (default: package.json version)

.PARAMETER SkipBuild
  Skip npm build (reuse existing .next/standalone)

.PARAMETER BundleNode
  Download portable Node.js LTS into the release package

.EXAMPLE
  .\scripts\build-release.ps1
  .\scripts\build-release.ps1 -BundleNode
#>

param(
    [string]$Version = '',
    [switch]$SkipBuild,
    [switch]$BundleNode
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Write-Step([string]$Message) {
    Write-Host "`n>> $Message" -ForegroundColor Cyan
}

if (-not $Version) {
    $pkg = Get-Content (Join-Path $ProjectRoot 'package.json') -Raw | ConvertFrom-Json
    $Version = $pkg.version
}

$DistRoot = Join-Path $ProjectRoot "dist\H1MS-$Version"
$AppDir = Join-Path $DistRoot 'app'
$ToolsDir = Join-Path $DistRoot 'tools'
$RuntimeDir = Join-Path $DistRoot 'runtime\node'

Write-Step "Cleaning previous release at $DistRoot"
if (Test-Path $DistRoot) {
    Remove-Item $DistRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null

if (-not $SkipBuild) {
    Write-Step 'Generating Prisma client'
    npm run db:generate
    if ($LASTEXITCODE -ne 0) { throw 'Prisma generate failed' }

    Write-Step 'Building production app (standalone, no source maps)'
    $env:NODE_ENV = 'production'
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Next.js build failed' }
}

$standalone = Join-Path $ProjectRoot '.next\standalone'
if (-not (Test-Path (Join-Path $standalone 'server.js'))) {
    throw 'Standalone build not found. Run npm run build first.'
}

Write-Step 'Copying standalone application'
Copy-Item -Path (Join-Path $standalone '*') -Destination $AppDir -Recurse -Force

Write-Step 'Copying static assets'
$staticSrc = Join-Path $ProjectRoot '.next\static'
$staticDst = Join-Path $AppDir '.next\static'
New-Item -ItemType Directory -Path $staticDst -Force | Out-Null
Copy-Item -Path (Join-Path $staticSrc '*') -Destination $staticDst -Recurse -Force

$publicSrc = Join-Path $ProjectRoot 'public'
if (Test-Path $publicSrc) {
    Copy-Item -Path $publicSrc -Destination (Join-Path $AppDir 'public') -Recurse -Force
}

Write-Step 'Copying Prisma schema'
New-Item -ItemType Directory -Path (Join-Path $AppDir 'prisma') -Force | Out-Null
Copy-Item (Join-Path $ProjectRoot 'prisma\schema.prisma') (Join-Path $AppDir 'prisma\schema.prisma') -Force

Write-Step 'Copying hospital setup tools'
Copy-Item (Join-Path $ProjectRoot 'release\tools\create-admin.mjs') $ToolsDir -Force
Copy-Item (Join-Path $ProjectRoot 'release\start-h1ms.bat') $DistRoot -Force
Copy-Item (Join-Path $ProjectRoot 'release\setup-h1ms.ps1') $DistRoot -Force
Copy-Item (Join-Path $ProjectRoot 'release\INSTALL-GUIDE.txt') $DistRoot -Force

Write-Step 'Bundling setup tools (Prisma CLI + admin creator)'
$toolsNodeModules = Join-Path $ToolsDir 'node_modules'
New-Item -ItemType Directory -Path $toolsNodeModules -Force | Out-Null

$toolPackages = @(
    'prisma',
    '@prisma/client',
    '@prisma/engines',
    '@prisma/config',
    '@prisma/debug',
    '@prisma/engines-version',
    '@prisma/fetch-engine',
    '@prisma/get-platform',
    '@prisma/instrumentation',
    'bcryptjs'
)

foreach ($pkg in $toolPackages) {
    $src = Join-Path $ProjectRoot "node_modules\$pkg"
    if (Test-Path $src) {
        $dest = Join-Path $toolsNodeModules $pkg
        New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
        Copy-Item $src $dest -Recurse -Force
    }
}

$dotPrisma = Join-Path $ProjectRoot 'node_modules\.prisma'
if (Test-Path $dotPrisma) {
    Copy-Item $dotPrisma (Join-Path $toolsNodeModules '.prisma') -Recurse -Force
}

Write-Step 'Removing source maps from release (code protection)'
Get-ChildItem -Path $AppDir -Recurse -Filter '*.map' -ErrorAction SilentlyContinue |
    Remove-Item -Force

Write-Step 'Stripping development artifacts'
$stripPatterns = @('*.ts', '*.tsx', '*.mts', 'tsconfig.json', '.eslintrc.json')
foreach ($pattern in $stripPatterns) {
    Get-ChildItem -Path $AppDir -Recurse -Filter $pattern -ErrorAction SilentlyContinue |
        Remove-Item -Force
}

if ($BundleNode) {
    Write-Step 'Bundling portable Node.js LTS runtime'
    New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
    $nodeZip = Join-Path $env:TEMP 'node-portable.zip'
    $nodeVersion = 'v20.18.0'
    $nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip -UseBasicParsing
    Expand-Archive -Path $nodeZip -DestinationPath (Join-Path $env:TEMP 'node-portable') -Force
    Copy-Item (Join-Path $env:TEMP "node-portable\node-$nodeVersion-win-x64\*") $RuntimeDir -Recurse -Force
    Remove-Item $nodeZip -Force -ErrorAction SilentlyContinue
}

Write-Step 'Creating release ZIP'
$zipPath = Join-Path $ProjectRoot "dist\H1MS-$Version-win64.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $DistRoot -DestinationPath $zipPath -Force

$issPath = Join-Path $ProjectRoot 'installer\h1ms-setup.iss'
$iscc = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($iscc -and (Test-Path $issPath)) {
    Write-Step "Building Windows installer with Inno Setup"
    & $iscc "/DMyAppVersion=$Version" "/DReleaseDir=$DistRoot" $issPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installer: dist\H1MS-Setup-$Version.exe" -ForegroundColor Green
    }
} else {
    Write-Host 'Inno Setup not found — ZIP created only.' -ForegroundColor Yellow
    Write-Host 'Install Inno Setup 6 to build H1MS-Setup.exe: https://jrsoftware.org/isinfo.php'
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host "  Release ready: dist\H1MS-$Version" -ForegroundColor Green
Write-Host "  ZIP archive:   dist\H1MS-$Version-win64.zip" -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Give hospitals the installer or ZIP — NOT your source repo.' -ForegroundColor Yellow
Write-Host 'They run setup-h1ms.ps1 once, then start-h1ms.bat to launch.' -ForegroundColor Yellow
Write-Host ''
