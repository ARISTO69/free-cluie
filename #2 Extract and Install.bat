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

:: Try WinRAR first
if exist "C:\Program Files\WinRAR\WinRAR.exe" (
    "C:\Program Files\WinRAR\WinRAR.exe" x -p"%PASS%" "%~dp0keys.rar" "%~dp0"
    goto check
)

:: Try 7-Zip if WinRAR not found
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" x "%~dp0keys.rar" -o"%~dp0" -p"%PASS%" -y
    goto check
)

echo [X] Neither WinRAR nor 7-Zip found. Please install one and try again.
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