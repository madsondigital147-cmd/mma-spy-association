@echo off
REM Agende este .bat no Agendador de Tarefas do Windows (ex: 08:00 e 20:00).
REM Ajuste o caminho do Node se necessário.

cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%

echo [%date% %time%] minerando...
call npm run mine
echo [%date% %time%] veredito...
call npm run verdict
echo [%date% %time%] fim.
