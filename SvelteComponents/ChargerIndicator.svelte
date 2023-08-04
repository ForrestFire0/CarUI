<script>

    import {BMSData, chargerData} from "./data";
    import {fade} from "svelte/transition";
</script>

<style>
    img {
        height: 6vh;
        width: 6vh;
    }

    td {
        font-size: 3.5vh;
        width: 50%;
        text-align: center;
    }
</style>

<div class="card" style="position: relative">
    {#if $chargerData.running}
        <h3 style="display: flex; justify-content: center; margin: 5px 10px 10px;">charging</h3>
        <table transition:fade style="position: absolute; width: 75%">
            <tr>
                <td><img src="./static/outlet.svg" alt="outlet"></td>
                <td>{$chargerData.inputVoltage.toFixed(0)} V</td>
            </tr>
            <tr>
                <td><img src="./static/battery.svg" alt="batt"></td>
                <td>{$chargerData.outputVoltage.toFixed(1)} V</td>
            </tr>
            <tr>
                <td><img src="./static/battery.svg" alt="batt"></td>
                <td>{$chargerData.current.toFixed(1)} A</td>
            </tr>
            <tr>
                <td><img src="./static/temp.svg" alt="temp"></td>
                <td>{$chargerData.temp.toFixed(1)} C</td>
            </tr>
        </table>
    {:else}
        <table transition:fade style="position: absolute">
            <tr>
                <td><img src="./static/battery.svg" alt="batt"></td>
                <td>{$BMSData.batteryVoltage.toFixed(1)} V</td>
            </tr>
        </table>
    {/if}
</div>