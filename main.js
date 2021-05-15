const { app, BrowserWindow } = require('electron')

if (require('electron-squirrel-startup')) return app.quit();

console.log("Its running bitch")

const SerialPort = require('serialport');
const { ipcMain } = require('electron')
const Readline = require('@serialport/parser-readline');
const fs = require('fs');

const send_fake_data = true; let enabled = false;

let port;
function createPort(portID) {
    console.log('creating port with id ' + portID);
    if (send_fake_data) {enabled = true; return}
    while (!port) {
        port = new SerialPort(portID, { baudRate: 115200 }, (err) => {
            if (err) return console.log('Error: ', err.message)
            else return console.log('Successfully opened port.')
        });
    }
    const parser = port.pipe(new Readline({ delimiter: '\n' }));
    parser.on('data', data => {
        parseAndSend(data);
    });
}

if (send_fake_data) {
    const string = fs.readFileSync('data.json');
    setInterval(() => {
        if (enabled) parseAndSend(string)
    }, 2100);
}

ipcMain.on('ready_for_data', () => {
    console.log('The program is ready for data');
    SerialPort.list().then(ports => {
        // if (err) return sendError('Failed to get list of available ports');
        portsList = []
        ports.forEach((port) => {
            portsList.push(port.path);
        });
        if (portsList.length == 1) {
            console.log('Found and using port ' + portsList[0])
            createPort(portsList[0])
        } else {
            //Ask the user what to do now by sending a request, except bypass this if fake data.
            if (portsList.length == 0) portsList = 'None'
            console.log('Ports found: ' + portsList + '. Asking user to select port.')
            win.webContents.send('select_port', portsList)
        }
    }).catch(console.log)
});

ipcMain.on('selected_port', (event, port) => {
    console.log('The user has selected port ' + port)
    createPort(port);
});

let win;

function createWindow() {
    win = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            // allowRunningInsecureContent: true
        },
        width: 1280,
        height: 800,
        // fullscreen: true,
    })

    win.loadFile('public/index.html')
}

function parseAndSend(string) {
    let jsonData;
    try {
        jsonData = JSON.parse(string);
    } catch (error) {
        console.log(string)
    }
    jsonData.pC = 100 * Math.random();
    win.webContents.send('data', jsonData)
}

function sendError(err) {
    console.log("Error: " + err);
    win.webContents.send('error', err)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log("Closing program.")
        app.quit()
    }
})