@echo off
cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "FOODEE_URL=http://127.0.0.1:5600/"

echo Starting Foodee server...
echo Website will open automatically.
echo Keep this black window open.
echo.

start "" cmd /c "timeout /t 3 >nul & start %FOODEE_URL%"

if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server\app.js
) else (
  node server\app.js
)

pause
