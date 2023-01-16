<script>
    import {controllerData, deviceStatusData} from "./data";
    import {currentTime, gForceScale} from "./stores";
    let x, y;
    $: x = $controllerData.accelerometer.x * 40 / ($gForceScale ? $gForceScale : 1);
    $: y = $controllerData.accelerometer.y * 40 / ($gForceScale ? $gForceScale : 1);
</script>

<style>
    svg {
        display: block;
        margin:auto;
        height: 100%;
    }
</style>

<svg viewBox="0 0 100 100">
    <g stroke="grey" stroke-width="2">
    <line x1="50" x2="50" y1="10" y2="90"></line>
    <line y1="50" y2="50" x1="10" x2="90"></line>
    </g>
    <circle cx="50" cy="50" r="10" fill="{$currentTime > $deviceStatusData.lastFrontContact + 3000 ? 'grey' : 'black'}" transform="translate({x.toFixed(2)} {y.toFixed(2)})"></circle>
</svg>