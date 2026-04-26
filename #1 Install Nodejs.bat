@echo off
title Node.js Installer

echo Installing Node.js...
echo.

winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements

echo.
echo Done! Please restart your terminal before using node or npm.
pause