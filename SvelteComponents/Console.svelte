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
        margin-top: 3%;
        width: 100%;
        height: 20%;
        padding: 1%;
        font-size: 90%;
    }
</style>
