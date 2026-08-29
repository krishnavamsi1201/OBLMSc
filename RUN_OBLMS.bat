@echo off
title OBLMS Full-Stack System Launcher
color 0A

echo =========================================================
echo    OUTCOME-BASED LEARNING MANAGEMENT SYSTEM (OBLMS)
echo               FULL-STACK LAUNCHER
echo =========================================================
echo.
echo [1/3] Starting Spring Boot Backend on Port 8080...
start "OBLMS Spring Boot Backend (Port 8080)" cmd /k "cd /d D:\OBLMSc\springboot-backend && mvn spring-boot:run"

echo.
echo [2/3] Starting Angular 17 Frontend on Port 4200...
start "OBLMS Angular Frontend (Port 4200)" cmd /k "cd /d D:\OBLMSc\outcome-based-lms && npm start"

echo.
echo [3/3] Waiting 6 seconds for servers to initialize...
timeout /t 6 /nobreak >nul

echo Opening OBLMS in your default web browser...
start http://localhost:4200

echo.
echo =========================================================
echo  Both Frontend & Backend are now running successfully!
echo  Backend:  http://localhost:8080/api/courses
echo  Frontend: http://localhost:4200
echo =========================================================
pause
