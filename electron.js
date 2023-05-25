const {app, BrowserWindow, ipcMain} = require('electron')
if (require('electron-squirrel-startup')) return app.quit();
const path = require("path");

let send_fake_data, fs, SerialPort, Readline, rearPort, frontPort;
fs = require('fs');

if (process.env.COMPUTERNAME === "FORRESTS-LAPTOP" && process.env.fakeData) {
    console.log("Sending Fake Data")
    send_fake_data = true;
} else {
    SerialPort = require('serialport').SerialPort;
    Readline = require('@serialport/parser-readline').ReadlineParser;
}

async function createPort(portID) {
    let port;
    if (portID.startsWith('FAKE')) {
        console.log('creating rearPort with id ' + portID + ' note: is fake');
        win.webContents.send('console', 'creating rearPort with id ' + portID + ' note: is fake');
        setInterval(() => {
            const string = fs.readFileSync(`fake/${portID}.json`);
            parseAndSend(string)
        }, portID === 'FAKE_FRONT' ? 200 : 1520)
        return "Its a fake port bozo";
    }
    console.log('creating port @ ' + portID);
    port = await new Promise((resolve, reject) => {
        const port = new SerialPort({path: portID, baudRate: 115200}, (err) => {
            if (err) {
                console.log('Unable to open rearPort: ', err.message);
                win.webContents.send('console', 'Unable to open rearPort: ' + err.message)
                resolve(undefined);
            } else {
                console.log('Successfully opened port @ ' + portID);
                win.webContents.send('console', 'Successfully opened port @ ' + portID)
                resolve(port)
            }
        });
    });
    if (!port) return;
    const parser = port.pipe(new Readline({delimiter: '\n'}));
    parser.on('data', data => {
        parseAndSend(data);
    });
    return port;
}


ipcMain.on('ready', async () => {
    if (rearPort) return;
    console.log('The program is ready for data');
    if (send_fake_data) {
        frontPort = createPort('FAKE_FRONT')
        rearPort = createPort('FAKE_REAR')
        return
    }
    if (process.env.COMPUTERNAME === "FORRESTS-LAPTOP") {
        frontPort = await createPort('COM4');
        // rearPort = createPort('FAKE_REAR')
        rearPort = await createPort('COM20');
    } else {
        frontPort = await createPort('COM6');
        rearPort = await createPort('COM5');
    }
});

ipcMain.on('reset', async () => {
    if(rearPort.isOpen) {
        rearPort.close();
    }
    if(frontPort.isOpen) {
        frontPort.close();
    }

    if (send_fake_data) {
        frontPort = createPort('FAKE_FRONT')
        rearPort = createPort('FAKE_REAR')
        return
    }
    if (process.env.COMPUTERNAME === "FORRESTS-LAPTOP") {
        frontPort = await createPort('COM4');
        rearPort = createPort('FAKE_REAR')
    } else {
        frontPort = await createPort('COM6');
        rearPort = await createPort('COM5');
    }
});

ipcMain.on('inverter', (event, on) => {
    if (frontPort && !send_fake_data)
        frontPort.write(Buffer.from(`i${on ? 'y' : 'n'}\n`, 'utf8'));
    else console.log('No frontPort')
    console.log('Inverter port set to ' + on)
});

ipcMain.on('led_select', (event, led) => {
    if (rearPort && !send_fake_data)
        rearPort.write(Buffer.from([led]))
    else console.log('No rearPort')
    console.log('The user has selected LED ' + led)
});

let win;

function createWindow() {
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
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
                        jsonData[key] = (Math.random() - 0.5) * value * 0.001 + value;
                    if (typeof value === 'object')
                        for (const [k, v] of Object.entries(value)) {
                            if (typeof v === 'number')
                                value[k] = (Math.random() - 0.5) * v * 0.001 + v;
                        }
                }
            }
            jsonData['fake'] = true
        }
        win.webContents.send('data', jsonData)
    } catch (error) {
        console.log(string)
        win.webContents.send('console', 'Error parsing data: ' + error.message)
    }
}


app.whenReady().then(createWindow)


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log("Closing program.")
        app.quit()
    }
})

let currentFile = undefined;
ipcMain.on('file_open', (event) => {
    // If /logs doesn't exist, create the folder
    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }

    //Set current file to log, then the current month, day, hour, minute, second considering the timezone
    currentFile = `./logs/log${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})
        .replace(/[/, :]/g, '-')
        .replaceAll('--', '-')}.txt`;
    fs.writeFileSync(currentFile, '');
});

ipcMain.on('file_write', (event, data) => {
    if (currentFile) {
        fs.appendFileSync(currentFile, data);
    }
});