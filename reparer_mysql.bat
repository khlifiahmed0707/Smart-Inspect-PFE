@echo off
set XAMPP_PATH=C:\xampp
set MYSQL_PATH=%XAMPP_PATH%\mysql

echo ===========================================
echo    REPARATION FORCEE MYSQL SMART INSPECT
echo ===========================================

:: Verifier si le dossier existe
if not exist "%MYSQL_PATH%" (
    echo [ERREUR] XAMPP est introuvable dans %XAMPP_PATH%
    echo Veuillez modifier le script avec le bon chemin si necessaire.
    pause
    exit /b
)

echo [1/5] Fermeture de tous les processus MySQL...
taskkill /F /IM mysqld.exe /T >nul 2>&1

echo [2/5] Nettoyage des fichiers temporaires...
del /q "%MYSQL_PATH%\data\*.err" >nul 2>&1
del /q "%MYSQL_PATH%\data\*.pid" >nul 2>&1
del /q "%MYSQL_PATH%\data\multi-master.info" >nul 2>&1
del /q "%MYSQL_PATH%\data\aria_log.*" >nul 2>&1

echo [3/5] Deplacement de l'ancien dossier data...
cd /d "%MYSQL_PATH%"
if exist data_old_backup rmdir /s /q data_old_backup
if exist data_old rmdir /s /q data_old
rename data data_old

echo [4/5] Reconstruction de la structure...
xcopy /E /I /Y backup data >nul

echo [5/5] Migration de vos bases de donnees...
for /d %%D in (data_old\*) do (
    set "dirname=%%~nD"
    if /i not "%%~nD"=="mysql" if /i not "%%~nD"=="performance_schema" if /i not "%%~nD"=="phpmyadmin" if /i not "%%~nD"=="test" (
        echo    + Base detectee : %%~nD
        xcopy /E /I /Y "%%D" "data\%%~nD" >nul
    )
)
copy /Y "data_old\ibdata1" "data\ibdata1" >nul

echo ===========================================
echo SUCCESS: MySQL est repare.
echo 1. Rouvrez le panneau XAMPP.
echo 2. Cliquez sur START pour MySQL.
echo ===========================================
pause
