<script>
    import {onMount} from "svelte";
    import {darkMode, timeOffset} from "./stores";

    let time = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000);
    onMount(() => {
        const interval = setInterval(() => {
            time = new Date(new Date().getTime() + $timeOffset * 60 * 60 * 1000);
        }, 330);
        return () => {
            clearInterval(interval);
        };
    });
</script>

<div style="text-align: center; font-size: 3vw; margin-top: 1.2vw; font-weight: bolder; color: {$darkMode ? '#c5c5c5' : ''};">
    {time.toLocaleTimeString()}
</div>