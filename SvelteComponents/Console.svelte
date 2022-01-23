<script>
    import {darkMode} from "./stores";

    export let text;
    let textarea;
    $: if (text && textarea) {
        textarea.scrollTop = textarea.scrollHeight;
    }
</script>

<textarea readonly bind:this={textarea} class="{$darkMode ? 'darkIsland' : 'island'}"
          style="color: {$darkMode? '#c5c5c5' : 'black'}">{text}</textarea>

<style>
    textarea {
        height: 15%;
        padding: 2%;
        font-size: 1.1vw;
    }
</style>
