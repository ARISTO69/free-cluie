@echo off
title App Dev Server

REM Preflight: check for npm
where npm >nul 2>nul
if errorlevel 1 (
    echo [X] Error: 'npm' is not available on PATH.
    echo     Please run "01-install-nodejs.bat" first and restart your terminal.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM Locate the project root. Default guess: parent of this install
REM folder (works if the user extracted the RAR into the repo).
REM We require a node_modules folder at the chosen path.
REM ---------------------------------------------------------------
set "DEFAULT_ROOT=%~dp0.."
for %%I in ("%DEFAULT_ROOT%") do set "DEFAULT_ROOT=%%~fI"
set "PROJECT_ROOT="
:ask_root
echo.
echo This script needs to know where your cloned 'free-cluie' repo lives.
echo A 'node_modules' folder must exist at that location.
echo.
set /p "PROJECT_ROOT=Project root [%DEFAULT_ROOT%]: "
if "%PROJECT_ROOT%"=="" set "PROJECT_ROOT=%DEFAULT_ROOT%"
if "%PROJECT_ROOT:~0,1%"=="""" if "%PROJECT_ROOT:~-1%"=="""" set "PROJECT_ROOT=%PROJECT_ROOT:~1,-1%"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
if not exist "%PROJECT_ROOT%\node_modules" (
    echo.
    echo [X] No 'node_modules' folder found at: %PROJECT_ROOT%
    echo     Please provide the full path to your cloned 'free-cluie' folder,
    echo     or run "02-create-env-and-install.bat" first.
    goto :ask_root
)
echo [+] Using project root: %PROJECT_ROOT%
echo.

echo Starting development server...
echo.
cd /d "%PROJECT_ROOT%"
cmd /k "npm run app:dev"