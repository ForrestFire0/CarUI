<script>
    import {chargerData, remainingAH} from "./data";

    let percent;
    $: percent = $remainingAH / 1.36;

    // setInterval(() => {
    //     percent = Math.random() * 100;
    // }, 1000);
</script>

<style>
    :global(:root) {
        --gradient-color-red: linear-gradient(90deg, hsl(7, 89%, 46%) 15%, hsl(11, 93%, 68%) 100%);
        --gradient-color-orange: linear-gradient(90deg, hsl(22, 89%, 46%) 15%, hsl(54, 90%, 45%) 100%);
        --gradient-color-yellow: linear-gradient(90deg, hsl(54, 89%, 46%) 15%, hsl(92, 90%, 45%) 100%);
        --gradient-color-green: linear-gradient(90deg, hsl(92, 89%, 46%) 15%, hsl(92, 90%, 68%) 100%);
    }


    .pill {
        position: relative;
        width: 75px;
        height: 180px;
        background-color: var(--gradient-color-red);
        box-shadow: inset 20px 0 48px hsl(0, 0%, 69%);
        /*inset -4px 12px 48px hsl(0, 0%, 56%);*/
        border-radius: 38px;
        justify-self: flex-end;
    }

    :global([data-theme="dark"]) .pill {
        box-shadow: inset 20px 0 48px hsl(0, 0%, 16%),
        inset -4px 12px 48px hsl(0, 0%, 56%);
    }

    .level {
        position: absolute;
        inset: 2px;
        border-radius: 38px;
        overflow: hidden;
    }

    .liquid {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 36px;
        background: var(--gradient-color-red);
        box-shadow: inset -10px 0 12px hsla(0, 0%, 0%, .1), inset 12px 0 12px hsla(0, 0%, 0%, .15);
        transition: .3s;
        overflow: hidden;
    }

    .liquid::after {
        content: '';
        position: absolute;
        height: 14px;
        background: var(--gradient-color-red);
        box-shadow: inset 0 -3px 6px hsla(0, 0%, 0%, .2);
        left: 0;
        right: 0;
        margin: 0 auto;
        top: -4px;
        border-radius: 50%;
    }

    .gradient-color-red, .gradient-color-red::after {
        background: var(--gradient-color-red);
    }

    .gradient-color-orange, .gradient-color-orange::after {
        background: var(--gradient-color-orange);
    }

    .gradient-color-yellow, .gradient-color-yellow::after {
        background: var(--gradient-color-yellow);
    }

    .gradient-color-green, .gradient-color-green::after {
        background: var(--gradient-color-green);
    }

    .shine {
        content: '';
        top: 0;
        position: absolute;
        transform: translateX(100%);
        width: 220px;
        height: 100%;
        z-index: 1;
        animation: slide 1s infinite;
        background: linear-gradient(to top,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.34) 30%,
        rgba(255, 255, 255, 0.34) 30%,
        rgba(128, 186, 232, 0) 99%,
        rgba(125, 185, 232, 0) 100%);
        border-radius: 0;
    }

    @keyframes slide {
        0% {
            transform: translateY(100%);
        }
        100% {
            transform: translateY(-100%);
        }
    }
</style>

<div class="card" style="display: grid; grid-template-columns: 100px 100px; align-items: center;">
    <div class="battery_text">Battery
        <div style="font-size: 2.5rem; padding-top: 5px">
            {percent.toFixed(0)}%
        </div>
    </div>
    <div class="pill">
        <div class="level">
            <div class="liquid" style="height: {percent > 99.9 ? percent + 3 : percent}%"
                 class:gradient-color-red={percent <= 20}
                 class:gradient-color-orange={percent > 20 && percent <= 40}
                 class:gradient-color-yellow={percent <= 80 && percent > 40}
                 class:gradient-color-green={percent > 80}>
                {#if $chargerData.running}
                    <div class="shine"></div>
                {/if}
            </div>
        </div>
    </div>
</div>