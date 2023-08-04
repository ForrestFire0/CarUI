<script>
    // An object explorer for the live data.
    import ObjectViewer from "../SvelteComponents/ObjectViewer.svelte";

    import * as datas from "../SvelteComponents/data.js";
    import Console, {write} from "../SvelteComponents/Console.svelte";
    import {deviceStatusData} from "../SvelteComponents/data.js";

    let data_sources = Object.entries(datas).filter(([k, v]) => typeof v === 'object' && 'subscribe' in v)

    // If we notice deviceStatusData.status change, then we will add that to the console string
    const options = ["Waiting for plug", "Plugged in, not charging", "Charging paused, balancing cells", "Charging!", "Waiting For Charger", "Charging paused, balancing cells.", "Charging via outlet"];
    let lastStatus = undefined;
    $: if (typeof $deviceStatusData.state === "number" && $deviceStatusData.state !== lastStatus) {
        write(options[$deviceStatusData.state]);
        lastStatus = $deviceStatusData.state;
    }
</script>
<div style="padding: 3vh; height: 94vh">
    <h1>Raw Data</h1>

    {#each data_sources as [k, v]}
        <ObjectViewer name={k} value={v}/>
    {/each}
    <h1>Log</h1>
    <Console/>
</div>