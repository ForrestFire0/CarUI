<script>
    /*
        BIG NUMBER, VERY BOLD carlie
        important numbers we are interested in
        - Current Speed
        - Gs in X and Y
        - Output Power
        - Motor Current
     */


    import {controllerData, deviceStatusData} from "../SvelteComponents/data";
    import GForceMonitor from "../SvelteComponents/GForceMonitor.svelte";
    import {gForceScale} from "../SvelteComponents/stores";
</script>

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

<div id="container">
    <div><div><span>{$deviceStatusData.ignition ? $controllerData.speed.toFixed(0) : '0'}</span>mph</div></div>
    <div><GForceMonitor/></div>
    <div><div><span>{$deviceStatusData.ignition ? $controllerData.power.toFixed(1) : ' - '}</span>kW</div></div>
    <div><div><span>{$deviceStatusData.ignition ? $controllerData.motorCurrent.toFixed(0) : ' - '}</span>A</div>Motor Amps</div>
</div>