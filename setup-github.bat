@echo off
echo Setting up GitHub repository for ClassConnect...

REM Initialize git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: ClassConnect attendance management system"

REM Prompt for GitHub repository URL
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/ClassConnect.git): "

REM Add remote origin
git remote add origin %REPO_URL%

REM Set main branch
git branch -M main

REM Push to GitHub
git push -u origin main

echo.
echo Repository setup complete!
echo Don't forget to:
echo 1. Copy .env.example to .env in both frontend and backend folders
echo 2. Update .env files with your actual configuration
echo 3. Install dependencies: npm install in both folders

pause