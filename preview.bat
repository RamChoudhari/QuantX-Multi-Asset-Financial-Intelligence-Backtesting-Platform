@echo off
title QUANTEXA 3D Terminal Launcher
echo =======================================================
echo          QUANTEXA 3D Financial Terminal
echo =======================================================
echo.
echo Launching QUANTEXA host preview...
echo.
start "" "http://localhost:5188"
call cmd /c "npm.cmd run dev -- --host 0.0.0.0 --port 5188"
pause
