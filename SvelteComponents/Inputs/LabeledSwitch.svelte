<script>
    import {createEventDispatcher, onMount} from "svelte";

    export let options = []
    export let selected = options[0];

    const dispatch = createEventDispatcher();

    let width = 0, x = 0;
    let parent = null;
    onMount(() => {
        setTimeout(() => {
            const selectedOption = parent.children[1 + options.indexOf(selected)];
            width = selectedOption.clientWidth;
            x = selectedOption.getBoundingClientRect().x - parent.getBoundingClientRect().x;
        }, 200)
    })
</script>

<label class="parent" bind:this={parent}>
    <span class="slideHighlight" style="width: {width}px; left: {x}px"></span>
    {#each options as option}
        <button on:click={(e) => {selected = option;
            width = e.srcElement.clientWidth;
            x = e.target.getBoundingClientRect().x - e.target.parentElement.getBoundingClientRect().x;
            dispatch('change', {value: selected, index: options.indexOf(selected)})}}
                class:selected={selected===option}>{option}</button>
    {/each}
</label>


<style>
    .parent {
        position: relative;
        display: inline-flex;
        height: 50px;
        border-radius: 50px;
        /*padding: 0 4px 0 4px;*/
        cursor: pointer;
        background-color: #b2b2b2;
        box-shadow: inset 0 0 0 1px #9e9e9e, 0 1px 1px 0 rgba(0, 0, 0, 0.2);
    }

    button {
        background-color: transparent;
        border: none;
        position: relative;
        text-transform: uppercase;
        font-weight: bolder;
        margin: 0;
        padding: 0 18px 0 18px;
        min-width: 30px;
        font-size: 125%;
        letter-spacing: 2px;
        font-family: 'Metropolis', monospace;
        color: var(--font-color);
        opacity: 0.75;
        transition: opacity 0.2s ease-in-out;
    }


    button.selected {
        opacity: 1;
    }

    button:focus, button:active {
        outline: none;
    }

    .slideHighlight {
        position: absolute;
        content: "";
        height: 100%;
        /*bottom: 7.5%;*/
        background-color: #e0e0e0;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 34px;
        box-shadow: #2a2a2a 0 0 5px;
    }

    :global([data-theme="dark"]) button {
        color: white;
    }

    :global([data-theme="dark"]) .parent {
        background-color: #424242;
        box-shadow: none;
    }
</style>
