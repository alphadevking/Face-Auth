@echo off
set /p choice="Type 'npm' to use npm, or 'yarn' to use yarn: "
if "%choice%"=="npm" (
    npm install && npm run dev
) else if "%choice%"=="yarn" (
    yarn install && yarn dev
) else (
    echo Invalid choice.
)
