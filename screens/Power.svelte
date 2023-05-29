<script>
    import {controllerData, deviceStatusData} from "../SvelteComponents/data";
    import GForceMonitor from "../SvelteComponents/GForceMonitor.svelte";
    import {tweened} from 'svelte/motion';

    let counter = 0;
    let stableValue = 0;

    let rawSpeed;

    let eff = tweened(0, {
        duration: 500,
    });

    $: {
        eff.set($controllerData.speed / $controllerData.power);
        let speed = $deviceStatusData.ignition ? Number($controllerData.speed.toFixed(0)) : 0; // Our current speed, integer.
        rawSpeed = speed;
        if (speed === 0) stableValue = 0;

        //If the difference between the current speed and the previous speed is greater than 1, then the stableValue should be
        if (Math.abs(speed - stableValue) > 1) {
            stableValue = speed > stableValue ? speed - 1 : speed + 1;
        }


        if (Math.abs(speed - stableValue) === 1) { //If the speed has changed by 1mph
            counter += 1; //Increment the counter
        } else {
            counter = 0; //Otherwise reset the counter. If there is no difference in speed, then also reset.
        }
        if (counter >= 10) {
            stableValue = speed;
        }
    }
    let showGForce = false;
</script>


<div id="container">
    <div>
        <div><span>{$deviceStatusData.ignition ? stableValue.toFixed(0) : '0'}</span>mph</div>
    </div>
    <div on:click={() => showGForce = !showGForce}>
        {#if showGForce}
            <GForceMonitor/>
        {:else}
            <div><span>{$deviceStatusData.ignition ? $eff.toFixed(1) : 0}</span> mi/kWh</div>
        {/if}
    </div>
    <div>
        <div><span>{$deviceStatusData.ignition ? $controllerData.power.toFixed(1) : ' - '}</span>kW</div>
    </div>
    <div>
        <div><span>{$deviceStatusData.ignition ? $controllerData.motorCurrent.toFixed(0) : ' - '}</span>A</div>
        Motor Amps
    </div>
</div>

<style>
    /* Split the screen into 4 equal sections*/
    #container {
        display: grid;
        grid-template-columns: 50vw 50vw;
        grid-template-rows: 50vh 50vh;
        height: 100%;
        width: 100%;
    }

    /* Make the elements inside the grid */
    #container > div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 15px;
        font-family: 'Metropolis', sans-serif;
    }

    #container > div > div {
        font-size: 50px;
        font-family: comfortaa, serif;
    }

    div > div > span {
        font-family: 'Metropolis', sans-serif;
        font-size: 150px;
    }
</style>
