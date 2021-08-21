REM This batch file should, if there is internet, pull from github. Then call the setup funcitonality. Otherwise, call the applicaiton.

cd ..
netsh wlan show interfaces | Findstr "Signal" && git pull --force $ CALL "C:\Users\Administrator\Desktop\car_ui\out\make\squirrel.windows\x64\car_ui-1.0.0 Setup.exe" || CALL C:\Users\Administrator\AppData\Local\car_ui\carui.exe
@REM Find interfaces. Find the stirng signal. If string then pull from github, otherwise print offline.
PAUSE