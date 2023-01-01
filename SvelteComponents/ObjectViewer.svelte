<script>
    //Can be number, string, boolean, object, array.

    function shorten(val) {
        if (typeof val === 'number') {
            return parseFloat(val.toFixed(2));
        }
        if (typeof val !== 'string') {
            val = String(val);
        }
        const maxLen = 11;
        if (val.length > maxLen) return val.substring(0, maxLen - 3) + '...'
        return val;
    }

    let unsub;

    export let value;
    $: if (typeof value == 'object' && 'subscribe' in value) {
        if (unsub) unsub();
        unsub = value.subscribe((v) => {
            value = v
        })
    }
    export let name = "Object";
    export let expanded = false;
</script>

<style>
    td {
        border: 1px solid black;
    }

    span {
        width: 100%;
        display: block;
    }
</style>
{#if ['number', 'string', 'boolean'].includes(typeof value) || value == null}
    <span>
        {#if name !== 'Object'}
            {name}:
        {/if}

        {typeof value == 'number' ? parseFloat(value.toFixed(2)) : value}
    </span>
{:else if Array.isArray(value)}
    <div on:click={() => expanded = !expanded} style="cursor: pointer">
        {#if expanded}▼ Array({value.length})
        {:else}▶ Array({value.length}) [{value.map(e => shorten(e)).join(', ')}]
        {/if}
    </div>
    {#if expanded}
        {#each value as val}
            <svelte:self bind:value={val} on:edit on:done/>
        {/each}
    {/if}
{:else if typeof value == 'object'}
    <div on:click={() => expanded = !expanded} style="cursor: pointer">
        {#if expanded}▼ {name}({Object.keys(value).length})
        {:else}▶ {name}({Object.keys(value).length})
            {'{' + Object.entries(value).map(e => shorten(e[0]) + ':' + shorten(e[1])).join() + '}'}
        {/if}
    </div>
    {#if expanded}
        <table style="border-collapse: collapse;">
            {#each Object.entries(value) as [key, val]}
                <tr>
                    <td>{key}</td>
                    <td>
                        <svelte:self value={value[key]}/>
                    </td>
                </tr>
            {/each}
        </table>
    {/if}
{/if}