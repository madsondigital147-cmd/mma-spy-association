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

REM garimpo (TikTok/YouTube/Trustpilot) e pesado - roda so 1x por dia, marcado
REM por um arquivo com a data (independe de qual das 2 execucoes diarias pega)
set "GDATE="
if exist logs\garimpo.lastrun set /p GDATE=<logs\garimpo.lastrun
if not "%GDATE%"=="%date%" (
  echo [%date%_%time%] garimpo diario... >> "%LOG%"
  call npm run garimpo:auto >> "%LOG%" 2>&1
  echo %date%> logs\garimpo.lastrun
)

echo [%date%_%time%] fim. >> "%LOG%"

del logs\mine.lock
