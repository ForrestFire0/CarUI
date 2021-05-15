<script>
    export let shown = false;
    export let closable = true;
    export let width = 50;

    function handleKeydown(e) {
        if (closable && e.keyCode === 27) shown = false;
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if shown}
    <div
        class="overlay"
        class:closable
        on:click={() => {
            if (closable) shown = false;
        }}>
        <div
            class="container"
            style={"width: " + width + "%"}
            on:click|stopPropagation>
            <slot />
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed; /* Sit on top of the page content */
        width: 100%; /* Full width (cover the whole page) */
        height: 100%; /* Full height (cover the whole page) */
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
    }
    .closable {
        cursor: pointer;
    }

    .container {
        margin-top: 20%;
        padding: 5%;
        margin: auto;
        background-color: white;
        cursor: default;
    }
</style>
