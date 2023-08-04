import {get, writable} from 'svelte/store';
import {accelerometerCalibration, active, storable} from "./stores";

// The issue we are having is that data comes sporadically from the front and back Arduino's.
// Some pages just need to the current state. But it becomes tricky when we need the history of datapoints (the graphs)
// We also do not want to rerender everything if something hasn't changed.
// Compromise - we will compartmentalize by different components.
export const numCells = 41;
export const numBMSCells = 21;
export const controllerData = writable({
    speed: 0,
    voltage: 77.7,
    motorCurrent: 450,
    power: 23,
    batteryCurrent: 296,
    accelerometer: {x: 0, y: .2},
    avgMpkWh: 0,
});
export const inverterData = writable({on: false});
export const deviceStatusData = writable({
    lastFrontContact: 0,
    lastBackContact: 0,
    reverse: false,
    ignition: false,
    state: 0,
    twelveVolt: 12.6,
});
export const temperatureData = writable({}); //Temps, fan
export const BMSData = writable({balanceStatus: 0, cellVoltages: [], lastBMSPing: 0, batteryVoltage: 0});
export const remainingAH = storable('remainingAH', 136);
export const chargerData = writable({
    current: 10,
    maximumCurrent: 10,
    inputVoltage: 150,
    outputVoltage: 78,
    temp: 35,
    running: true,
    lastChargerPing: new Date().getTime(),
});

let lastCapacityUpdate = new Date().getTime(); // If more than 12 hours have elapsed since a capacity update, we will update capacity based on pack voltage.

let accelerometerCalibrationLocal;
accelerometerCalibration.subscribe((value) => accelerometerCalibrationLocal = value);
export const updateDatas = (data, off) => {
    let lastUpdateTime, updateTime = new Date().getTime() + off * 60 * 60 * 1000, current, skipCapacityUpdate = true;
    let batteryFull = false;
    if (data.id === 'front') {
        deviceStatusData.update(e => {
            lastUpdateTime = e.lastFrontContact;
            e.lastFrontContact = updateTime;
            e.reverse = data.reverse;
            if (e.ignition !== data.ignition) { //If the current ignition is false, then we are not active.
                active.set(data.ignition);
            }
            e.ignition = data.ignition;
            return e;
        })
        controllerData.update((cD) => {
            cD.voltage = data.voltage;
            cD.motorCurrent = data.motorCurrent;
            cD.power = data.power;
            cD.batteryCurrent = data.batteryCurrent;
            cD.accelerometer = data.accelerometer;
            cD.accelerometer.x += accelerometerCalibrationLocal.x;
            cD.accelerometer.y += accelerometerCalibrationLocal.y;
            cD.speed = data.speed;
            current = -data.batteryCurrent;
            skipCapacityUpdate = current > -10 || !data.ignition;
            return cD;
        })
        inverterData.update((iD) => {
            iD.on = data.inverter;
            return iD;
        })
    } else if (data.s === 'normal') {
        let bmsBatteryVoltage = data.c.reduce((a, b) => a + b, 0);
        deviceStatusData.update(e => {
            lastUpdateTime = e.lastBackContact;
            e.lastBackContact = updateTime;
            e.state = data.ch;
            e.twelveVolt = data.tw;
            return e;
        })
        temperatureData.update((tD) => {
            tD.batteryTemps = data.bt;
            tD.temps = data.t;
            tD.fan = data.f;
            return tD;
        })
        BMSData.update((bD) => {
            bD.balanceStatus = data.bS;
            bD.cellVoltages = data.c;
            bD.lastBMSPing = data.lbp;
            bD.batteryVoltage = bmsBatteryVoltage;
            return bD;
        })
        chargerData.update((cD) => {
            cD.current = data.CC;
            cD.maximumCurrent = data.CMC;
            cD.inputVoltage = data.CIV;
            cD.outputVoltage = data.COV;
            cD.temp = data.CT;
            // If we are not active, and the charger goes from not running to running, then we are active.
            if (!cD.running && data.CR && !get(active)) {
                console.log('Charger is running, and we are not active. Going to battery page.');
                active.set(true);
                window.location.hash = '';
                window.location.hash = '#Battery';
                // Also scroll the window to the Battery page.
            }
            cD.running = data.CR;
            cD.lastChargerPing = data.lcp;
            cD.current
            current = data.CC;
            skipCapacityUpdate = !data.CR;
            batteryFull = data.CR && (numCells * 4.15 < cD.outputVoltage);
            return cD;
        })
        // If more than 12 hours have elapsed since a capacity update, we will update capacity based on pack voltage.
        // console.log(new Date().getTime(), lastCapacityUpdate, new Date().getTime() - lastCapacityUpdate);
        if (new Date().getTime() - lastCapacityUpdate > 1000 * 60 * 60 * 12) {
            remainingAH.set(1.36 * SOCFromVoltage(bmsBatteryVoltage/numBMSCells));
            // console.log('Updating capacity based on pack voltage to    ', get(remainingAH));
        }
    }
    if (!skipCapacityUpdate && lastUpdateTime) {
        remainingAH.update((rAH) => {
            // console.log('updating remainingAH', rAH.toFixed(3), current.toFixed(0), (updateTime - lastUpdateTime).toFixed(0), 'delta:', (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60))
            if (Math.abs(lastUpdateTime - updateTime) > 1000 * 60) return rAH;
            if (batteryFull) return 136;
            rAH = rAH + (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60); // Amps * ms = A*ms / 1000 = A*s / 3600 = Ah
            return Math.clamp(rAH, 0, 136);
        });
        lastCapacityUpdate = new Date().getTime();
    }
}

export function SOCFromVoltage(voltage) {
    const voltages = [3.03, 3.13, 3.23, 3.33, 3.43, 3.53, 3.63, 3.73, 3.83, 3.93, 4.03, 4.13, 4.17];
    const SOC = [0.000, 0.508, 1.015, 2.538, 9.645, 22.843, 47.208, 62.437, 72.081, 81.392, 89.993, 95.649, 100.000];
    //debug print out voltages|soc using console.table
    // console.table(voltages.map((v,i)=>({voltage:v,SOC:SOC[i]})));
    // if voltage is outside the range of voltages, return the first or last SOC
    if (voltage <= voltages[0]) return SOC[0];
    if (voltage >= voltages[voltages.length - 1]) return SOC[SOC.length - 1];
    // find the two voltages that the current voltage is between
    let i = 0;
    while (voltage > voltages[i]) i++;
    // interpolate between the two voltages
    return SOC[i - 1] + (SOC[i] - SOC[i - 1]) * (voltage - voltages[i - 1]) / (voltages[i] - voltages[i - 1]);
}

export function humanizeDuration(millis) {
    let ret = '';
    let parts = [];
    parts.push([Math.floor(millis / 1000 / 60 / 60), 'h']);
    parts.push([Math.floor(millis / 1000 / 60) % 60, 'm']);
    parts.push([Math.floor(millis / 1000) % 60, 's']);

    parts = parts.filter((p) => p[0] > 0);
    parts.length = Math.min(parts.length, 1);
    parts.forEach((p) => ret += p[0] + p[1]);
    return ret;
}