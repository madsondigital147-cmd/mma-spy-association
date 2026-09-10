@echo off
REM Agendado no Agendador de Tarefas do Windows (08:00 e 20:00).
REM Loga em logs\mine-latest.log pra dar pra ver se rodou / por que falhou.

cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
if not exist logs mkdir logs

set "STAMP=%date%_%time%"
set "LOG=logs\mine-latest.log"

REM trava simples: se ja tem uma mineracao rodando, nao abre outra
if exist logs\mine.lock (
  echo [%STAMP%] ja existe logs\mine.lock - pulando esta execucao >> "%LOG%"
  exit /b 0
)
echo %STAMP% > logs\mine.lock

echo ================================================= >> "%LOG%"
echo [%STAMP%] minerando... >> "%LOG%"
call npm run mine >> "%LOG%" 2>&1
echo [%date%_%time%] veredito... >> "%LOG%"
call npm run verdict >> "%LOG%" 2>&1
echo [%date%_%time%] fim. >> "%LOG%"

del logs\mine.lock
