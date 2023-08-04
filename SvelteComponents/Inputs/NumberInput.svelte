<script>

    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();
    export let value = 0;
    export let step = 1;
    export let formatNumber = (number) => number;
    export let bounds = [-Infinity, Infinity]

    // when plus is held for more than 500ms, the value will increase by step every 100ms
    let interval = null;
    let timeout = null;
    let start = 0;

    function increase(e) {
        if (e.touches) e.preventDefault();
        set(value + step);
        timeout = setTimeout(() => {
            start = Date.now();
            interval = setInterval(() => {
                set(value + step * (Math.floor((Date.now() - start) / 1000) + 1));
            }, 100);
        }, 500);
    }

    function decrease(e) {
        if (e.touches) e.preventDefault();
        set(value - step);
        start = Date.now();
        timeout = setTimeout(() => {
            interval = setInterval(() => {
                if (bounds)
                    set(value - step * (Math.floor((Date.now() - start) / 1000) + 1));
            }, 100);
        }, 500);
    }

    function stop() {
        clearTimeout(timeout);
        clearInterval(interval);
        timeout = null;
    }

    function set(v) {
        if (bounds)
            value = Math.clamp(v, ...bounds);
        else
            value = v;
        // noinspection JSCheckFunctionSignatures
        dispatch("change", value);
    }
</script>

<style>

    div {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background-color: #b7b7b7;
        border-radius: 5px;
        height: 60px;
        margin-bottom: 10px;
    }

    div span {
        font-size: 40px;
        font-family: Metropolis, serif;
        padding: 20px;
        font-weight: bolder;
        user-select: none;
    }

    .value {
        font-size: 20px;
        color: #525252;
        font-weight: bold;
        width: 90px;
        text-align: center;
    }

    :global([data-theme="dark"]) .value {
        color: white;
    }

    :global([data-theme="dark"]) div {
        background-color: #424242;
        border-radius: 10px;
    }
</style>

<div>
    <span on:mousedown={decrease} on:mouseup={stop} on:mouseleave={stop}
          on:touchstart={decrease} on:touchend={stop} on:touchcancel={stop}>-</span>
    <span class="value">{formatNumber(value)}</span>
    <span on:mousedown={increase} on:mouseup={stop} on:mouseleave={stop}
          on:touchstart={increase} on:touchend={stop} on:touchcancel={stop}
          class="➕">+</span>
</div>