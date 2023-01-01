<script>
    /* Accessories will include:
       - Accessories
       - Power Use
       - Battery Total Voltage and status
     */
    import LabeledSwitch from "../SvelteComponents/Inputs/LabeledSwitch.svelte";
    import {
        BMSData,
        deviceStatusData,
        inverterData,
        numCells,
        remainingAH,
        SOCFromVoltage
    } from "../SvelteComponents/data";
    import Overlay from "../SvelteComponents/Overlay.svelte";
    import Snake from "../SvelteComponents/Games/Snake.svelte";
    import C4 from "../SvelteComponents/Games/C4.svelte";
    import {currentTime, forceMode, gForceScale, timeOffset, twelveCorrectiveFactor} from "../SvelteComponents/stores";
    import ImageButton from "../SvelteComponents/Inputs/ImageButton.svelte";
    import SunCalc from '../public/libs/suncalc';
    import Logger from "../SvelteComponents/Games/Logger.svelte";
    import NumberInput from "../SvelteComponents/Inputs/NumberInput.svelte";

    let showSnake = false, showC4 = false, showSettings = false, showLogger = false;

</script>

<div>
    <h1>Accessories</h1>
    <h3>Inverter</h3>
    <LabeledSwitch options="{['On', 'Off']}" selected="Off"
                   on:change={(e) => window.communications.send('inverter', !Boolean(e.detail.index))}/>
    <h3>Battery Illumination</h3>
    <LabeledSwitch options="{['Voltage Mode', 'Hue Rotation', 'Crazy Colors', 'Solid']}"
                   on:change={(e) => window.communications.send('led_select', e.detail.index)}/>
    <h3>Apps</h3>
    <ImageButton src="./static/snake.svg" on:click={() => showSnake = true} width="7vw"/>
    <ImageButton src="./static/c4.svg" on:click={() => showC4 = true} width="7vw"/>
    <ImageButton src="./static/details.svg" on:click={() => showLogger = true} width="7vw"/>
    <ImageButton src="./static/gear.svg" on:click={() => showSettings = true} width="7vw"/>
</div>

<Overlay bind:shown={showSnake} closable="{false} ">
    <Snake on:closeOverlay={() => showSnake = false}/>
</Overlay>

<Overlay bind:shown={showC4} closable="{false}">
    <C4 on:closeOverlay={() => showC4 = false}/>
</Overlay>

<Overlay bind:shown={showLogger} closable="{false}">
    <Logger on:closeOverlay={() => showLogger = false}/>
</Overlay>

<Overlay bind:shown={showSettings}>
    <div style="overflow-y: scroll; height: 80vh;">
        <h1>Settings</h1>
        <h3>12V Sensor Calibration</h3>
        <NumberInput bind:value={$twelveCorrectiveFactor} formatNumber={(n) => (100 * n).toFixed(0) + '%'} step={0.01}/> <br>
        Current Value: {($deviceStatusData.twelveVolt * $twelveCorrectiveFactor).toFixed(2)} <br>
        <h3>G Force Scale</h3>
        <NumberInput bind:value={$gForceScale} formatNumber={(n) => (100 * n).toFixed(0) + '%'} step={0.01}/><br>
        <!--    <button on:click={() => ipcRenderer.send('standby_mode', {})}>Enter Standby Mode</button>-->
        <!--    <br><small><i>Standby mode will charge the batteries when the voltage drops below 3.5 volts per cell and stop when it reaches 3.7 volts per cell.</i></small>-->
        <!--    Current Time: {time.toLocaleString()} <br>-->
        <h3>Theme</h3>
        <LabeledSwitch options="{['Light', 'Dark', 'Adaptive']}" on:change={(e) => $forceMode = e.detail.value}
                       selected="{$forceMode}"/>
        {#if $forceMode === 'Adaptive'}
            <table style="font-style: italic; margin: 5px">
                <tr>
                    <td>Today's Sunrise:</td>
                    <td>{SunCalc.getTimes($currentTime, 39.1532, -77.0669).sunrise.toLocaleTimeString()}</td>
                </tr>
                <tr>
                    <td>Today's Sunset:</td>
                    <td>{SunCalc.getTimes($currentTime, 39.1532, -77.0669).sunset.toLocaleTimeString()}</td>
                </tr>
            </table>
        {/if}
        <h3>Manual Capacity Calibration</h3>
        <button on:click={() => $remainingAH = 1.36 * SOCFromVoltage($BMSData.batteryVoltage/numCells)}>Set Capacity
            Based on Voltage
        </button>
        <br>
        <small>Current {$remainingAH.toFixed(1)}AH.
            Calculated {(1.36 * SOCFromVoltage($BMSData.batteryVoltage / numCells)).toFixed(1)} AH
            from {$BMSData.batteryVoltage.toFixed(2)}V</small>
        <h3>Time Offset</h3>
        <NumberInput bind:value={$timeOffset} formatNumber={(n) => n.toFixed(0) + ' Hours'} step={1}/>
    </div>
</Overlay>

<style>
    div {
        /*letter-spacing: 1px;*/
        padding: 2%;
    }

    h3 {
        font-family: Metropolis, cursive;
        margin: 30px 0 10px 0;
        font-size: 25px;
    }
</style>