#!/usr/bin/env powershell
#Requires -Version 5.1
<#
.SYNOPSIS
  Check H1MS Hospital Management System system requirements.
.DESCRIPTION
  Verifies that the installation computer meets all technical requirements for H1MS.
  Tests for: Windows version, RAM, disk space, Node.js, MongoDB connectivity.
#>

$ErrorActionPreference = 'Continue'
$passed = 0
$failed = 0

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   H1MS SYSTEM REQUIREMENTS CHECKER                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Test-Requirement([string]$Name, [scriptblock]$Test, [string]$Help) {
    Write-Host "▶ $Name..." -NoNewline -ForegroundColor Yellow
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓" -ForegroundColor Green
            $script:passed++
            return
        }
    } catch {}
    Write-Host " ✗" -ForegroundColor Red
    if ($Help) {
        Write-Host "  → $Help" -ForegroundColor DarkYellow
    }
    $script:failed++
}

# ─── Operating System ───────────────────────────────────────────────────────

Write-Host ""
Write-Host "📋 OPERATING SYSTEM" -ForegroundColor Cyan

Test-Requirement "Windows 10 or later (x64)" `
    {
        $os = [System.Environment]::OSVersion
        return ($os.Version.Major -ge 10) -and ([Environment]::Is64BitOperatingSystem)
    } `
    "Requires Windows 10 or later, 64-bit. Current: $([System.Environment]::OSVersion.VersionString)"

# ─── Hardware ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "💾 HARDWARE" -ForegroundColor Cyan

Test-Requirement "RAM (4 GB minimum, 8 GB recommended)" `
    {
        $ram = (Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1GB
        $ramDisplay = [Math]::Round($ram, 1)
        Write-Host " ($ramDisplay GB)" -NoNewline -ForegroundColor DarkGray
        return $ram -ge 4
    } `
    "Install additional RAM. 8 GB is recommended for optimal performance."

Test-Requirement "Disk space (500 MB minimum)" `
    {
        $drive = Get-PSDrive C -ErrorAction SilentlyContinue
        $free = $drive.Free / 1GB
        Write-Host " ($([Math]::Round($free, 1)) GB free)" -NoNewline -ForegroundColor DarkGray
        return $free -ge 0.5
    } `
    "Free up disk space on C: drive. Include additional space for database."

# ─── Runtime ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "🔧 RUNTIME ENVIRONMENT" -ForegroundColor Cyan

Test-Requirement "Node.js 18+ installed globally OR bundled runtime available" `
    {
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCmd) {
            $nodeVersion = & $nodeCmd --version 2>$null
            Write-Host " ($nodeVersion)" -NoNewline -ForegroundColor DarkGray
            return $true
        }
        $bundledNode = ".\runtime\node\node.exe"
        if (Test-Path $bundledNode) {
            Write-Host " (bundled)" -NoNewline -ForegroundColor DarkGray
            return $true
        }
        return $false
    } `
    "Install Node.js 18+ from https://nodejs.org or ensure runtime\node\ is included"

Test-Requirement "PowerShell 5.1+ (for setup scripts)" `
    {
        Write-Host " ($($PSVersionTable.PSVersion.ToString()))" -NoNewline -ForegroundColor DarkGray
        return $PSVersionTable.PSVersion.Major -ge 5
    } `
    "Update PowerShell or Windows."

# ─── Network & Connectivity ────────────────────────────────────────────────

Write-Host ""
Write-Host "🌐 NETWORK & CONNECTIVITY" -ForegroundColor Cyan

Test-Requirement "Internet connectivity" `
    {
        try {
            $response = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 3 -ErrorAction Stop
            return $true
        } catch {
            return $false
        }
    } `
    "No internet connection detected. H1MS installation may have limited functionality."

Test-Requirement "Port 3000 available (default H1MS port)" `
    {
        try {
            $tcpConnection = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
            if ($tcpConnection) {
                Write-Host " (in use)" -NoNewline -ForegroundColor DarkGray
                return $false
            }
            return $true
        } catch {
            return $true
        }
    } `
    "Another application is using port 3000. Edit .env to use a different port (3001, 3002, etc.)"

# ─── MongoDB Connectivity ──────────────────────────────────────────────────

Write-Host ""
Write-Host "🗄️  DATABASE (MongoDB)" -ForegroundColor Cyan

$mongoConnStr = Read-Host "Enter MongoDB connection string (or press Enter to skip)" 2>$null
if (-not [string]::IsNullOrWhiteSpace($mongoConnStr)) {
    Test-Requirement "MongoDB connectivity" `
        {
            try {
                # MongoDB: extract host from connection string
                $match = $mongoConnStr -match "mongodb\+srv?://[^@]+@([^/?]+)"
                if ($match) {
                    $host = $matches[1] -split "\." | Select-Object -First 1
                    $result = Test-NetConnection -ComputerName $host -Port 27017 -WarningAction SilentlyContinue
                    return $result.TcpTestSucceeded -eq $true
                }
                return $false
            } catch {
                return $false
            }
        } `
        "Cannot reach MongoDB server. Verify connection string and network access."
} else {
    Write-Host "⊘ Skipped (no connection string provided)" -ForegroundColor DarkGray
}

# ─── Administrator Rights ──────────────────────────────────────────────────

Write-Host ""
Write-Host "🔐 PERMISSIONS" -ForegroundColor Cyan

Test-Requirement "Administrator rights (current session)" `
    {
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        return $isAdmin
    } `
    "Run PowerShell as Administrator to install H1MS."

# ─── Summary ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "RESULTS: " -NoNewline -ForegroundColor Cyan
Write-Host "$passed ✓ passed" -NoNewline -ForegroundColor Green
Write-Host "  |  " -NoNewline
Write-Host "$failed ✗ failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✓ Your system is ready for H1MS installation!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run the H1MS installer (H1MS-Setup.exe)"
    Write-Host "  2. Follow the installation wizard"
    Write-Host "  3. Run 'Initial Setup Wizard' to configure MongoDB and create admin"
    Write-Host ""
} else {
    Write-Host "✗ Please resolve the issues above before installing H1MS." -ForegroundColor Red
    Write-Host ""
}

Write-Host "For detailed help, see: INSTALL-GUIDE.txt" -ForegroundColor DarkGray
Write-Host ""
