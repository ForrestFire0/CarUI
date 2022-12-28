<script>
    import {fly} from 'svelte/transition'

    export let src;
    export let disabled = false;
    export let width = '40px';
</script>

<style>
    button {
        vertical-align: top;
        font-size: initial;
        transition: border-radius 0.2s ease-in-out;
        box-shadow: 5px 5px 5px 0, inset 0 -0.6em 1em -0.35em rgba(0, 0, 0, 0.11), inset 0 0.6em 2em -0.3em rgba(255, 255, 255, 0.15), inset 0 0 0 0.05em rgba(255, 255, 255, 0.12);
        border: 1px solid grey;
        border-radius: 6px;
        margin: 0 8px 5px 0;
    }
    :global([data-theme="dark"]) button {
        background-color: #424242;
    }

    /*When a button is hover, round corners by 15px*/
    button:hover {
        border-radius: 15px;
    }

    img {
        height: 100%;
        width: 100%;
    }
</style>
{#if src === undefined}
    <button on:click disabled={disabled} style="width: {width}; border-radius: calc({width}/4); ">
        <slot/>
    </button>
{:else}
    <button on:click disabled={disabled} style="padding: 0; width: {width}; border-radius: calc({width}/4);">
        <img src="{src}" alt="{src}">
    </button>
{/if}
