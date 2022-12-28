import {readable, writable, get, derived} from 'svelte/store';

/**
 * @param {string} localStorageKey The localStorageKey this should be saved under.
 * @param initial The initial value.
 * @returns A writable store, with a get method.
 *  If the initial value is an array, the push method is added.
 *  If the initial value is a date, the value when read from local storage is parsed into a date.
 */
export function storable(localStorageKey, initial) {
    if (typeof storable.usedKeys == 'undefined') {
        // It has not... perform the initialization
        storable.usedKeys = [];
    }
    if (storable.usedKeys.includes(localStorageKey)) {
        console.log('Err: cannot use the same key')
        console.log(storable.usedKeys)
        return;
    }
    storable.usedKeys.push(localStorageKey)
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

export const forceMode = storable('forceMode', 'Adaptive')
export const timeOffset = storable('timeOffset', 0);
export const currentTime = derived(timeOffset, ($timeOffset, set) => {
    console.log($timeOffset);
    const update = () => set(new Date(new Date().getTime() + $timeOffset * 1000 * 60 * 60))
    const interval = setInterval(update, 1000);
    update()
    return () => clearInterval(interval);
});
export const darkMode = derived([currentTime, forceMode], ([$currentTime, $forceMode], set) => {
    let dm;
    if ($forceMode === 'Light') dm = false
    else if ($forceMode === 'Dark') dm = true;
    else if ($forceMode === 'Adaptive') {
        try {
            const times = SunCalc.getTimes($currentTime, 39.1532, -77.0669)
            const today_sunset = times.sunset;
            const today_sunrise = times.sunrise;
            // console.log(today_sunrise);
            // console.log(today_sunset);
            // console.log($currentTime);
            dm = ($currentTime <= today_sunrise || $currentTime > today_sunset)
        } catch (e) {
            dm = false;
        }
    }
    set(dm);
});
// darkMode.subscribe((dm) => {
//     console.log("The dark mode was updated to " + dm);
//     console.trace()
// })
// forceMode.subscribe((dm) => {
//     console.log("The force mode was updated to " + dm);
//     console.trace()
// })
export const twelveCorrectiveFactor = storable('twelveCorrectiveFactor', 1);
export const gForceScale = storable('gForceScale', 1);

darkMode.subscribe((dm) => document.documentElement.setAttribute('data-theme', dm ? 'dark' : 'light'))
// forceMode.set('Dark')