@echo off
echo.
echo === PM Dashboard Deployment Helper ===
echo.
set /p msg="Enter commit message (Press Enter for default 'Update'): "
if "%msg%"=="" set msg="Update"

echo.
echo [1/3] Adding changes...
git add .

echo.
echo [2/3] Committing...
git commit -m "%msg%"

echo.
echo [3/3] Pushing to GitHub...
git push

echo.
echo ===================================================
echo Done! Vercel/Render will now update your site.
echo ===================================================
pause
