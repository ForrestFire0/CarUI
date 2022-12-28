<script>
    export let text;
    let textarea;
    $: if (text && textarea) {
        textarea.scrollTop = textarea.scrollHeight;
    }
</script>

<textarea readonly bind:this={textarea}>{text}</textarea>

<style>
    textarea {
        height: 20%;
        width: 50%;
        padding: 1.1vw;
        font-size: 1.1vw;
    }
</style>
