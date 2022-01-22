import {readable, writable, get} from 'svelte/store';

import SunCalc from '../public/libs/suncalc';

const times = SunCalc.getTimes(new Date(), 39.1532, -77.0669)
export let today_sunset = times.sunset;
export let today_sunrise = times.sunrise;

export const darkMode = readable(new Date() <= today_sunrise || new Date() > today_sunset, set => {
        const update = () => {
            let dm, now = new Date();
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

export const forceMode = writable('Adaptive')