const { ipcRenderer } = require("electron");

gauges = {
    packVoltage: null,
    minVoltage: null,
    avgVoltage: null,
    maxVoltage: null,
    temps: {
        main: null,
        background: null,
        Q0Q4: null,
        Q1Q3: null,
        text: null,
        label: null,
    },
    fan: null,
    voltageGraph: null,
    upperBoundsText: null,
    lowerBoundsText: null,
}

let voltages = []
let powers = []

var Gauge = window.Gauge;

let x = document.getElementById("temps").width.baseVal.value;
let centerX = x / 2;

var clock = document.getElementById('clock');
function updateClock() {
    clock.textContent = new Date().toLocaleTimeString();
    //Check to see if a lot of time has passed since we were last updated. If so, make the background of the 
    if (new Date() - lastUpdateDate > new Date(3000)) {
        $('#status').css({ "background-color": "red" })
    }
    if (do_time_based_themes) {
        const hours = (new Date()).getHours();
        const isDay = (hours >= 6 && hours < 18);
        if (isDay && dark) {
            lightTheme();
        } else if (!isDay && !dark) {
            darkTheme();
        }
    }
}

setInterval(updateClock, 1000);

$(document).ready(function () {

    var e = $('.cell');
    for (var i = 0; i < 20; i++) {
        e.clone().insertAfter(e);
    }

    gauges.packVoltage = Gauge(document.getElementById("packVoltage"), {
        max: 90, min: 60,
        label: function (value) { return value.toFixed(1); },
        color: function (value) { return getColor(value, 88.1, 65); },
    }); gauges.packVoltage.setValue(60);

    gauges.minVoltage = Gauge(document.getElementById("minVoltage"), {
        min: 2.7, max: 4.2,
        label: function (value) { return value.toFixed(2); },
        color: function (value) { return getColor(value, 4.15, 3.2); }
    });

    gauges.avgVoltage = Gauge(document.getElementById("avgVoltage"), {
        min: 2.7, max: 4.2,
        label: function (value) { return value.toFixed(2); },
        color: function (value) { return getColor(value, 4.15, 3.2); }
    });

    gauges.maxVoltage = Gauge(document.getElementById("maxVoltage"), {
        min: 2.7, max: 4.2,
        label: function (value) { return value.toFixed(2); },
        color: function (value) { return getColor(value, 4.15, 3.2); }
    });


    let temps = Snap("#temps");
    let marker = temps.line(5, 4, 5, 6).attr({
        stroke: "#FF5733",
        strokeLinecap: "round",
        strokeWidth: .75,
    }).marker(4, 2, 6, 8, 5, 5);

    gauges.temps.main = temps;
    centerX = document.getElementById("temps").width.baseVal.value / 2;
    let centerY = document.getElementById('temps').height.baseVal.value * 0.9;
    // The main arc
    gauges.temps.background = temps.path([
        "M", centerX * .2, centerY,
        "A", centerX * .82, centerX * .82, 0, 1, 1, centerX * 1.8, centerY
    ].join(" ")).attr({
        stroke: "#566675",
        strokeWidth: 9,
        strokeLinecap: "round",
        fill: "rgba(0, 0, 0, 0.267)",
    })

    ptFrmVal = function (value) {
        value = Math.clamp(value, 10, 50);
        const totalLen = gauges.temps.background.getTotalLength();
        const len = totalLen * (value - 10) / (50);

        let pt = gauges.temps.background.getPointAtLength(len);
        return pt.x + " " + pt.y;
    }

    //The max to min arc
    gauges.temps.Q0Q4 = temps.path([
        "M", ptFrmVal(10),
        "A", centerX * .82, centerX * .82, 0, 0, 1, ptFrmVal(13),
    ].join(" ")).attr({
        stroke: "#FF5733",
        // strokeLinecap: "round",
        strokeWidth: 15,
        fill: "none",
        "marker-start": marker,
        "marker-end": marker,
    })

    //The Q1 to Q3 arc
    //The max to min arc
    gauges.temps.Q1Q3 = temps.path([
        "M", ptFrmVal(11),
        "A", centerX * .82, centerX * .82, 0, 0, 1, ptFrmVal(12),
    ].join(" ")).attr({
        stroke: "#FFC300",
        strokeWidth: 25,
        fill: "none",
    })

    gauges.temps.text = temps.text(90, 100, "Min: 00 Max: 00").attr({
        fontWeight: "bolder",
        fontSize: "larger"
    })
    temps.text(40, 180, "10").attr({
        fontWeight: "bolder",
        fontSize: "larger",
        fill: "#566675",
    })
    temps.text(268, 180, "50").attr({
        fontWeight: "bolder",
        fontSize: "larger",
        fill: "#566675",
    })

    let voltageGraph = Snap("#voltages");
    gauges.voltageGraph = voltageGraph.polyline([10, 10]).attr({
        fill: "none",
        stroke: "#FF5733",
        strokeWidth: "5"
    });
    gauges.powerGraph = voltageGraph.polyline([10, 10]).attr({
        fill: "none",
        stroke: "black",
        strokeWidth: "5"
    })
    gauges.upperBoundsVoltageText = voltageGraph.text(0, -19, "90 V")
    gauges.lowerBoundsVoltageText = voltageGraph.text(0, 132, "60 V")

    gauges.upperBoundsPowerText = voltageGraph.text(350, -19, "10 kW")
    gauges.lowerBoundsPowerText = voltageGraph.text(355, 132, "0 kW")
    // voltageGraph.text(330, 125, "70 s")

    gauges.current = Gauge(document.getElementById("current"), {
        min: -50, max: 500,
        label: function (value) { return value.toFixed(0); },
        color: function (value) { return getColor(value, 0, 400); }
    });

    ipcRenderer.send('ready_for_data')
});

