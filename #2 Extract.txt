@echo off
title Extract & Install

echo Extracting keys.rar...
echo.

tar -xf "%~dp0keys.rar" -C "%~dp0"

echo.
echo Extraction complete. Running npm install...
echo.

cd /d "%~dp0"
npm install

echo.
echo Done!
pause