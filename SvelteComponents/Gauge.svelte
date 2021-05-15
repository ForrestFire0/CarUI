<script>
    import { onMount } from "svelte";
    import Gauge from "../public/libs/gauge.min.js";
    import { getColor } from "../graphicstwo.js";
    export let name = "No name given";
    export let bounds = [0, 10];
    export let colorBounds = bounds;
    export let value = bounds[0];
    export let digits = 3 - (bounds[1] + "").split(".")[0].length;
    let gaugeElement;
    let gaugeObject;

    $: if (gaugeObject && value) gaugeObject.setValueAnimated(value);

    onMount(() => {
        gaugeObject = Gauge(gaugeElement, {
            max: bounds[1],
            min: bounds[0],
            label: function (value) {
                return value.toFixed(digits);
            },
            color: function (value) {
                return getColor(value, colorBounds[1], colorBounds[0]);
            },
        });
        if (value) gaugeObject.setValue(value);
    });
</script>

<div bind:this={gaugeElement} class="gauge-container" />
{name}

<style>
    .gauge-container {
        width: 100%;
        height: 12vw;
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