let hidden = false;
function onUpdate() {

    if (!hidden) {
        hidden = true;
        $('#photo').animate({ opacity: 0 }, 4000)
    }

    let min = 5, max = 0, sum = 0;
    let Q0, Q1, Q2, Q3, Q4;
    let battFan, battHeater, current, charging, temps, animationDuration;
    if (fake_data) {
        animationDuration = 1;
        Q0 = 12, Q1 = 14, Q2 = 16, Q3 = 18, Q4 = 26;
        battFan = Math.random() * 100;
        battHeater = Math.random() * 100;
        current = (Math.random() - .1) * 500;
        charging = Math.floor(5 * Math.random());
        temps = []
        for (let i = 0; i < 20; i++)
            temps.push(10 * Math.random() + 15);
    } else {
        temps = data.t;
        if (!temps) {
            temps = []
            for (let i = 0; i < 20; i++)
                temps.push(10 * Math.random() + 15);
        }
        battFan = data.f;
        battHeater = data.h;
        current = data.pC;
        charging = data.ch;
        animationDuration = data.i;
        bS = data.bS.toString(2).split("").reverse().join("");
    }
    temps = temps.sort(function (a, b) { return a - b });
    Q0 = temps[0];
    Q1 = temps[Math.round(temps.length / 4)];
    Q2 = temps[Math.round(temps.length / 2)];
    Q3 = temps[Math.round(3 * temps.length / 4)];
    Q4 = temps.last();


    $(".cell").each(function (index) {
        let voltage, balancing;
        if (fake_data) {
            voltage = Math.random() * (4.2 - 3.0) + 3.0;
            balancing = voltage > 4.0;
        }
        else {
            voltage = data.c[index];
            balancing = bS[index] == '1';
        }

        min = Math.min(min, voltage);
        max = Math.max(max, voltage);
        sum += voltage;
        $(this).html(voltage.toFixed(2));
        if (balancing) $(this).addClass('balancing');
        else $(this).removeClass('balancing');
        $(this).css("background-color", getColor(voltage));
    })
    gauges.maxVoltage.setValueAnimated(max, animationDuration);
    gauges.avgVoltage.setValueAnimated(sum / 21, animationDuration);
    gauges.minVoltage.setValueAnimated(min, animationDuration);
    gauges.packVoltage.setValueAnimated(sum, animationDuration);
    gauges.current.setValueAnimated(current, animationDuration);

    centerX = document.getElementById("temps").width.baseVal.value / 2;
    gauges.temps.Q0Q4.animate({
        d: [
            "M", ptFrmVal(Q0),
            "A", centerX * .82, centerX * .82, 0, 0, 1, ptFrmVal(Q4),
        ].join(" ")
    }, animationDuration * 1000, mina.easeinout)

    gauges.temps.Q1Q3.animate({
        d: [
            "M", ptFrmVal(Q1),
            "A", centerX * .82, centerX * .82, 0, 0, 1, ptFrmVal(Q3),
        ].join(" ")
    }, animationDuration * 1000, mina.easeinout)

    gauges.temps.text.attr({
        text: "Min: " + Q0.toFixed(0) + " Max: " + Q4.toFixed(0)
    })

    $("#fanB").animate({
        height: (battFan * .155) + "vw",
    }, {
        duration: animationDuration * 1000,
        step: function (i) {
            $("#fanP").html(Math.round(i / .155) + "%");
        }
    });

    $("#heatB").animate({
        height: (battHeater * .155) + "vw",
    }, {
        duration: animationDuration * 1000,
        step: function (i) {
            $("#heatP").html(Math.round(i / .155) + "%");
        }
    });
    //0 for not plugged in (driving or sitting), 1 for plugged in balancing, 2 for plugged in charging, 3 for plugged in waiting to heat up, 4 for plugged in doing nothing.
    switch (charging) {
        case 0:
            $('#chgstatus').html("Not plugged in.");
            $('#chgstatus').css('background-color', getColor(0, 3, 0));
            break;
        case 1:
            $('#chgstatus').html("Charging paused: balancing...")
            $('#chgstatus').css('background-color', getColor(1, 3, 0));
            break;
        case 2:
            $('#chgstatus').html("Charging!")
            $('#chgstatus').css('background-color', getColor(1.5, 3, 0));
            break;
        case 3:
            $('#chgstatus').html("Charging paused: too cold❄️")
            $('#chgstatus').css('background-color', getColor(1, 3, 0));
            break;
        case 4:
            $('#chgstatus').html("Charging completed!")
            $('#chgstatus').css('background-color', 'grey');
            break;

    }

    // Each time, take the max voltage and add it to the end of the list with the time value.
    voltages.push(sum);
    powers.push(Math.abs(sum * current));

    gauges.voltageGraph.attr({
        points: getVoltagePathString()
    })

    gauges.powerGraph.attr({
        points: getPowerPathString()
    })
}

