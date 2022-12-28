<script>
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition'
    import {bounceOut, sineIn} from 'svelte/easing'

    const dispatch = createEventDispatcher();

    let gameBoard, status_box, currentTurn = false, win = false;
    $: pixelSize = (40 / 7).toFixed(2);

    function start_over() {
        gameBoard = Array(6).fill(undefined).map(() => Array(7).fill(0));
        status_box = (currentTurn ? 'Player 2' : 'Player 1') + ' turn';
        win = false;
    }

    start_over()
    function handleClick(col) {
        if (win) return start_over()
        console.log(currentTurn ? 'Player 2' : 'Player 1', ' clicked the box at row ', col)
        let yloc = gameBoard.findIndex((e) => e[col] !== 0) - 1;
        if (yloc === -2) yloc = 5;
        if (yloc === -1) return;
        console.log(yloc);
        gameBoard[yloc][col] = currentTurn + 1;
        currentTurn = !currentTurn;
        status_box = (currentTurn ? 'Player 2' : 'Player 1') + ' turn';
        checkForWins(1)
        checkForWins(2)
    }

    function checkForWins(player) {
        //Horizontal win
        for (const col of gameBoard) {
            for (let i = 0; i < 4; i++) {
                if (player === col[i] &&
                    player === col[i + 1] &&
                    player === col[i + 2] &&
                    player === col[i + 3]) {
                    status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!';
                    col[i] = col[i + 1] = col[i + 2] = col[i + 3] = player + 2;
                    return win = true
                }
            }
        }

        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 3; j++) {
                if (player === gameBoard[j][i] &&
                    player === gameBoard[j + 1][i] &&
                    player === gameBoard[j + 2][i] &&
                    player === gameBoard[j + 3][i]) {
                    status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!';
                    gameBoard[j][i] = gameBoard[j + 1][i] = gameBoard[j + 2][i] = gameBoard[j + 3][i] = player + 2
                    return win = true
                }
            }
        }
        // Down and to the left diagonal
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                if (player === gameBoard[j][i] &&
                    player === gameBoard[j + 1][i+1] &&
                    player === gameBoard[j + 2][i+2] &&
                    player === gameBoard[j + 3][i+3]) {
                    status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!';
                    gameBoard[j][i] = gameBoard[j + 1][i + 1] = gameBoard[j + 2][i + 2] = gameBoard[j + 3][i + 3] = player + 2
                    return win = true
                }
            }
        }

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                if (player === gameBoard[j][i+3] &&
                    player === gameBoard[j + 1][i+2] &&
                    player === gameBoard[j + 2][i+1] &&
                    player === gameBoard[j + 3][i]) {
                    status_box = (player - 1 ? 'Player 2' : 'Player 1') + ' wins!';
                    gameBoard[j][i + 3] = gameBoard[j + 1][i + 2] = gameBoard[j + 2][i + 1] = gameBoard[j + 3][i] = player + 2
                    return win = true
                }
            }
        }
    }

</script>

<style>
    td {
        border-right: 3px solid black;
        border-left: 3px solid black;
        padding: 1px;
    }
</style>

<table style="background-color: lightgrey; box-shadow: 3px 5px 10px 10px grey">
    {#each gameBoard as row, i}
        <tr>
            {#each row as col, j}
                <td on:click={() => handleClick(j)} style="height: {pixelSize}vw;
                        width: {pixelSize}vw;">
                    {#if col > 0}
                        <div out:fly={{duration: 1500, x: 1500*(Math.random()-0.5), y: 1500*(Math.random()-0.5), easing: sineIn}} in:fly={{duration: Math.log((i+1) * 50) * 150, y: -(i+1) * 60, easing: bounceOut}}
                             style="background-color: {['', 'blue', 'red', 'darkblue', 'darkred'][col]};
                        height: 100%;
                        width: 100%;
                        border-radius: {pixelSize/2}vw;">
                        </div>
                    {/if}
                </td>
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
    {status_box}
</div>