@echo off
cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server\app.js
) else (
  node server\app.js
)

pause
