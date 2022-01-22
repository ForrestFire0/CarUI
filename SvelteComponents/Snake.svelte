<script>
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    let boardSize = 8;
    let gameBoard, appleLocation, targetLength, currentLength, timeout, loopLen, direction, status_box;
    const presses = [];
    $: start_over(boardSize)
    $: pixelSize = (40 / boardSize).toFixed(2) + 'vw'

    function start_over() {
        headLocation.x = 1;
        headLocation.y = 1;
        targetLength = 3;
        currentLength = 0
        segments.length = 0
        loopLen = 500;
        gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
        appleLocation = makeApple()
        direction = 'Right'
        clearTimeout(timeout)
        animation_loop()
        status_box = ''
    }

    const headLocation = {'x': 3, 'y': 3}
    const segments = []
    const appleEquality = (a1, a2) => a1.x === a2.x && a1.y === a2.y;

    function makeApple() {
        if (currentLength >= (boardSize * boardSize) - 1) {
            status_box = 'You win or something...'
            return;
        }
        let app = {'x': Math.floor(Math.random() * boardSize), 'y': Math.floor(Math.random() * boardSize)}
        while (gameBoard[app.x][app.y] !== 0) {
            app = {'x': Math.floor(Math.random() * boardSize), 'y': Math.floor(Math.random() * boardSize)}
        }
        gameBoard[app.x][app.y] = 2;
        return app
    }

    start_over()

    function animation_loop() {
        direction = presses.length > 0 ? presses.shift() : direction;
        headLocation.y += (direction === 'Right') - (direction === 'Left');
        headLocation.x += (direction === 'Down') - (direction === 'Up');
        if (headLocation.x >= 0 && headLocation.x < boardSize &&
            headLocation.y >= 0 && headLocation.y < boardSize &&
            gameBoard[headLocation.x][headLocation.y] !== 1
        ) {
            if (appleEquality(headLocation, appleLocation)) {
                appleLocation = makeApple()
                loopLen = Math.max(200, loopLen / 1.025);
                targetLength += 3;
            }
            segments.push(JSON.parse(JSON.stringify(headLocation)));
            gameBoard[headLocation.x][headLocation.y] = 1;
            currentLength++;
            if (currentLength > targetLength) {
                const tailLocation = segments.shift()
                gameBoard[tailLocation.x][tailLocation.y] = 0;
                currentLength--;
            }
            if (currentLength >= (boardSize * boardSize) - 1) {
                status_box = 'You win or something...'
            } else
                timeout = setTimeout(animation_loop, loopLen)
        } else {
            status_box = "You lose lol. Score: " + targetLength;
        }
    }

    function handleKeyboard(e) {
        doInput(e.key.substring(5))
    }

    function doInput(new_d) {
        const opposites = {'Up': 'Down', 'Down': 'Up', 'Right': 'Left', 'Left': 'Right'}
        if (!(new_d in opposites)) return;
        let last_d = direction;
        if (presses.length > 0) last_d = presses.last()
        //Cannot be the same direction as the previous commanded, cannot be in an opposite direction.
        if (new_d === last_d) return;
        if (new_d === opposites[last_d]) return;
        presses.push(new_d)
        while (presses.length > 2) presses.shift()
    }

    let start;

    function handleTouchStart(e) {
        start = [e.changedTouches[0].clientX, e.changedTouches[0].clientY]
    }

    function handleTouchEnd(e) {
        const end = [e.changedTouches[0].clientX, e.changedTouches[0].clientY]
        const deltaX = end[0] - start[0]
        const deltaY = end[1] - start[1]
        const angle = Math.atan2(-deltaY, deltaX) / Math.PI * 180
        if (45 > angle && angle > -45) doInput('Right')
        if (135 > angle && angle > 45) doInput('Up')
        if (-45 > angle && angle > -135) doInput('Down')
        if (-135 > angle || angle > 135) doInput('Left')
    }

    let showDashes = true;

</script>

<style>
    td {
        border-width: 1px;
        border-color: black;
        transition-property: background-color;
        transition-duration: .5s;
    }
</style>

<svelte:window on:keydown={handleKeyboard} on:touchstart={handleTouchStart}
               on:touchend={handleTouchEnd}/>

<table style="background-color: lightgrey; box-shadow: 3px 5px 10px 10px grey">
    {#each gameBoard as row}
        <tr>
            {#each row as col}
                <td style="background-color: {['inherit', 'green', 'red'][col]};
                border-style: {showDashes ? 'dashed' : 'inherit'};
                height: {pixelSize};
                width: {pixelSize};
                border-radius: {showDashes? 'inherit':'10px'};"></td>
            {/each}
        </tr>
    {/each}
</table>
<br>
<br>
<div style="display: inline-block">
    <button on:click={() => dispatch('closeOverlay')}>Close</button>
</div>
<div style="display: inline-block">
    <button on:click={start_over}>Reset</button>
</div>
<div style="display: inline-block">
    <button on:click={() => showDashes = !showDashes}>{showDashes ? 'Hide Grid' : 'Show Grid'}</button>
</div>
<input type="number" max="25" min="4" bind:value={boardSize}>
<div style="display: inline-block">
    Score: {targetLength}
</div>
<div style="display: inline-block">
    {status_box}
</div>