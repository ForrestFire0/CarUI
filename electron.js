const {app, BrowserWindow} = require('electron')

if (require('electron-squirrel-startup')) return app.quit();
let send_fake_data, fs, SerialPort, Readline, port;

if (process.env.COMPUTERNAME === "FORRESTS-LAPTOP" && process.env.fakeData) {
    console.log("Sending Fake Data")
    send_fake_data = true;
    fs = require('fs');
    const string = fs.readFileSync('data.json');
    setInterval(() => {
        if (enabled) parseAndSend(string)
    }, 2100);
} else {
    SerialPort = require('serialport');
    Readline = require('@serialport/parser-readline');
}

const {ipcMain} = require('electron')

let enabled = false;

function createPort(portID) {
    if (send_fake_data) {
        console.log('creating port with id ' + portID + ' note: is fake');
        enabled = true;
        return
    }
    if (!port) {
        console.log('creating port with id ' + portID);
        port = new SerialPort(portID, {baudRate: 115200}, (err) => {
            if (err) {
                console.log('Unable to open port: ', err.message);
                win.webContents.send('response', '<h1>Fail!</h1><p>Port unable to be opened.</p><small>' + err.message + '</small>')
            } else {
                win.webContents.send('response', '<h1>Success!</h1><p>Port successfully opened.</p>')
                console.log('Successfully opened port.')
            }
        });
        if (!port) return;
        const parser = port.pipe(new Readline({delimiter: '\n'}));
        parser.on('data', data => {
            parseAndSend(data);
        });
    } else {
        console.log('Using already existing port.');
    }
}


ipcMain.on('ready_for_data', () => {
    console.log('The program is ready for data');
    if (send_fake_data) {
        console.log('Found and using fake data port')
        createPort('FAKE001')
        return
    }
    SerialPort.list().then(ports => {
        // if (err) return sendError('Failed to get list of available ports');
        let portsList = []
        ports.forEach((port) => {
            portsList.push(port.path);
        });
        if (portsList.length === 1) {
            console.log('Found and using port ' + portsList[0])
            createPort(portsList[0])
        } else {
            //Ask the user what to do now by sending a request, except bypass this if fake data.
            console.log('Ports found: ' + portsList + '. Asking user to select port.')
            win.webContents.send('select_port', portsList)
        }
    }).catch(console.log)
});

ipcMain.on('selected_port', (event, port) => {
    console.log('The user has selected port ' + port)
    createPort(port);
});

ipcMain.on('led_select', (event, led) => {
    if (port) {
        port.write(Buffer.from([led]))
    }
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
        fullscreen: process.env.COMPUTERNAME !== "FORRESTS-LAPTOP",
    })

    win.loadFile('public/index.html')
}

function parseAndSend(string) {
    let jsonData;
    try {
        jsonData = JSON.parse(string);
        // console.log(Date.now() + ' Got Data')
        win.webContents.send('data', jsonData)
    } catch (error) {
        console.log(string)
    }
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