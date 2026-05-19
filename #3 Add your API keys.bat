@echo off
title API Key Setup
echo ============================================
echo             API Key Setup (4 Keys)
echo ============================================
echo.
echo You will be asked to enter the following API keys:
echo   [1] MISTRAL_API_KEY
echo   [2] OPENROUTER_API_KEY
echo   [3] GEMINI_API_KEY
echo   [4] OPENAI_API_KEY
echo.
echo Press ENTER to skip any key you don't have.
echo ============================================
echo.

:: Key 1
echo [1/4] Mistral API Key
set /p "MISTRAL_KEY=MISTRAL_API_KEY= "
echo.

:: Key 2
echo [2/4] OpenRouter API Key
set /p "OPENROUTER_KEY=OPENROUTER_API_KEY= "
echo.

:: Key 3
echo [3/4] Gemini API Key
set /p "GEMINI_KEY=GEMINI_API_KEY= "
echo.

:: Key 4
echo [4/4] OpenAI API Key
set /p "OPENAI_KEY=OPENAI_API_KEY= "
echo.

:: Write to .env file
echo Writing to .env file...
(
    echo MISTRAL_API_KEY="%MISTRAL_KEY%"
    echo OPENROUTER_API_KEY="%OPENROUTER_KEY%"
    echo GEMINI_API_KEY="%GEMINI_KEY%"
    echo OPENAI_API_KEY="%OPENAI_KEY%"
) > "%~dp0.env"

echo.
echo ============================================
echo  [+] .env file created successfully!
echo ============================================
echo.
pause