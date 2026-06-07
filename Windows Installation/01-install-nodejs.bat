@echo off
title Node.js Installer

REM Preflight: check for winget
where winget >nul 2>nul
if errorlevel 1 (
    echo [X] Error: 'winget' is not available on this system.
    echo     winget ships with App Installer on Windows 10 1809+ / Windows 11.
    echo     Please install or update App Installer from the Microsoft Store and try again.
    pause
    exit /b 1
)

echo Installing Node.js...
echo.

winget install OpenJS.NodeJS --version 24.0.0 --accept-package-agreements --accept-source-agreements

echo.
echo Done! Please restart your terminal before using node or npm.
pause