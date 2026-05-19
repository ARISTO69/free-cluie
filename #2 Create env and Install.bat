@echo off
title Installer
echo ============================================
echo                  Installer
echo ============================================
echo.

echo Creating .env file...
(
    echo MISTRAL_API_KEY=""
    echo OPENROUTER_API_KEY=""
    echo GEMINI_API_KEY=""
    echo OPENAI_API_KEY=""
) > "%~dp0.env"
echo [+] .env file created!
echo.

echo Running npm install...
echo.
cd /d "%~dp0"
npm install
echo.
echo [+] Done!
pause