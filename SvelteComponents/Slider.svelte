<script>
    export let value;
    export let color;
    export let iconPath;
</script>

<div class="outline">
    <div class="data" style="height: {value}%; background-color: {color};" />
    {value.toFixed(0)}%
</div>

{#if iconPath}
    <img
        src={iconPath}
        alt="yo mama lol"
        style="width: 100%; animation-play-state: {value == 0
            ? 'paused'
            : 'running'}" />
{/if}

<style>
    .outline {
        height: 16vw;
        width: 90%;
        border: 1px solid black;
        border-radius: 1vw;
        position: relative;
        margin: 5%;
        color: black;
        font-size: 1.5vw;
        text-align: center;
        font-weight: bolder;
    }
    .data {
        width: 100%;
        border-radius: 1vw;
        position: absolute;
        bottom: 0;
        transition: 2s ease;
        z-index: -1;
    }
    @keyframes spin {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
    img {
        animation: spin 2s infinite linear;
    }
</style>
