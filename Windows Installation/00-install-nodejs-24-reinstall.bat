@echo off
title Node.js Reinstaller
echo ============================================
echo        Node.js 24 Installer
echo ============================================
echo.

REM Preflight: check for winget
where winget >nul 2>nul
if errorlevel 1 (
    echo [X] Error: 'winget' is not available on this system.
    echo     winget ships with App Installer on Windows 10 1809+ / Windows 11.
    echo     Please install or update App Installer from the Microsoft Store and try again.
    pause
    exit /b 1
)

echo [1/2] Uninstalling existing Node.js...
echo.
winget uninstall OpenJS.NodeJS --accept-source-agreements
echo.
echo [+] Uninstall complete (or no previous version found).
echo.

echo [2/2] Installing Node.js 24...
echo.
winget install OpenJS.NodeJS --version 24.0.0 --accept-package-agreements --accept-source-agreements
echo.
echo ============================================
echo  [+] Node.js 24 installed successfully!
echo  Please restart your terminal before using
echo  node or npm.
echo ============================================
echo.
pause