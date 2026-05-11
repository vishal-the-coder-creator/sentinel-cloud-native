@echo off
setlocal

pushd "%~dp0..\..\sentinel-backend"
py -m pip install -r requirements.txt
py -m pip install pyinstaller
py -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --onefile ^
  --name LiveDataGenerator ^
  --collect-all requests ^
  run_live_generator.py
popd

if not exist "%~dp0..\build\backend" mkdir "%~dp0..\build\backend"
copy /Y "%~dp0..\..\sentinel-backend\dist\LiveDataGenerator.exe" "%~dp0..\build\backend\LiveDataGenerator.exe" >nul
