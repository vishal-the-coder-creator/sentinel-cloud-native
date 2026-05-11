@echo off
setlocal

pushd "%~dp0..\..\sentinel-backend"
py -m pip install -r requirements.txt
py -m pip install pyinstaller
py -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --onefile ^
  --name SentinelBackend ^
  --collect-all textblob ^
  --collect-all uvicorn ^
  --collect-all websockets ^
  --collect-all motor ^
  --collect-all pymongo ^
  run_backend.py
popd

if not exist "%~dp0..\build\backend" mkdir "%~dp0..\build\backend"
copy /Y "%~dp0..\..\sentinel-backend\dist\SentinelBackend.exe" "%~dp0..\build\backend\SentinelBackend.exe" >nul
