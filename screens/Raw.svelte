<script>
    // An object explorer for the live data.
    import ObjectViewer from "../SvelteComponents/ObjectViewer.svelte";

    import * as datas from "../SvelteComponents/data.js";
    import Console from "../SvelteComponents/Console.svelte";
    import {deviceStatusData} from "../SvelteComponents/data.js";

    let data_sources = Object.entries(datas).filter(([k, v]) => typeof v === 'object' && 'subscribe' in v)

    // If we notice deviceStatusData.status change, then we will add that to the console string
    let console_string = "";
    const options = ["Waiting for plug", "Plugged in, not charging", "Charging paused, balancing cells", "Charging!", "Waiting For Charger"];
    $: if (typeof $deviceStatusData.state === "number") {
        console_string += options[$deviceStatusData.state] + "\n";
    }

</script>
<div style="padding: 2vw">
    <h1>Raw Data</h1>

    {#each data_sources as [k, v]}
        <ObjectViewer name={k} value={v}/>
    {/each}
    <h1>Log</h1>
    <Console text={console_string}/>
</div>