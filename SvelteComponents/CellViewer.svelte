<script>

    import {BMSData} from "./data";
    import {fade} from 'svelte/transition'

    let median;
    $: median = $BMSData.cellVoltages.length ? $BMSData.cellVoltages[Math.floor($BMSData.cellVoltages.length / 2)] : null;

    let showing = -1;
</script>

<style>
    .bar {
        stroke: #4793d3;
        stroke-width: 2px;
    }

    .pt {
        stroke: #06309a;
        opacity: 0.8;
        stroke-width: 2px;
        stroke-linecap: round;
    }
</style>

<svg viewBox="0 0 200 40" style="height: 100%; width: 100%">
    <line x1="0" x2="200" y1="20" y2="20" class="bar" style=""></line>
    {#each $BMSData.cellVoltages as cellVoltage, i}
        {#if showing === i}
            <g out:fade="{{duration: 2000 }}">
                <text x="{i*(180/20) + 10}" y="{20 - (cellVoltage - median) * 50 + ((cellVoltage < median) ? 6 : -5)}"
                      style="font-size: 4px; font-family: 'Metropolis', monospace; text-anchor: middle;">
                    {cellVoltage.toFixed(2)}V
                </text>
                <text x="{i*(180/20) + 10}" y="{20 - (cellVoltage - median) * 50 + ((cellVoltage < median) ? 10 : -9)}"
                      style="font-size: 4px; font-family: 'Metropolis', monospace;  text-anchor: middle; font-weight: bold">
                    #{i}
                </text>
            </g>
        {/if}
        <line x1={i*(180/20) + 10} x2={i*(180/20) + 10} y1={20} y2={20 - (cellVoltage - median) * 50} class="pt"
              on:click={() => {showing=i; setTimeout(() => showing=-1, 1000)}} on:keydown={() => {}}></line>
    {/each}
</svg>