let lastUpdateDate;
var fake_data = typeof require === 'undefined';
console.log(fake_data ? "Faking data.." : "Not faking data.")
const do_time_based_themes = false;


if (!fake_data) {
    const { ipcRenderer, Renderer } = require('electron')

    ipcRenderer.on('data', (event, _data) => {
        // console.log(_data.s)
        if (_data.s == "normal") {
            data = _data;
            $('#status').html("Got last data " + new Date().toLocaleTimeString())
            $('#status').css({ "background-color": "grey" })
            lastUpdateDate = new Date();
            onUpdate();
        } else if (_data.s == "bms_error") {
            console.log("BMS Error: " + _data.error)
        } else if (_data.s == "log") {
            console.log(_data.m)
        }
    })

    ipcRenderer.on('select_port', (event, _data) => {
        $('#overlay').show();
        console.log('2) Selecting port')
    })
}



function sendPort(portName) {
    console.log('3) Sending port ' + portName)
    ipcRenderer.send('selected_port', portName)
    $('#overlay').hide();
}