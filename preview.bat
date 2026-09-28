@echo off
title QUANTORA 3D Terminal Launcher
echo =======================================================
echo          QUANTORA 3D Financial Terminal
echo =======================================================
echo.
echo Launching QUANTORA host preview...
echo.
start "" "http://localhost:5188"
call cmd /c "npm.cmd run dev -- --host 0.0.0.0 --port 5188"
pause
