#Requires -Version 5.1
<#
.SYNOPSIS
  First-time H1MS setup for hospital IT staff.
  Configures MongoDB connection, applies schema, and creates admin account.
#>

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-NodeExe {
    $bundled = Join-Path $Root 'runtime\node\node.exe'
    if (Test-Path $bundled) { return $bundled }
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw 'Node.js 18+ is required. Install from https://nodejs.org or bundle runtime\node\'
}

function Read-Secret([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function New-RandomSecret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  H1MS - Hospital Installation Setup' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

$node = Get-NodeExe
Write-Host "Using Node: $node" -ForegroundColor DarkGray
Write-Host ''

Write-Host 'MongoDB connection (Atlas or on-premise):' -ForegroundColor Yellow
Write-Host 'Example: mongodb://localhost:27017/h1ms'
Write-Host ''
$dbUrl = Read-Host 'DATABASE_URL'

if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    throw 'DATABASE_URL is required.'
}

$port = Read-Host 'Server port [3000]'
if ([string]::IsNullOrWhiteSpace($port)) { $port = '3000' }

$authSecret = New-RandomSecret
$envPath = Join-Path $Root '.env'

@"
# H1MS hospital deployment configuration
DATABASE_URL="$dbUrl"
NEXTAUTH_URL="http://localhost:$port"
AUTH_SECRET="$authSecret"
NEXTAUTH_SECRET="$authSecret"
PORT=$port
"@ | Set-Content -Path $envPath -Encoding UTF8

Copy-Item $envPath (Join-Path $Root 'app\.env') -Force

# Load .env into process for Prisma CLI
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $key = $line.Substring(0, $eq).Trim()
    $val = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
    Set-Item -Path "env:$key" -Value $val
}

Write-Host ''
Write-Host 'Applying database schema...' -ForegroundColor Yellow

$prismaCli = Join-Path $Root 'tools\node_modules\prisma\build\index.js'
if (-not (Test-Path $prismaCli)) {
    throw 'Prisma CLI not found in release package. Rebuild with npm run release.'
}

$schemaPath = Join-Path $Root 'app\prisma\schema.prisma'
Push-Location (Join-Path $Root 'app')
try {
    & $node $prismaCli db push --schema=$schemaPath --skip-generate
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed. Check MongoDB URL and network access.' }
} finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Creating administrator account...' -ForegroundColor Yellow
Push-Location (Join-Path $Root 'tools')
try {
    & $node 'create-admin.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Admin account setup failed.' }
} finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Setup complete!' -ForegroundColor Green
Write-Host "  Start H1MS with: start-h1ms.bat"
Write-Host "  Then open: http://localhost:$port"
Write-Host ''
