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
        margin-bottom: -1%;
        width: 100%;
        height: 15%;
        padding: 1%;
        font-size: 14px;
        box-shadow: 5px 5px 8px 2px #6B6B6B;
    }
</style>
