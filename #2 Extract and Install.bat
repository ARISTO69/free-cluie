@echo off
title Extract & Install
echo ============================================
echo          Keys Extractor & Installer
echo ============================================
echo.
:: Ask user for password
set /p "PASS=Enter password for keys.rar: "
echo.
echo Extracting keys.rar...
echo.

:: Try 7-Zip if WinRAR not found
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" x "%~dp0keys.rar" -o"%~dp0" -p"%PASS%" -y
    goto check
)
:: Neither found — attempt to install 7-Zip via winget
echo [!] Neither WinRAR nor 7-Zip found.
echo Attempting to install 7-Zip via winget...
echo.
winget install 7zip.7zip --silent --accept-package-agreements --accept-source-agreements
if %errorlevel% neq 0 (
    echo [X] winget install failed. Please install WinRAR or 7-Zip manually and try again.
    pause
    exit /b 1
)
echo [+] 7-Zip installed successfully!
echo.
:: Retry extraction with newly installed 7-Zip
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" x "%~dp0keys.rar" -o"%~dp0" -p"%PASS%" -y
    goto check
)
echo [X] 7-Zip installation succeeded but the executable was not found. Please restart and try again.
pause
exit /b 1
:check
if %errorlevel% neq 0 (
    echo.
    echo [X] Extraction failed. Wrong password or corrupted file.
    pause
    exit /b 1
)
echo.
echo [+] Extraction complete!
echo.
echo Running npm install...
echo.
cd /d "%~dp0"
npm install
echo.
echo [+] Done!
pause