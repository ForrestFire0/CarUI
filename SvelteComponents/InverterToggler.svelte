<script>
    import {darkMode} from "./stores";

    const {ipcRenderer} = require("electron");

    export let inverterState = false;
</script>

<style>
    .container {
        margin: .78vw;
        border-radius: .39vw;
        padding: .39vw;
        width: 45%;
        transition: background-color 2s ease, box-shadow 2s;
        font-size: 10px;
    }

    .parent {
        position: relative;
        top: 0;
        left: 0;
    }

    .image1 {
        position: relative;
        top: 0;
        left: 0;
    }

    .image2 {
        position: absolute;
        top: 0;
        left: 0;
    }
</style>

<div class="container" on:click={() => ipcRenderer.send('inverter', !inverterState)} style="
                    background: {$darkMode? '#383838' : '#cccccc'};
                    box-shadow: .39vw .39vw .625vw .156vw {$darkMode? '#2a2a2a' : '#6B6B6B'};">
    Turn Inverter {inverterState ? 'Off' : 'On'}
    <div class="parent">
        <img src="./static/outlet.svg" alt="details" class="image1"/>
        {#if inverterState}
            <img src="./static/cross.svg" alt="details" class="image2"/>
        {/if}
    </div>
</div>