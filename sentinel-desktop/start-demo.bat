@echo off
setlocal

if "%SENTINEL_AUTO_START_GENERATOR%"=="" set SENTINEL_AUTO_START_GENERATOR=true
if "%SENTINEL_BACKEND_HOST%"=="" set SENTINEL_BACKEND_HOST=127.0.0.1
if "%SENTINEL_BACKEND_PORT%"=="" set SENTINEL_BACKEND_PORT=8000

pushd "%~dp0..\sentinel\frontend"
call npm run build
popd

pushd "%~dp0"
call npm run prepare:frontend
call npm start
popd
