<script>
    import {onMount} from "svelte";
    import Gauge from "../public/libs/gauge.min.js";
    import {getColor} from "../graphicstwo.js";
    import {darkMode} from "./stores";

    export let name = "No name given";
    export let bounds = [0, 10];
    export let colorBounds = bounds;
    export let value = bounds[0];
    export let digits = 3 - (bounds[1] + "").split(".")[0].length;
    let gaugeElement;
    let gaugeObject;
    const resize = () => {
        height = gaugeElement.offsetWidth * 0.85 + "px"
        fontSize = Math.min(gaugeElement.offsetWidth / name.length * 1.4, 18) + "px";
    }

    $: if (gaugeObject && value) gaugeObject.setValueAnimated(value);

    onMount(() => {
        gaugeObject = Gauge(gaugeElement, {
            max: bounds[1],
            min: bounds[0],
            label: value => value.toFixed(digits),
            color: value => getColor(value, $darkMode, colorBounds[1], colorBounds[0]),
        });
        if (value) gaugeObject.setValue(value);
        resize()
    });
    let height = "12vw"
    let fontSize = "16px"
</script>

<svelte:window on:resize={resize}/>

<div bind:this={gaugeElement} class="gauge-container" style="height: {height}"/>
<div style="margin: 0; font-size: {fontSize}; color: {$darkMode ? 'gray(197)' : ''}">{name}</div>

<style>
    .gauge-container {
        width: 100%;
        display: block;
    }

    .gauge-container > :global(.gauge .dial) {
        stroke: #566675;
        stroke-width: 5;
        stroke-linecap: round;
        fill: rgba(0, 0, 0, 0.267);
    }

    .gauge-container > :global(.gauge .value) {
        stroke-width: 7;
        stroke-linecap: round;
    }

    .gauge-container > :global(.gauge .value-text) {
        fill: black;
        font-weight: bold;
        font-size: 3vh;
    }
</style>
