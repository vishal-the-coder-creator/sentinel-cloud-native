@echo off
setlocal

if "%SENTINEL_BACKEND_HOST%"=="" set SENTINEL_BACKEND_HOST=127.0.0.1
if "%SENTINEL_BACKEND_PORT%"=="" set SENTINEL_BACKEND_PORT=8000
if "%CORS_ALLOWED_ORIGINS%"=="" set CORS_ALLOWED_ORIGINS=*
if "%MONGODB_URI%"=="" set MONGODB_URI=mongodb://127.0.0.1:27017/
if "%MONGODB_DB_NAME%"=="" set MONGODB_DB_NAME=sentinel_db

pushd "%~dp0..\..\sentinel-backend"
py run_backend.py
popd
