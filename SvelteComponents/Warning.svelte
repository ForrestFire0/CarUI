<script>
    import {fly, fade} from 'svelte/transition';
    import {cubicIn} from "svelte/easing";

    export let text;
    let closed = false;
</script>

<style>
    @keyframes bounce {
        0% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
        100% {
            transform: translateY(0);
        }
    }

    div {
        border: 5px solid grey;
        background: rgb(255 255 255);
        color: black;
        height: 2vh;
        width: 60vw;
        border-radius: 4vh;
        top: 10vh;
        position: absolute;
        right: 20vw;
        z-index: 100;
        box-shadow: 0 0 8px grey;
        padding: 2vh;
        animation: bounce 1s infinite ease-in-out;
        text-align: center;
    }
    span {
        position: absolute;
        right: 2vh;
        top: 1vh;
    }
    span img {
        height: 4vh;
        width: 4vh;
    }
</style>

{#if !closed}
    <div out:fly={{y: -150, duration: 750, easing: cubicIn}} in:fade>
        {text}
        <span on:click={() => closed = true}><img src="./static/close.svg" alt="X"></span>
    </div>
{/if}