<script>
    /* Accessories will include:
       - Accessories
       - Power Use
       - Battery Total Voltage and status
     */
    import LabeledSwitch from "../SvelteComponents/Inputs/LabeledSwitch.svelte";
    import {deviceStatusData, inverterData} from "../SvelteComponents/data";
    import Overlay from "../SvelteComponents/Overlay.svelte";
    import Snake from "../SvelteComponents/Games/Snake.svelte";
    import C4 from "../SvelteComponents/Games/C4.svelte";
    import {currentTime, forceMode, gForceScale, timeOffset, twelveCorrectiveFactor} from "../SvelteComponents/stores";
    import ImageButton from "../SvelteComponents/Inputs/ImageButton.svelte";
    import SunCalc from '../public/libs/suncalc';

    let showSnake = false, showC4 = false, showSettings = false;

</script>

<div>
    <h1>Accessories</h1>
    <h3>Inverter</h3>
    <LabeledSwitch options="{['On', 'Off']}" on:change={(e) => window.communications.send('inverter', !Boolean(e.detail.index))}/>
    <h3>Battery Illumination</h3>
    <LabeledSwitch options="{['Voltage Mode', 'Hue Rotation', 'Crazy Colors', 'Solid']}"
                   on:change={(e) => window.communications.send('led_select', e.detail.index)}/>
    <h3>Apps</h3>
    <ImageButton src="./static/snake.svg" on:click={() => showSnake = true} width="7vw"/>
    <ImageButton src="./static/c4.svg" on:click={() => showC4 = true} width="7vw"/>
    <ImageButton src="./static/gear.svg" on:click={() => showSettings = true} width="7vw"/>
</div>

<Overlay bind:shown={showSnake} closable="{false} ">
    <Snake on:closeOverlay={() => showSnake = false}/>
</Overlay>

<Overlay bind:shown={showC4} closable="{false}">
    <C4 on:closeOverlay={() => showC4 = false}/>
</Overlay>

<Overlay bind:shown={showSettings}>
    <h1>Settings</h1>
    Corrective Factor for 12V Sensor: <input type="number" bind:value={$twelveCorrectiveFactor} step="0.01"> <br>
    Current Value: {($deviceStatusData.twelveVolt * $twelveCorrectiveFactor).toFixed(2)} <br>

    G Force Scale <input type="number" bind:value={$gForceScale} step="0.01"><br>
    <!--    <button on:click={() => ipcRenderer.send('standby_mode', {})}>Enter Standby Mode</button>-->
    <!--    <br><small><i>Standby mode will charge the batteries when the voltage drops below 3.5 volts per cell and stop when it reaches 3.7 volts per cell.</i></small>-->
    <!--    Current Time: {time.toLocaleString()} <br>-->
    <h3>Theme</h3>
    <LabeledSwitch options="{['Light', 'Dark', 'Adaptive']}" on:change={(e) => $forceMode = e.detail.value} selected="{$forceMode}"/>
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
    <h3>Time Offset</h3>
    Current Time Offset: {$timeOffset} Hours <br>
    <input type="button" on:click={() => timeOffset.update(e => e + 1)} value="+">
    <input type="button" on:click={() => timeOffset.update(e => e - 1)} value="-">
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