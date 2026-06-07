@echo off
title Installer
echo ============================================
echo                  Installer
echo ============================================
echo.

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
REM We require a package.json at the chosen path.
REM ---------------------------------------------------------------
:choose_root
set "DEFAULT_ROOT=%~dp0.."
for %%I in ("%DEFAULT_ROOT%") do set "DEFAULT_ROOT=%%~fI"
set "PROJECT_ROOT="
:ask_root
echo.
echo This script needs to know where your cloned 'free-cluie' repo lives.
echo A package.json file must exist at that location.
echo.
set /p "PROJECT_ROOT=Project root [%DEFAULT_ROOT%]: "
if "%PROJECT_ROOT%"=="" set "PROJECT_ROOT=%DEFAULT_ROOT%"
REM Strip a single pair of surrounding quotes
if "%PROJECT_ROOT:~0,1%"=="""" if "%PROJECT_ROOT:~-1%"=="""" set "PROJECT_ROOT=%PROJECT_ROOT:~1,-1%"
REM Strip trailing backslash for cleaner output
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
if not exist "%PROJECT_ROOT%\package.json" (
    echo.
    echo [X] No package.json found at: %PROJECT_ROOT%
    echo     Please provide the full path to your cloned 'free-cluie' folder.
    goto :ask_root
)
echo [+] Using project root: %PROJECT_ROOT%
echo.

set "SKIP_ENV=0"
echo Creating .env file...
if exist "%PROJECT_ROOT%\.env" (
    echo [!] An existing .env file was found at: %PROJECT_ROOT%\.env
    set /p "OVERWRITE=    Overwrite it? Any existing API keys will be lost. [y/N] "
    echo.
    if /i not "%OVERWRITE%"=="y" if /i not "%OVERWRITE%"=="yes" (
        echo [*] Keeping existing .env file. Skipping .env creation.
        set "SKIP_ENV=1"
    ) else (
        echo [*] Overwriting existing .env file...
    )
)

if "%SKIP_ENV%"=="0" (
    (
        echo MISTRAL_API_KEY=""
        echo OPENROUTER_API_KEY=""
        echo GEMINI_API_KEY=""
        echo OPENAI_API_KEY=""
        echo NVIDIA_NIM_API_KEY=""
    ) > "%PROJECT_ROOT%\.env"
    echo [+] .env file created!
)
echo.

echo Running npm install...
echo.
cd /d "%PROJECT_ROOT%"
npm install
echo.
echo [+] Done!
pause