import {get, writable} from 'svelte/store';
import {storable} from "./stores";

// The issue we are having is that data comes sporadically from the front and back Arduino's.
// Some pages just need to the current state. But it becomes tricky when we need the history of datapoints (the graphs)
// We also do not want to rerender everything if something hasn't changed.
// Compromise - we will compartmentalize by different components.
export const numCells = 21;
export const controllerData = writable({
    speed: 0,
    voltage: 77.7,
    motorCurrent: 450,
    power: 23,
    batteryCurrent: 296,
    accelerometer: {x: 0, y: .2}
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
    inputVoltage: 150,
    outputVoltage: 78,
    temp: 35,
    running: true,
    lastChargerPing: new Date().getTime(),
});
export const updateDatas = (data, off) => {
    let lastUpdateTime, updateTime = new Date().getTime() + off * 60 * 60 * 1000, current, ignore = true, batteryFull = false;
    if (data.id === 'front') {
        deviceStatusData.update(e => {
            lastUpdateTime = e.lastFrontContact;
            e.lastFrontContact = updateTime;
            e.reverse = data.reverse;
            e.ignition = data.ignition;
            // console.log(data.ignition)
            return e;
        })
        controllerData.update((cD) => {
            cD.voltage = data.voltage;
            cD.motorCurrent = data.motorCurrent;
            cD.power = data.power;
            cD.batteryCurrent = data.batteryCurrent;
            cD.accelerometer = data.accelerometer;
            cD.speed = data.speed;
            current = -data.batteryCurrent;
            ignore = current > -10 || !data.ignition;
            return cD;
        })
        inverterData.update((iD) => {
            iD.on = data.inverter;
            return iD;
        })
    } else if (data.s === 'normal') {
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
            bD.batteryVoltage = data.c.reduce((a, b) => a + b, 0);
            return bD;
        })
        chargerData.update((cD) => {
            cD.current = data.CC;
            cD.inputVoltage = data.CIV;
            cD.outputVoltage = data.COV;
            cD.temp = data.CT;
            cD.running = data.CR;
            cD.lastChargerPing = data.lcp;
            current = data.CC;
            ignore = !data.CR;
            batteryFull = data.CR && (numCells * 4.15 < cD.outputVoltage);
            return cD;
        })
    }
    if (!ignore && lastUpdateTime) {
        remainingAH.update((rAH) => {
            // console.log('updating remainingAH', rAH.toFixed(3), current.toFixed(0), (updateTime - lastUpdateTime).toFixed(0), 'delta:', (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60))
            if(Math.abs(lastUpdateTime - updateTime) > 1000 * 60) return rAH;
            if (batteryFull) return 136;
            rAH = rAH + (current * (updateTime - lastUpdateTime) / 1000 / 60 / 60); // Amps * ms = A*ms / 1000 = A*s / 3600 = Ah
            if (rAH < 0) rAH = 0;
            return rAH;
        });
    }
}

export function SOCFromVoltage(voltage) {
    const voltages = [3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3., 4, 4.1, 4.2];
    const SOC = [0.000, 0.769, 2.564, 7.631, 22.938, 44.578, 60.941, 70.970, 80.998, 89.444, 97.361, 100.000, 100.000];
    // if voltage is outside the range of voltages, return the first or last SOC
    if (voltage <= voltages[0]) return SOC[0];
    if (voltage >= voltages[voltages.length - 1]) return SOC[SOC.length - 1];
    // find the two voltages that the current voltage is between
    let i = 0;
    while (voltage > voltages[i]) i++;
    // interpolate between the two voltages
    return SOC[i - 1] + (SOC[i] - SOC[i - 1]) * (voltage - voltages[i - 1]) / (voltages[i] - voltages[i - 1]);
}