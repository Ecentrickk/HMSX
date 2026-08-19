@echo off
setlocal
cd /d "%~dp0"

if not exist "app\server.js" (
  echo ERROR: H1MS application files are missing.
  pause
  exit /b 1
)

if not exist ".env" if not exist ".env.local" (
  echo.
  echo  H1MS is not configured yet.
  echo  Running first-time setup...
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-h1ms.ps1"
  if errorlevel 1 exit /b 1
)

set "NODE="
if exist "runtime\node\node.exe" (
  set "NODE=%~dp0runtime\node\node.exe"
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo ERROR: Node.js is required. Install Node.js 18+ or bundle runtime\node\
    pause
    exit /b 1
  )
  set "NODE=node"
)

echo.
echo  Starting H1MS Hospital Management System...
echo  Open http://localhost:3000 in your browser
echo  Press Ctrl+C to stop the server
echo.

cd app
"%NODE%" server.js
pause
