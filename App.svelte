<script>
    import { onMount, setContext } from "svelte";
    import { fade } from "svelte/transition";

    import Overlay from "./SvelteComponents/Overlay.svelte";
    import Gauge from "./SvelteComponents/Gauge.svelte";
    import TempGauge from "./SvelteComponents/TempGauge.svelte";
    import Graph from "./SvelteComponents/Graph.svelte";
    import Slider from "./SvelteComponents/Slider.svelte";

    import { getColor } from "./graphicstwo";
    import Message from "./SvelteComponents/Message.svelte";
import Console from "./SvelteComponents/Console.svelte";

    const { ipcRenderer } = require("electron");

    // Basically we need to wait for the script to load.

    let data;
    $: voltage = data?.c.reduce((a, b) => a + b);
    $: bS = data?.bS.toString(2).split("").reverse().join("");
    $: setContext("animationDuration", data ? data.i : 1);

    let status = "Waiting for data...";
    let chgstatus = "Waiting for charging data...";
    let chargeConsoleText = "";
    let time = new Date();
    let lastUpdateDate;
    onMount(() => {
        const interval = setInterval(() => {
            time = new Date();
        }, 1000);
        ipcRenderer.send("ready_for_data");
        console.log("1) Sent ready");
        return () => {
            clearInterval(interval);
        };
    });

    let graphData = [[], []];

    let fake_data = typeof require === "undefined";
    console.log(fake_data ? "Faking data.." : "Not faking data.");
    let showImage = true;
    ipcRenderer.on("data", (event, _data) => {
        if (_data.s === "normal") {
            if (showImage) {
                showImage = false;
                console.log("2/4) Got data");
            }
            if (voltage && _data["pC"]) {
                graphData[0].push(voltage);
                graphData[1].push(Math.abs((_data.pC * voltage) / 1000));
                graphData = graphData;
            }
            messageShown = false;
            _data.fan = Math.round(_data.fan * 100 /256);
            data = _data;
            status = "Got last data " + new Date().toLocaleTimeString();


            const options = ["Waiting for plug", "Plugged in, not charging", "Charging paused, balancing cells", "Charging!", "Waiting For Charger"];
            if(chgstatus !== options[_data.ch]) {
                chgstatus = options[_data.ch];
                chargeConsoleText += new Date().toLocaleTimeString() + " " + chgstatus + '\n'
            }
            lastUpdateDate = new Date();
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
</script>

{#if showImage}
    <div id="photo" transition:fade={{ duration: 3000 }}>
        <img height="100%" src="static/logo.png" alt="img" />
    </div>
{/if}

<Overlay bind:shown={showOverlay}>
    <h1>Error: Unable to find port.</h1>
    <div>Ports found:</div>
    <div id="ports">{availablePorts}</div>
    <input
        style="padding: 10px; font-size: 20px;"
        type="button"
        value="Add 'COM'"
        on:click={() => (portName = "COM" + portName)} />
    <input
        style="padding: 10px; font-size: 20px;"
        type="text"
        bind:value={portName}
        id="portsSelect" />
    <input
        style="padding: 10px; font-size: 20px;"
        type="button"
        value="Submit"
        on:click={() => {
            sendPort(portName);
            showOverlay = false;
        }} />
</Overlay>

<Message
    bind:shown={messageShown}
    onClose={() => ipcRenderer.send("ready_for_data")}
    >{@html messageContent}</Message>

<div id="cells">
    {#if data?.c}
        {#each data.c as cell, index}
            <div
                class="cell"
                class:balancing={bS[index] === "1"}
                style={"background-color: " + getColor(cell)}>
                {cell}
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
            colorBounds={[65, 90]} />
        <Gauge
            name="Min Cell Voltage"
            value={Math.min(...data.c)}
            bounds={[2.7, 4.2]}
            colorBounds={[3.2, 4.15]} />
        <Gauge
            name="Avg. Cell Voltage"
            value={voltage / data.c.length}
            bounds={[2.7, 4.2]}
            colorBounds={[3.2, 4.15]} />
        <Gauge
            name="Max Cell Voltage"
            value={Math.max(...data.c)}
            bounds={[2.7, 4.2]}
            colorBounds={[3.2, 4.15]} />
    {/if}
</div>

<div style="position: relative; text-align: center;">
    <!-- Clock -->
    <div
        style="text-align: center; font-size: 3vw; margin-top: 20px; font-weight: bolder;">
        {time.toLocaleTimeString()}
    </div>
    <!-- Logo -->
    <img
        src="./static/export.png"
        width="85%"
        style="margin-left: -50px;"
        alt="car logo dumbass" />
    <!-- Status -->
    <div
        style="background-color: lightgrey; padding: 10px; border-radius: 20px;">
        <div
            class="statusBox"
            class:old={time - lastUpdateDate > new Date(3000)}>
            {status}
        </div>
        <div class="statusBox">{chgstatus}</div>
    </div>
    <Graph
        axisSettings={[
            {
                axis: 0,
                color: "#FF5733",
                maxPoints: 35,
                units: "V",
                minIs0: false,
            },
            {
                axis: 350,
                color: "black",
                maxPoints: 35,
                units: "kW",
                minIs0: true,
            },
        ]}
        datas={graphData} />
</div>

<div>
    {#if data}
        <TempGauge data={data.t} />
        <div style="display: flex;">
            <div style="width:50%; font-weight: bolder; text-align: center;">
                <Gauge
                    name="Current (Amps)"
                    value={data.pC}
                    bounds={[-50, 500]} />
            </div>
            <div style="width:50%; font-weight: bolder; text-align: center;">
                <Gauge
                    name="Power (kW)"
                    value={Math.abs((data.pC * voltage) / 1000)}
                    bounds={[0, 40]} />
            </div>
        </div>
        <Console text={chargeConsoleText}/>
    {/if}
</div>

<div>
    {#if data}
        <Slider value={data.f} color="#4fc3f7" iconPath="static/fan.svg" />
    {/if}
</div>
