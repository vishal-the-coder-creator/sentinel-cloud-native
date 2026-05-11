@echo off
setlocal

pushd "%~dp0"

echo Installing desktop dependencies...
call npm install
if errorlevel 1 exit /b 1

echo Building React frontend...
pushd "..\sentinel\frontend"
call npm install
call npm run build
if errorlevel 1 exit /b 1
popd

echo Building FastAPI backend executable...
call "%~dp0scripts\build-backend.bat"
if errorlevel 1 exit /b 1

echo Building live generator executable...
call "%~dp0scripts\build-generator.bat"
if errorlevel 1 exit /b 1

echo Copying build assets into Electron project...
call npm run prepare:assets
if errorlevel 1 exit /b 1

echo Packaging portable and installer executables...
call npx electron-builder --win portable nsis
if errorlevel 1 exit /b 1

popd
echo Build complete. See sentinel-desktop\release
