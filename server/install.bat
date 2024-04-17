@echo off
echo Choose the environment manager:
echo 1. pip
echo 2. pipenv
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Using pip to install dependencies and run the server...
    pip install -r requirements.txt
    uvicorn main:app --reload
) else if "%choice%"=="2" (
    echo Using pipenv to run the server...
    pipenv install
    pipenv run uvicorn main:app --reload
) else (
    echo Invalid choice.
)
