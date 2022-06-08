<script>
    import {onMount, setContext} from "svelte";
    import {fade} from "svelte/transition";

    import Overlay from './SvelteComponents/Overlay.svelte';
    import Gauge from './SvelteComponents/Gauge.svelte';
    import TempGauge from './SvelteComponents/TempGauge.svelte';
    import Graph from './SvelteComponents/Graph.svelte';
    import Slider from './SvelteComponents/Slider.svelte';
    import Message from './SvelteComponents/Message.svelte';
    import Console from './SvelteComponents/Console.svelte';
    import LEDSelector from './SvelteComponents/LEDSelector.svelte';
    import Snake from './SvelteComponents/Snake.svelte';
    import Clock from './SvelteComponents/Clock.svelte';

    import {getColor} from "./graphicstwo";
    import {
        darkMode,
        today_sunset,
        today_sunrise,
        forceMode,
        timeOffset,
        twelveCorrectiveFactor
    } from "./SvelteComponents/stores";
    import C4 from "./SvelteComponents/C4.svelte";

    const {ipcRenderer} = require("electron");

    let data, time, lastUpdateDate;
    let voltage = data?.c.reduce((a, b) => a + b);
    $: bS = data?.bS.toString(2).split("").reverse().join("");
    $: setContext('animationDuration', data ? data.i : 1);

    let status = "Waiting for data...";
    let chargeStatus = "Waiting for charging data...";
    let chargeConsoleText = "";
    onMount(() => {
        const interval = setInterval(() => {
            time = new Date(new Date().getTime()+ $timeOffset * 60 * 60 * 1000);
        }, 1000);
        ipcRenderer.send("ready_for_data");
        console.log("1) Sent ready");
        return () => clearInterval(interval);
    });

    let graphData = [[]];
    // let graphData = [[], []];
    // When adding power back: axis settings here. {axis: 350, color: "black", maxPoints: 35x`, units: "kW", minIs0: true,},

    let err, errOverlay;
    ipcRenderer.on('error', (event, _err) => {
        err = _err;
        errOverlay = true;
    })
    let showImage = true;
    ipcRenderer.on("data", (event, _data) => {
        if (_data.s === "normal") {
            if (showImage) {
                showImage = false;
                console.log("2 or 4) Got data");
            }
            voltage = _data.c.reduce((a, b) => a + b);
            if (voltage && _data.hasOwnProperty("pC")) {
                graphData[0].push(voltage);
                // graphData[1].push(Math.abs((_data.pC * voltage) / 1000));
                graphData = graphData;
            }
            messageShown = false;
            _data.f = Math.round(_data.f * 100 / 256);
            data = _data;
            status = `Got last data ${(new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000)).toLocaleTimeString()} (BMS ${(data['lbp']/1000).toFixed(1)} s ago)`;
            //todo add the last time we got data from the BMS.

            const options = ["Waiting for plug", "Plugged in, not charging", "Charging paused, balancing cells", "Charging!", "Waiting For Charger"];
            if (chargeStatus !== options[_data.ch]) {
                chargeStatus = options[_data.ch];
                chargeConsoleText += (new Date(new Date().getTime()+ $timeOffset * 60 * 60 * 1000)).toLocaleTimeString() + " " + chargeStatus + '\n'
            }
            lastUpdateDate = new Date(new Date().getTime()+ $timeOffset * 60 * 60 * 1000);
        } else if (_data.s === "bms_error") {
            console.log("BMS Error: " + _data.error);
        } else if (_data.s === "log") {
            console.log(_data.m);
        }
    });

    ipcRenderer.on("select_port", (event, _data) => {
        showOverlay = true;
        availablePorts = _data;
        console.log("2) Selecting port");
    });
    let messageContent = "";
    let messageShown = false;
    ipcRenderer.on("response", (event, _data) => {
        messageContent = _data;
        messageShown = true;
        console.log("5) Got response.");
    });

    function sendPort(portName) {
        console.log("3) Sending port " + portName);
        ipcRenderer.send("selected_port", portName);
        showOverlay = false;
    }

    let portName = "";
    let availablePorts;
    let showOverlay = false;
    let showSnake = false;
    let showC4 = false;
    let showSunset = false;
    let showSettings = false;
</script>

<Overlay bind:shown={errOverlay}>
    {err}
