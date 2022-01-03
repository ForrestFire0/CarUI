<script>
    const {ipcRenderer} = require("electron");

    let patterns = ['Voltage Mode', 'Hue Rotation', 'Crazy Colors', 'Solid']
    let pattern_index = 0;

    function increment_pattern() {
        pattern_index = pattern_index + 1;
        if (pattern_index === patterns.length) pattern_index = 0;
        ipcRenderer.send('led_select', pattern_index);
    }
</script>

<style>
    .container {
        box-shadow: 5px 5px 8px 2px #6B6B6B;
        margin: 10px;
        background-color: grey;
        border-radius: 5px;
        padding: 5px;
        width: 90%;
    }
</style>

<div class="container" on:click={increment_pattern}>
    Current LED Pattern:
    <h4 style="width: 100%; text-align: center; font-weight: bolder; margin: 2px 0 2px 0">{patterns[pattern_index]}</h4>
    <i style="font-size: 12px">Tap to select the next pattern</i>
</div>