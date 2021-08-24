<script>
    import { fade } from "svelte/transition";
    
    export let shown = false;
    export let onClose = () => {};
</script>

{#if shown}
    <div class="container" out:fade={{ duration: 3000 }}><slot />
        <br>
    <button on:click={() => {onClose(); shown = false;}}>Select another port...</button>
    </div>
{/if}

<style>
    .container {
        z-index: 2;
        box-shadow: 0 0 40px 40px white;
        position: fixed;
        top: 0;
        left: 33%;
        width: 33%;
        margin-top: 20%;
        padding: 5%;
        margin: auto;
        background-color: white;
    }
</style>