</Overlay>

<Overlay bind:shown={showOverlay} closable={false}>
    <h1>Error: Unable to find port.</h1>
    <div>Ports found:</div>
    <div>
        {#if availablePorts.length !== 0}
            {#each availablePorts as port}
                <div on:click={() => portName = port}>{port}</div>
            {/each}
        {:else }
            <i>No Ports Found...</i>
        {/if}
    </div>
    <input
            style="padding: 10px; font-size: 20px;"
            type="button"
            value="Add 'COM'"
            on:click={() => (portName = "COM" + portName)}/>
    <input
            style="padding: 10px; font-size: 20px;"
            type="text"
            bind:value={portName}
            id="portsSelect"/>
    <input
            style="padding: 10px; font-size: 20px;"
            type="button"
            value="Submit"
            on:click={() => {
            sendPort(portName);
            showOverlay = false;
        }}/>
    <input
            style="padding: 10px; font-size: 20px;"
            type="button"
            value="Refresh"
            on:click={() => {
                showOverlay = false;
                setTimeout(() => ipcRenderer.send("ready_for_data"), 500)
        }}/>
</Overlay>

<Message
        bind:shown={messageShown}
        onClose={() => ipcRenderer.send("ready_for_data")}
>{@html messageContent}</Message>

<div id="cells" class="{$darkMode ? 'darkIsland' : 'island'}">
    {#if data?.c}
        {#each data.c as cell, index}
            <div
                    class="cell"
                    class:balancing={bS[index] === "1"}
                    style={"background-color: " + getColor(cell, $darkMode)}>
                {cell.toFixed(2)}
            </div>
        {/each}
    {/if}
</div>
<div style="color:black; text-align: center; font-weight: bolder;">
    {#if data?.c}
        <Gauge
                name="Pack Voltage"
                value={voltage}
                bounds={[50, 90]}
                colorBounds={[65, 90]}/>
        <Gauge
                name="Min Cell Voltage"
                value={Math.min(...data.c)}
                bounds={[2.7, 4.2]}
                colorBounds={[3.2, 4.15]}/>
        <Gauge
                name="Avg. Cell Voltage"
                value={voltage / data.c.length}
                bounds={[2.7, 4.2]}
                colorBounds={[3.2, 4.15]}/>
        <Gauge
                name="Max Cell Voltage"
                value={Math.max(...data.c)}
                bounds={[2.7, 4.2]}
                colorBounds={[3.2, 4.15]}/>
    {/if}
</div>

<div style="position: relative; text-align: center;">
    <div class="{$darkMode ? 'darkIsland' : 'island'}">
        <Clock/>
        <!-- Logo -->
        <img src="./static/export.png" width="100%" alt="car logo"
             style="transition: 3s ease; opacity: {$darkMode ? '75%' : ''}"/>
    </div>
    <!-- Status -->
    <div class="{$darkMode ? 'darkIsland' : 'island'}">
        <div
                style="background-color: {time - lastUpdateDate > new Date(3000) ? 'red' : ''};"
                class="statusBox">
            {status}
        </div>
        <div class="statusBox">{chargeStatus}</div>
    </div>

    <Graph
            axisSettings={[
                {
                    axis: 0,
                    color: $darkMode ? '#33f8ff' : '#125256',
                    maxPoints: 35,
                    units: "V",
                    minIs0: false,
                },
            ]}
            datas={graphData}/>
</div>

<div>
    {#if data}
        <div class="{$darkMode ? 'darkIsland' : 'island'}">
            <TempGauge data={data.t}/>
            <div style="display: flex;">
                <div style="width:50%; font-weight: bolder; text-align: center;">
                    <Gauge
                            name="Amps"
                            value={data["pC"]}
                            bounds={[-50, 500]}/>
                </div>
                <div style="width:50%; font-weight: bolder; text-align: center;">
                    <Gauge
                            name="Power (kW)"
                            value={Math.abs((data["pC"] * voltage) / 1000)}
                            bounds={[0, 40]}/>
                </div>
            </div>
        </div>
        <Console text={chargeConsoleText}/>
        <div style="display: flex;">
            <div style="width:33.3%; font-weight: bolder; text-align: center;">
                <Gauge
                        name="12V Voltage"
                        value={data["tw"] * $twelveCorrectiveFactor}
                        bounds={[10, 15]}/>
            </div>
        </div>
        {#if data["CR"]}
            <div transition:fade={{duration: 3000}} class="{$darkMode ? 'darkIsland' : 'island'}">
                <div style="font-size: 20px; text-decoration: underline; margin-bottom: -5px; font-weight: bolder; padding: 3px; color: {$darkMode ? 'rgb(197, 197, 197)' : ''}">
                    Charger
                </div>
                <div style="display: flex;">
                    <div style="width:33.3%; font-weight: bolder; text-align: center;">
                        <Gauge
                                name="AC Voltage"
                                value={data["CIV"]}
                                bounds={[120, 320]}
                                colorBounds={[0, 500]}
                        />
                    </div>
                    <div style="width:33.3%; font-weight: bolder; text-align: center;">
                        <Gauge
                                name="Temperature"
                                value={data["CT"]}
                                bounds={[10, 50]}
                                colorBounds={[45, 21]}
                        />
                    </div>
                    <div style="width:33.3%; font-weight: bolder; text-align: center;">
                        <Gauge
                                name="Current"
                                value={data["CC"]}
                                bounds={[0, 40]}
                                colorBounds={[0, 20]}/>
                    </div>
                </div>
                ({(data["lcp"] / 1000).toFixed(1)}s)
            </div>
        {/if}
    {/if}
</div>

<div class="{$darkMode ? 'darkIsland' : 'island'}">
    {#if data}
        <Slider value={data.f} color="#4fc3f7" iconPath="static/fan.svg"/>
    {/if}
</div>

<style>
    .but {
        border: 1px grey solid;
        margin: 2.5%;
        width: 18%;
        padding: .2vw;
        background: #cccccc;
        border-radius: 3px;
        box-shadow: 2px 2px 3px 2px #6B6B6B;
        height: min-content;
        transition: background-color 3s ease, box-shadow 3s;
    }

    .dark {
        box-shadow: 5px 5px 4px 2px #2a2a2a;
        background: #969696;
        border: solid 1px #2c2c2c;
    }
</style>

<div>
    <LEDSelector/>
    <div class="{$darkMode ? 'darkIsland' : 'island'}">
        <button on:click={() => showSnake = true} class="but" class:dark={$darkMode}><img
                src="./static/snake.svg" alt="snake"></button>
        <button on:click={() => showC4 = true} class="but" class:dark={$darkMode}><img src="./static/c4.svg" alt="c4">
        </button>
        <button on:click={() => showSunset = true} class="but" class:dark={$darkMode}><img src="./static/sunset.svg"
                                                                                           alt="sunset"></button>
        <button on:click={() => showSettings = true} class="but" class:dark={$darkMode}><img
                src="./static/details.svg" alt="details"></button>
    </div>
</div>

<Overlay bind:shown={showSnake} closable="{false} ">
    <Snake on:closeOverlay={() => showSnake = false}/>
</Overlay>

<Overlay bind:shown={showC4} closable="{false}">
    <C4 on:closeOverlay={() => showC4 = false}/>
</Overlay>

<Overlay bind:shown={showSunset}>
    Current Time: {time.toLocaleString()} <br>
    Today's Sunrise: {today_sunrise.toLocaleString()} <br>
    Today's Sunset: {today_sunset.toLocaleString()} <br>
    <button on:click={() => forceMode.set('Light')}>Light Mode</button>
    <button on:click={() => forceMode.set('Dark')}>Dark Mode</button>
    <button on:click={() => forceMode.set('Adaptive')}>Adaptive</button>
    <br> Current Mode: {$forceMode}
    Time Offset: {$timeOffset} Hours
    <input type="button" on:click={() => timeOffset.update(e => e + 1)} value="+">
    <input type="button" on:click={() => timeOffset.update(e => e - 1)} value="-">
</Overlay>

<Overlay bind:shown={showSettings}>
    Corrective Factor for 12V Sensor: <input type="number" bind:value={$twelveCorrectiveFactor}> <br>
    Current Value: {(data["tw"] * $twelveCorrectiveFactor).toFixed(2)}
</Overlay>

{#if showImage}
    <div id="photo" transition:fade={{ duration: (data?.fake ? 500 : 3000) }} style="z-index: 5">
        <img height="100%" src="static/logo.png" alt="img"/>
    </div>
{/if}