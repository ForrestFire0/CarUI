<script>
    import Power from "./screens/Power.svelte";

    import {fly} from "svelte/transition";
    import {updateDatas} from "./SvelteComponents/data";
    import StickyInfo from "./SvelteComponents/StickyInfo.svelte";
    import Accessories from "./screens/Accessories.svelte";
    import Battery from "./screens/Battery.svelte";
    import Raw from "./screens/Raw.svelte";
    import {onMount} from "svelte";

    try {
        console.log(`This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`)
    } catch (e) {
        console.log("This app is running with just svelte")
    }
    window.communications.on("data", (event, d) => {
        // console.log("Received data from main process", d);
        updateDatas(d);
    });

    const screens = [Power, Battery, Accessories, Raw];
    // const screens = [Power];

    // Every time the user scrolls, the function will be called.
    // The variable scrolling should be true if we scrolled in the last second.
    let scrolling = false;
    let scrollTimeout = null;

    let selectedPage = screens[0];

    function scroll(e) {
        scrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => scrolling = false, 650);
        selectedPage = screens[Math.round(e.target.scrollTop / (e.target.scrollHeight / screens.length))];
    }

    onMount(() => {
        window.communications.send("ready");
    });
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

{#if scrolling}
    <div class="scrollMenu" transition:fly={{x:200}}>
        <h5>screens</h5>
        {#each screens as s}
            <h2>
                <a href="#{s.name}"
                   style="color: {s === selectedPage ?'var(--font-color)':'var(--font-muted-color)'}; transition: color 0.5s; text-decoration: none;">{s.name}</a>
            </h2>
        {/each}
    </div>
{/if}
<div style="position: fixed; top: 0; left: 50%; transform: translate(-50%, 0); z-index: 5;">
    <StickyInfo/>
</div>
<div class="window" on:scroll={scroll}>
    {#each screens as screen}
        <div style="height: 100vh; width: 100vw; scroll-snap-align: start; position: relative;" id="{screen.name}">
            <svelte:component this={screen}/>
        </div>
    {/each}
</div>