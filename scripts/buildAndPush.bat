CALL npm run make
ECHO "Finished build"
git add .
git commit -m "Automated push after make"
git push
ECHO "Finished Push"