if (fake_data) {
    setInterval(onUpdate, 2000);
}

function getVoltagePathString() {
    ret = "";
    // cut off any extra values in the front of the graph if needed.
    voltages = voltages.slice(Math.max(voltages.length - 35, 0));

    // Find the max and minimum values in order to establish the axis
    let maxY = voltages.reduce(function (a, b) {
        return Math.max(a, b);
    });

    let minY = voltages.reduce(function (a, b) {
        return Math.min(a, b);
    });

    maxY += Math.max(1, .2 * (maxY - minY));
    minY -= Math.max(1, .2 * (maxY - minY));

    maxY = Math.round(maxY)
    minY = Math.round(minY)

    gauges.lowerBoundsVoltageText.attr({ text: minY + 'V' })
    gauges.upperBoundsVoltageText.attr({ text: maxY + 'V' })

    i = 0;
    voltages.forEach(e => {
        // -25 = 90,  125 = 60
        ret += i + "," + Math.map(minY, maxY, 125, -25, e).toFixed(1) + ",";
        i += 10;
    });
    return ret.slice(0, -1);
}

function getPowerPathString() {
    ret = "";
    // cut off any extra values in the front of the graph if needed.
    powers = powers.slice(Math.max(powers.length - 35, 0));

    // Find the max and minimum values in order to establish the axis
    let maxY = powers.reduce(function (a, b) {
        return Math.max(a, b);
    });


    minY = 0;
    maxY += Math.max(1, .2 * (maxY - minY));
    maxY = Math.max(Math.round(maxY / 1000), 1) * 1000;

    gauges.upperBoundsPowerText.attr({ text: maxY / 1000 + ' kW' })

    i = 0;
    powers.forEach(e => {
        // -25 = 90,  125 = 60
        ret += i + "," + Math.map(minY, maxY, 115, -25, e).toFixed(1) + ",";
        i += 10;
    });
    return ret.slice(0, -1);
}

function getColor(voltage, max = 4.15, min = 3.2) {
    start = "#ff5000"
    end = "#00ff00"
    // from 3.2 to 4.15
    let factor = (voltage - min) / (max - min);
    return r2h(interpolateHSL(h2r(start), h2r(end), factor));
}

dark = false;

function lightTheme() {
    $("body").css("background-color", "rgb(255, 200, 200)");
    $("#gauges").css("color", "black");
    $("#area-3").css("color", "black");
    $("#clock").css("color", "black");
    $("h1").css("color", "black");
    $(".gauge-container>.gauge .value-text").css("fill", "black");
    dark = false;
}

function darkTheme() {
    $("body").css("background-color", "rgb(80, 0, 0)");
    $("#gauges").css("color", "pink");
    $("#area-3").css("color", "pink");
    $("#clock").css("color", "white");
    $("h1").css("color", "white");
    $(".gauge-container>.gauge .value-text").css("fill", "white");
    dark = true;
}

// Converts a #ffffff hex string into an [r,g,b] array
var h2r = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
var r2h = function (rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

var rgb2hsl = function (color) {
    var r = color[0] / 255;
    var g = color[1] / 255;
    var b = color[2] / 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
};

var hsl2rgb = function (color) {
    var l = color[2];

    if (color[1] == 0) {
        l = Math.round(l * 255);
        return [l, l, l];
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var s = color[1];
        var q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
        var p = 2 * l - q;
        var r = hue2rgb(p, q, color[0] + 1 / 3);
        var g = hue2rgb(p, q, color[0]);
        var b = hue2rgb(p, q, color[0] - 1 / 3);
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
};

var interpolateHSL = function (color1, color2, factor) {
    if (arguments.length < 3) { factor = 0.5; }
    var hsl1 = rgb2hsl(color1);
    var hsl2 = rgb2hsl(color2);
    for (var i = 0; i < 3; i++) {
        hsl1[i] += factor * (hsl2[i] - hsl1[i]);
    }
    return hsl2rgb(hsl1);
};