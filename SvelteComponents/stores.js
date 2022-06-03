import {readable, writable, get} from 'svelte/store';

/**
 * @param {string} localStorageKey The localStorageKey this should be saved under.
 * @param initial The initial value.
 * @returns A writable store, with a get method.
 *  If the initial value is an array, the push method is added.
 *  If the initial value is a date, the value when read from local storage is parsed into a date.
 */
function storable(localStorageKey, initial) {
    if (typeof storable.usedKeys == 'undefined') {
        // It has not... perform the initialization
        storable.usedKeys = [];
    }
    if (storable.usedKeys.includes(localStorageKey)) {
        console.log('Err: cannot use the same key')
    }
    storable.usedKeys.push()
    let initial_value = JSON.parse(localStorage[localStorageKey] ? localStorage[localStorageKey] : JSON.stringify(initial));
    if (initial instanceof Date) {
        console.log(initial_value)
        const b = initial_value.split(/\D+/);
        initial_value = new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
    }
    const ret = writable(initial_value);
    ret.subscribe((value) => localStorage.setItem(localStorageKey, JSON.stringify(value)))
    if (Array.isArray(initial_value)) {
        ret.push = (push_me) => ret.update(e => {
            e.push(push_me);
            return e;
        })
    }
    ret.get = () => get(ret);
    return ret;
}


import SunCalc from '../public/libs/suncalc';
export const timeOffset = storable('timeOffset', 0);
const times = SunCalc.getTimes(new Date(new Date().getTime() + timeOffset.get() * 60 * 60 * 1000), 39.1532, -77.0669)
export let today_sunset = times.sunset;
export let today_sunrise = times.sunrise;

export const darkMode = readable(new Date() <= today_sunrise || new Date() > today_sunset, set => {
    const update = () => {
        let dm, now = new Date(new Date().getTime() + timeOffset.get() * 60 * 60 * 1000);
        if (get(forceMode) === 'Light') dm = false
        else if (get(forceMode) === 'Dark') dm = true;
        else if (get(forceMode) === 'Adaptive') {
            const times = SunCalc.getTimes(now, 39.1532, -77.0669)
            today_sunset = times.sunset;
            today_sunrise = times.sunrise;
            dm = (now <= today_sunrise || now > today_sunset)
        }
        set(dm);
        window.document.body.style.backgroundColor = dm ? '#42514f' : ''
    };
    update();
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval);
});

export const twelveCorrectiveFactor = storable('timeOffset', 1);

export const forceMode = writable('Adaptive')