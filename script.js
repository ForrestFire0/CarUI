let data;
let lastUpdateDate;
var fake_data = typeof require === 'undefined';
console.log(fake_data ? "Faking data.." : "Not faking data.")
const do_time_based_themes = false;

Math.clamp = function (number, min, max) {
    return Math.max(min, Math.min(number, max));
}

Array.prototype.last = function () {
    return this[this.length - 1];
}

Math.map = function (in_min, in_max, out_min, out_max, val) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

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



function sendPort() {
    console.log('3) Sending port ' + $('#portsSelect').val())
    ipcRenderer.send('selected_port', $('#portsSelect').val())
    $('#overlay').hide();
}