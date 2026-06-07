@echo off
setlocal EnableExtensions EnableDelayedExpansion
title API Key Setup
echo ============================================
echo             API Key Setup (5 Keys)
echo ============================================
echo.
echo You will be asked to enter the following API keys:
echo   [1] MISTRAL_API_KEY
echo   [2] OPENROUTER_API_KEY
echo   [3] GEMINI_API_KEY
echo   [4] OPENAI_API_KEY
echo   [5] NVIDIA_NIM_API_KEY
echo.
echo Press ENTER to skip any key you don't have.
echo ============================================
echo.

REM ---------------------------------------------------------------
REM Locate the project root. Default guess: parent of this install
REM folder (works if the user extracted the RAR into the repo).
REM We require a package.json at the chosen path.
REM ---------------------------------------------------------------
set "DEFAULT_ROOT=%~dp0.."
for %%I in ("%DEFAULT_ROOT%") do set "DEFAULT_ROOT=%%~fI"
set "PROJECT_ROOT="
:ask_root
echo.
echo This script needs to know where your cloned 'free-cluie' repo lives.
echo A package.json file must exist at that location.
echo.
set /p "PROJECT_ROOT=Project root [%DEFAULT_ROOT%]: "
if "!PROJECT_ROOT!"=="" set "PROJECT_ROOT=!DEFAULT_ROOT!"
if "!PROJECT_ROOT:~0,1!"=="^"" if "!PROJECT_ROOT:~-1!"=="^"" set "PROJECT_ROOT=!PROJECT_ROOT:~1,-1!"
if "!PROJECT_ROOT:~-1!"=="\" set "PROJECT_ROOT=!PROJECT_ROOT:~0,-1!"
if not exist "!PROJECT_ROOT!\package.json" (
    echo.
    echo [X] No package.json found at: !PROJECT_ROOT!
    echo     Please provide the full path to your cloned 'free-cluie' folder.
    goto :ask_root
)
echo [+] Using project root: !PROJECT_ROOT!
echo.

:: Key 1
echo [1/5] Mistral API Key
set "MISTRAL_KEY="
set /p "MISTRAL_KEY=MISTRAL_API_KEY= "
echo.

:: Key 2
echo [2/5] OpenRouter API Key
set "OPENROUTER_KEY="
set /p "OPENROUTER_KEY=OPENROUTER_API_KEY= "
echo.

:: Key 3
echo [3/5] Gemini API Key
set "GEMINI_KEY="
set /p "GEMINI_KEY=GEMINI_API_KEY= "
echo.

:: Key 4
echo [4/5] OpenAI API Key
set "OPENAI_KEY="
set /p "OPENAI_KEY=OPENAI_API_KEY= "
echo.

:: Key 5
echo [5/5] NVIDIA NIM API Key
set "NVIDIA_NIM_KEY="
set /p "NVIDIA_NIM_KEY=NVIDIA_NIM_API_KEY= "
echo.

:: Helper: strip a single pair of surrounding double quotes from a value
:: (so users who wrap their paste in "..." don't end up with embedded quotes).
:strip_quotes
if "!%~1:~0,1!"=="^"" if "!%~1:~-1!"=="^"" (
    set "%~1=!%~1:~1,-1!"
)
goto :eof

call :strip_quotes MISTRAL_KEY
call :strip_quotes OPENROUTER_KEY
call :strip_quotes GEMINI_KEY
call :strip_quotes OPENAI_KEY
call :strip_quotes NVIDIA_NIM_KEY

:: Write to .env file.
:: SECURITY: do NOT use "echo KEY=!VALUE!" — the leading "KEY=" is a literal
:: string and the value is written via delayed expansion, which writes the
:: captured characters verbatim. This avoids the cmd.exe metacharacter
:: parsing problem (^ & | < > ( )) that affected the previous version.
:: Also, no surrounding quotes are added; if the value is empty the line
:: becomes KEY= which is the expected "unset" form.
echo Writing to .env file...
(
    echo MISTRAL_API_KEY=!MISTRAL_KEY!
    echo OPENROUTER_API_KEY=!OPENROUTER_KEY!
    echo GEMINI_API_KEY=!GEMINI_KEY!
    echo OPENAI_API_KEY=!OPENAI_KEY!
    echo NVIDIA_NIM_API_KEY=!NVIDIA_NIM_KEY!
) > "%PROJECT_ROOT%\.env"
endlocal

echo.
echo ============================================
echo  [+] .env file created successfully!
echo ============================================
echo.
pause