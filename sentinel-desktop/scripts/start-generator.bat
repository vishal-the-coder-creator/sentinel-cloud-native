@echo off
setlocal

if "%SENTINEL_BACKEND_HOST%"=="" set SENTINEL_BACKEND_HOST=127.0.0.1
if "%SENTINEL_BACKEND_PORT%"=="" set SENTINEL_BACKEND_PORT=8000
if "%SENTINEL_GENERATOR_API_URL%"=="" set SENTINEL_GENERATOR_API_URL=http://127.0.0.1:8000/data

pushd "%~dp0..\..\sentinel-backend"
py run_live_generator.py
popd
