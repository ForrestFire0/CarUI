netsh wlan show interfaces | Findstr "Signal" && git pull --force || Echo Offline
@REM Find interfaces. Find the stirng signal. If string then pull from github, otherwise print offline.
@REM Here is where we put the command line execution.
