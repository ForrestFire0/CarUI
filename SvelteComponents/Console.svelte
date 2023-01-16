<script context="module">
    import {writable} from "svelte/store";
    import {currentTime} from "./stores";

    let content = writable('');
    let ct;
    currentTime.subscribe(value => ct = value);

    export function write(msg) {
        // Add the day of the week + the time to the message
        content.update(c => {
            c = c + `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][ct.getDay()]} ${ct.toLocaleTimeString()} ${msg}<br>`
            if (c.length > 10000) {
                c = c.slice(c.length - 10000);
            }
            return c;
        })
    }
</script>

<script>
    let textarea;
    let autoscroll = true;
    $: if ($content && textarea && autoscroll) {
        textarea.scrollTop = textarea.scrollHeight;
    }
</script>

<div bind:this={textarea} on:touchstart={() => {autoscroll = false}}>{@html $content}</div>
{#if !autoscroll}
    <button on:click={() => autoscroll = true}>Autoscroll</button>
{/if}

<style>
    div {
        overflow-y: scroll;
        height: 20%;
        width: 50%;
        padding: 1.1vw;
        font-size: 1.1vw;
    }
</style>
