ECHO "Starting build"
CALL npm run make
ECHO "Finished build"
PAUSE
git add .
git commit -m "Automated Push after make"
git push
ECHO "Finished Push"
ECHO "IT WORKED"
PAUSE