if (require('electron-squirrel-startup')) return app.quit();

const {app, BrowserWindow, ipcMain} = require('electron')

let send_fake_data, fs, SerialPort, Readline, rearPort, frontPort;

if (process.env.COMPUTERNAME === "FORRESTS-LAPTOP" && process.env.fakeData) {
    console.log("Sending Fake Data")
    send_fake_data = true;
    fs = require('fs');
} else {
    SerialPort = require('serialport');
    Readline = require('@serialport/parser-readline');
}

function createPort(portID) {
    let port;
    if (portID.startsWith('FAKE')) {
        console.log('creating rearPort with id ' + portID + ' note: is fake');
        setInterval(() => {
            const string = fs.readFileSync(`fake/${portID}.json`);
            parseAndSend(string)
        }, portID === 'FAKE_FRONT' ? 100 : 2100)
        return "Its a fake port bozo";
    }
    console.log('creating port @ ' + portID);
    port = new SerialPort(portID, {baudRate: 115200}, (err) => {
        if (err) {
            console.log('Unable to open rearPort: ', err.message);
            win.webContents.send('response', '<h1>Fail!</h1><p>Port unable to be opened.</p><small>' + err.message + '</small>')
        } else {
            win.webContents.send('response', '<h1>Success!</h1><p>Port successfully opened.</p>')
            console.log('Successfully opened port.')
        }
    });
    if (!port) return console.log('Port not created...');
    const parser = port.pipe(new Readline({delimiter: '\n'}));
    parser.on('data', data => {
        parseAndSend(data);
    });
    return port;
}


ipcMain.on('ready_for_data', () => {
    if(rearPort) return;
    console.log('The program is ready for data');
    if (send_fake_data) {
        frontPort = createPort('FAKE_FRONT')
        rearPort = createPort('FAKE_REAR')
        return
    }
    if (process.env.COMPUTERNAME !== "FORRESTS-LAPTOP") {
        frontPort = createPort('COM3');
        rearPort = createPort('COM4');
    } else {
        // frontPort = createPort('COM3');
        rearPort = createPort('COM4');
    }
});

ipcMain.on('inverter', (event, on) => {
    console.log('The user has requested inverter port.', on)
    if (frontPort && !send_fake_data)
        frontPort.write(Buffer.from(`i${on ? 'y' : 'n'}\n`));
    else console.log('No frontPort')
});

ipcMain.on('led_select', (event, led) => {
    if (rearPort)
        rearPort.write(Buffer.from([led]))
    else console.log('No rearPort')
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
        if (send_fake_data) {
            const excluded = ['ch']
            for (const [key, value] of Object.entries(jsonData)) {
                if (!excluded.includes(key)) {
                    if (typeof value === 'number')
                        jsonData[key] = (Math.random() - 0.5) * value * 0.05 + value;
                    if (typeof value === 'object')
                        for (const [k, v] of Object.entries(value)) {
                            if (typeof v === 'number')
                                value[k] = (Math.random() - 0.5) * v * 0.05 + v;
                        }
                }
            }
            jsonData['fake'] = true
        }
        // console.log(Date.now() + ' Got Data')
        win.webContents.send('data', jsonData)
    } catch
        (error) {
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