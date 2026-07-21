@echo off
cd /d "%~dp0"

set "TABLE_URL=http://localhost:5600/tables"

echo Opening Foodee Database Tables...
echo.
echo If the page does not open, first run start-foodee-server.bat
echo.

start "" "%TABLE_URL%"

pause
