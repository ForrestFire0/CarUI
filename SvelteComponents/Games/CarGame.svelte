<script>
    import {spring} from "svelte/motion";

    Math.range = (start, end, step) => {
        const reverse = start > end;
        if (reverse) {
            [start, end] = [end, start];
        }
        let arr = [];
        for (let i = start; i <= end; i += step) {
            arr.push(i);
        }
        return reverse ? arr.reverse() : arr;
    }

    //  A car game where you can switch lanes to avoid cars.
    // Written in Svelte!

    const numLanes = 3;
    const gameWidth = 600, gameHeight = 1000;
    const playerLane = spring(1, {stiffness: 0.1, damping: 0.5})
    let playerY = 300;
    let playerSpeed = 0;
    let throttle = 0;
    let p = 0,i = 0,d = 0;
    let kp = 0.03, ki = 0.0001, kd = 0.2;
    let acc = 0;

    let followDistance = 20;

    let camera = playerY - 300;

    let otherPlayers = [];
    let startTime = Date.now();
    otherPlayers.push({lane: 1, y: 800, speed: () => 70 + Math.cos(Date.now() / 4000) * 20});
    otherPlayers.push({lane: 0, y: 800, speed: () => 30 + Math.cos(Date.now() / 2000) * 30});
    otherPlayers.push({lane: 2, y: 500, speed: () => 70 - 60 * (Date.now() > startTime + 10000)});

    let closestPlayer;
    $: closestPlayer = otherPlayers.filter(p => p.lane === Math.round($playerLane) && p.y > playerY).sort((a, b) => a.y - b.y)[0];

    // console.log(Math.range(0, 1000, 200));
    const frame = () => {
        for (let player of otherPlayers) {
            let speed = player.speed();
            console.log(speed);
            player.y += speed/30;
        }
        otherPlayers = otherPlayers;

        // console.log(0.1 * 50 - playerY - camera);
        // camera = camera + (0.01 * (-300 - playerY - camera));
        camera = playerY - 300
        throttle = calculateThrottle()
        const power = 300;
        const acceleration = Math.min(power / Math.abs(playerSpeed), 10);
        acc = acc * 0.99 + 0.01 * throttle * acceleration
        playerSpeed = playerSpeed + acc / 30;
        playerY = playerY + playerSpeed / 30;

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);


    let distance = 0, lastError = 0, lastTime = 0; let I = 0;
    function calculateThrottle() {
        if (!closestPlayer) return 0;
        const distanceAlpha = 0.05
        // distance = distance * (1 - distanceAlpha) + distanceAlpha * (0.1 * (closestPlayer.y - playerY) * (Math.random() - .5) + 0.9 * (closestPlayer.y - playerY));
        distance = (closestPlayer.y - playerY)

        // Use a PID loop to calculate throttle from distance
        let error = distance - followDistance - 100 - playerSpeed * 3;
        // console.log(error)
        const dError = error - lastError;
        const dt = (performance.now() - lastTime) / 1000;
        const iError = I + error * dt;

        p = kp * error;
        i = ki * iError;
        d = kd * (dError / dt);
        // console.log(dError / dt)
        const throttle = p + i + d;


        lastError = error;
        lastTime = performance.now();

        return Math.clamp(throttle, -1, 1);
    }

    function carString(lane, y, color, c) {
        const adjustedY = y - camera;

        return `<rect x="${lane * gameWidth / numLanes + gameWidth / numLanes * 0.25}" y="${gameHeight - adjustedY - 100}" width="${gameWidth / numLanes * 0.5}" height="100" fill="${color}" />`;
    }

</script>

<svelte:window on:keydown={e => {
    if (e.key === "ArrowLeft") {
        playerLane.set(Math.max(0, $playerLane - 1));
    } else if (e.key === "ArrowRight") {
        playerLane.set(Math.min(numLanes - 1, $playerLane + 1));
    } else if (e.key === "ArrowUp") {
        followDistance += 10;
    } else if (e.key === "ArrowDown") {
        followDistance -= 10;
    }
}}/>
<div style="position: absolute; top: 0; left: 0">
    Car Speed: {playerSpeed.toFixed(2)} <br>
    Car Y: {playerY.toFixed(2)} <br>
    Camera: {camera.toFixed(2)} <br>
    Throttle: {throttle.toFixed(2)} <br>
    Acceleration: {acc.toFixed(2)} <br>
    Follow Distance: {followDistance.toFixed(2)} -> {followDistance + playerSpeed * 3}<br>
    <table>
        <tr>
            <td>P:</td>
            <td>kp: <input type="text" bind:value={kp}></td>
            <td>{p.toFixed(2)}</td>
        </tr>
        <tr>
            <td>I:</td>
            <td>ki: <input type="text" bind:value={ki}></td>
            <td>{i.toFixed(2)}</td>
        </tr>
        <tr>
            <td>D:</td>
            <td>kd: <input type="text" bind:value={kd}></td>
            <td>{d.toFixed(2)}</td>
        </tr>
    </table>
</div>
<svg viewBox="0 0 {gameWidth} {gameHeight}" xmlns="http://www.w3.org/2000/svg"
     style="height: 90vh; border: 1px solid black; transform: translate(25vw, 0)">
    <circle cx="{gameWidth/2}" cy="{gameHeight/2}" r="10"></circle>
    <g id="lanes">
        {#each Array(numLanes + 1) as _, i}
            <line x1="{gameWidth/numLanes*i}" y1="0" x2="{gameWidth/numLanes*i}" y2="{gameHeight}" stroke="black"
                  stroke-width="2" stroke-dasharray="{[20, 16]}"/>
        {/each}
    </g>
    <g id="horLines">
        {#each Math.range(camera % 200 - 200, camera % 200 + 1200, 200) as y, i}
            <line x1="0" y1="{y}" x2="{gameWidth}" y2="{y}" stroke="black"
                  stroke-width="2" stroke-dasharray="{[20, 16]}"/>
            <text x="10" y="{y}" font-size="20">{(2000 - (gameHeight + y - camera)).toFixed(0)}</text>
        {/each}
    </g>
    <g id="player">
        {@html carString($playerLane, playerY, "red", camera)}
    </g>
    <g id="otherPlayers">
        {#each otherPlayers as otherPlayer}
            {@html carString(otherPlayer.lane, otherPlayer.y, otherPlayer === closestPlayer ? "purple": "blue", camera)}
            {#if otherPlayer === closestPlayer}
                <line y1="{gameHeight - (otherPlayer.y - (followDistance + playerSpeed * 3) - camera)}" y2="{gameHeight - (otherPlayer.y - (followDistance + playerSpeed * 3) - camera)}" x1="{gameWidth/numLanes*otherPlayer.lane}" x2="{gameWidth/numLanes*(otherPlayer.lane+1)}" stroke="green" stroke-width="2"/>
            {/if}
        {/each}
    </g>

</svg>