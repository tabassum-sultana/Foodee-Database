@echo off
cd /d "%~dp0"

set "ADMIN_URL=http://localhost:5600/admin"

echo Opening Foodee Admin Panel...
echo.
echo If the page does not open, first run start-foodee-server.bat
echo.

start "" "%ADMIN_URL%"

pause
