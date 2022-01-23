<script>
    import {darkMode} from "./stores";

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
        margin: .78vw;
        border-radius: .39vw;
        padding: .39vw;
        width: 90%;
        transition: background-color 2s ease, box-shadow 2s;
    }
</style>

<div class="container" on:click={increment_pattern} style="
                    background: {$darkMode? '#383838' : '#cccccc'};
                    box-shadow: .39vw .39vw .625vw .156vw {$darkMode? '#2a2a2a' : '#6B6B6B'};">
    <div style="color: {$darkMode? '#c5c5c5' : ''}; font-size: 1.3vw">
        Current LED Pattern:
        <h4
                style="width: 100%; text-align: center; font-weight: bolder; margin: .156vw 0 .156vw 0; font-size: 1.8vw">{patterns[pattern_index]}</h4>
        <i style="font-size: .93vw">Tap to select the next pattern</i></div>
</div>