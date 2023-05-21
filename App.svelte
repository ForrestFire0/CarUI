<script>
    import Power from "./screens/Power.svelte";

    import {fly, fade} from "svelte/transition";
    import {updateDatas} from "./SvelteComponents/data";
    import StickyInfo from "./SvelteComponents/StickyInfo.svelte";
    import Accessories from "./screens/Accessories.svelte";
    import Battery from "./screens/Battery.svelte";
    import Raw from "./screens/Raw.svelte";
    import {onMount} from "svelte";
    import {active, currentTime, timeOffset} from "./SvelteComponents/stores";
    import {write} from "./SvelteComponents/Console.svelte"
    import {cubicInOut, cubicOut, linear} from "svelte/easing";

    if (window.versions) {
        console.log(`This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`)
        window.communications.on("data", (event, d) => {
            // console.log("Received data from main process", d);
            updateDatas(d, $timeOffset);
        });
        window.communications.on("console", (event, d) => {
            write(d);
        });
    } else {
        console.log("This app is running with just svelte")
        const updateFront = () => updateDatas({
            "id": "front",
            "s": "ok",
            "inverter": false,
            "ignition": true,
            "reverse": false,
            "voltage": 78,
            "motorCurrent": 500,
            "power": 7.8,
            "batteryCurrent": 100,
            "accelerometer": {"x": 0.1, "y": 0.2},
            "speed": 30
        }, $timeOffset);
        const updateBack = () => updateDatas({
            "s": "normal",
            "t": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
            "pC": 10,
            "bS": 0,
            "c": [3.7, 3.8, 3.9, 3.7, 3.8, 3.9, 3.7, 3.8, 3.9, 3.7, 3.8, 3.9, 3.7, 3.8, 3.9, 3.7, 3.8, 3.9, 3.7, 3.8, 3.9],
            "bt": [20, 20, 20, 20],
            "f": 130,
            "h": 5,
            "ch": 1,
            "i": 1,
            "CC": 17.25,
            "CIV": 250,
            "COV": 70.37,
            "CT": 21,
            "CR": true,
            "lcp": 500,
            "lbp": 700,
            "tw": 13.56
        }, $timeOffset);
        setInterval(updateFront, 1000);
        setInterval(updateBack, 2500);
        updateFront();
        updateBack();
    }

    const screens = [Power, Battery, Accessories, Raw];
    // const screens = [Raw];

    // Every time the user scrolls, the function will be called.
    // The variable scrolling should be true if we scrolled in the last second.
    let scrolling = false;

    let selectedPage = screens[0];
    let hideTime = 0;

    currentTime.subscribe((time) => {
        if (time - hideTime > 200) {
            scrolling = false;
        }
    });

    function scroll(e) {
        if (!scrolling)
            scrolling = true;
        hideTime = Date.now();
        const newSelectedPage = screens[Math.round(e.target.scrollTop / (e.target.scrollHeight / screens.length))]
        if (newSelectedPage !== selectedPage) {
            selectedPage = newSelectedPage;
        }
    }

    onMount(() => {
        if (window.versions)
            window.communications.send("ready");
    });

    function flyAndScale(node, {delay = 0, duration = 400, y, scale, easing}) {
        return {
            delay,
            duration,
            easing,
            css: (t) => `transform: translate3d(0, ${y * (1 - t)}px, 0) scale(${scale + (1 - scale) * t});`
        };
    }
</script>

<style>
    .window {
        margin: 0;
        padding: 0;
        height: 100vh;
        overflow-y: scroll;
        scroll-snap-type: y mandatory;
        scroll-snap-stop: always;
        scroll-behavior: smooth;
        overflow-x: hidden;
    }

    .window::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
    }

    .scrollMenu {
        padding: 2vw;
        position: absolute;
        top: 50%;
        right: 10px;
        margin-top: -150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background-color: var(--bg-color);
        color: var(--font-color);
        border-radius: 10px;
        border: 1px solid var(--font-muted-color);
        z-index: 100;
    }

    h2, h5 {
        display: flex;
        justify-content: right;
        margin: 7px;
    }

    h5 {
        text-transform: uppercase;
        font-weight: bold;
        border-bottom: grey 1px solid;
    }

    :global(body) {
        font-family: comfortaa, serif;
        overflow-x: hidden;
        background-color: var(--bg-color);
        color: var(--font-color);
        padding: 0;
        margin: 0;
    }
</style>

{#if !$active}
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--bg-color);
        z-index: 1000; display: flex; justify-content: center; align-items: center; flex-direction: column;"
         on:click={() => {active.set(true)}}
         in:fade={{duration: 500}} out:fade={{duration: 500, delay: 1500}}>
        <h1 style="font-size: 5vw; text-align: center;" transition:flyAndScale={{y: -322, duration: 2000, easing: cubicInOut, scale: 3/5}}>
            <StickyInfo/>
        </h1>
        <br>
        <i style="font-size: initial">Tap to continue...</i>
    </div>
{/if}

{#if scrolling}
    <div class="scrollMenu" transition:fly={{x:200}}>
        <h5>screens</h5>
        {#each screens as s}
            <h2>
                <a style="color: {s === selectedPage ?'var(--font-color)':'var(--font-muted-color)'}; transition: color 0.5s; text-decoration: none;">{s.name}</a>
            </h2>
        {/each}
    </div>
{/if}
<div style="position: fixed; top: 0; left: 50%; transform: translate(-50%, 0); z-index: 5; font-size: 3vw"
     on:click={() => active.set(false)}>
    <StickyInfo/>
</div>
<div class="window" on:scroll={scroll}>
    {#each screens as screen}
        <div style="height: 100vh; width: 100vw; scroll-snap-align: start; position: relative;" id="{screen.name}">
            <svelte:component this={screen}/>
        </div>
    {/each}
</div>