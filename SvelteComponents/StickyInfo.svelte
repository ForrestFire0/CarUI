<script>
    import {deviceStatusData, remainingAH} from "./data";
    import {currentTime} from "./stores";
</script>

<style>
    .container {
        display: flex;
        /*flex-direction: column;*/
        align-items: center;
        justify-content: center;
    }

    .container > * {
        margin: 0 0 0 7px;
    }

    .container > span {
        margin-top: 2px;
    }

    .pill {
        display: inline-block;
        position: relative;
        width: 100px;
        height: 25px;
        border-radius: 25px;
        border: 1px solid grey;
    }

    .level {
        position: absolute;
        inset: 2px;
        border-radius: 38px;
        overflow: hidden;
    }

    .liquid {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: greenyellow;
        transition: .3s;
    }
</style>

<div style="text-align: center; font-size: 3vw; font-weight: bolder; margin-top: 5px">
    {$currentTime.toLocaleTimeString()}
</div>
<div class="container">
    <span style="border-right: 1px grey solid; padding-right: 7px; display: inline-block; margin-right: 0">
            {($remainingAH * 3.7 * 21 * 0.0035).toFixed(0)}mi
    </span>
    <span>
        {($remainingAH / 1.36).toFixed(0)}%
    </span>
    <div class="pill">
        <div class="level">
            <div class="liquid" style="width: {$remainingAH / 1.36}%"
            ></div>
        </div>
    </div>
</div>
{#if $currentTime > $deviceStatusData.lastFrontContact + 60000}
    <div style="color: red; font-size: 1.4vw; font-weight: bolder; margin-top: 5px">
        Error - No Contact with Front Node! (a good while ago)
    </div>
{:else if $currentTime > $deviceStatusData.lastFrontContact + 3000}
    <div style="color: orange; font-size: 1.4vw; font-weight: bolder; margin-top: 5px">
        Error - No Contact with Front Node! ({(($currentTime - $deviceStatusData.lastFrontContact) / 1000).toFixed(0)}s ago)
    </div>
{/if}

{#if $currentTime > $deviceStatusData.lastBackContact + 60000}
    <div style="color: red; font-size: 1.4vw; font-weight: bolder; margin-top: 5px">
        Error - No Contact with Back Node! (a good while ago)
    </div>
{:else if $currentTime > $deviceStatusData.lastBackContact + 3000}
    <div style="color: orange; font-size: 1.4vw; font-weight: bolder; margin-top: 5px">
        Error - No Contact with Back Node! ({(($currentTime - $deviceStatusData.lastBackContact) / 1000).toFixed(0)}s ago)
    </div>
{/if}
