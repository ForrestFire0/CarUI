<script>
    import {createEventDispatcher} from "svelte";
    import * as datas from "../data";
    import LabeledSwitch from "../Inputs/LabeledSwitch.svelte";
    import {get} from "svelte/store";

    let attributes = [];
    const possibleAttributes = Object.entries(datas).filter(([, v]) => typeof v === 'object' && 'subscribe' in v);
    let logging = false;
    const dispatch = createEventDispatcher();
    const unsubArray = [];
    let frequency = '1Hz';

    let keys = []; //per object keys
    let lastValues = {}; //last values of each object

    // js function to get value from nested object given dot notation string
    function getNestedObject(nestedObj, pathStr) {
        //Ex {a:{b:{c:1}}}, 'a.b.c' => 1
        return pathStr.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
    }

    function setLogging(newLogging) {
        console.log(newLogging)
        logging = newLogging;
        if (logging) {
            //Add to the keys array for each nested element in the object.
            //For example, for the object "datas" with the keys "accelerometer" and "gyroscope", the keys array will be ["accelerometer.x", "accelerometer.y", "accelerometer.z", "gyroscope.x", "gyroscope.y", "gyroscope.z"]
            //However, we must consider for object datas with the keys 'accelerometer' it might have a child object axis, with x y and z. In this case, add 'accerometer.axis.x' etc.
            //This is done by the recursive function below.

            function addKeys(value, key) {
                if (typeof value === 'object' && value !== null) {
                    Object.entries(value).forEach(([k, v]) => {
                        addKeys(v, key + '.' + k);
                    });
                    return
                }
                keys.push(key);
            }
            attributes.forEach(([key, value]) => {
                addKeys(get(value), key)
                const unsub = value.subscribe((value) => {
                    lastValues[key] = value;
                })
                unsubArray.push(unsub);
            });

            console.log({keys});
            if (window.versions) window.fileWriter.open();
            const writer = window.fileWriter ? window.fileWriter.write : console.log;
            // Write the keys as a comma seperated array.
            writer('time,' + keys.join(',') + '\n');
            let intervalID = setInterval(() => {
                writer((new Date()).getTime() + ',' +
                    keys.map(key => {
                    const val = getNestedObject(lastValues, key)
                    if (typeof val === 'number') return val.toExponential(3);
                    return val;
                }).join(',') + '\n');
            }, frequencyToMs(frequency));
            unsubArray.push(() => clearInterval(intervalID));
        } else {
            for (const unsub of unsubArray) {
                unsub();
            }
            unsubArray.length = 0;
        }
    }

    function frequencyToMs(frequency) {
        switch (frequency) {
            case '0.1Hz':
                return 10000;
            case '1Hz':
                return 1000;
            case '10Hz':
                return 100;
            default:
                return 1000;
        }
    }
</script>

<style>
    div {
        padding: 5px;
    }
</style>

<h1>Logger</h1>
{#each attributes as attribute, i}
    <div on:click={() =>{if(!logging) {attributes.splice(i, 1); attributes = attributes}}}> - {attribute[0]}</div>
{/each}
{#if !logging}
    <div><small><i>Tap to remove a logged attribute.</i></small></div>
    <select on:change={(ev) => {attributes.push(possibleAttributes.find(e => e[0] === ev.target.value)); ev.target.selectedIndex = 0; attributes = attributes;}}>
        <option value="" disabled selected>Choose an attribute</option>
        {#each possibleAttributes as attribute}
            {#if !attributes.includes(attribute)}
                <option value={attribute[0]}>{attribute[0]}</option>
            {/if}
        {/each}
    </select>
{/if}
<h3>Logging Frequency</h3>
<div style="max-height: 20vh; overflow-y: auto;">
    {#if logging}
        Logging {keys.length ? keys.join(', ') : 'literally nothing'} @ {frequency}
    {:else }
        <LabeledSwitch options="{['10Hz', '1Hz', '0.1Hz']}" bind:selected={frequency}/>
    {/if}
</div>
<button on:click={() => setLogging(!logging)}>{logging ? 'Stop' : 'Start'} logging</button>
<button on:click={() =>{setLogging(false); dispatch('closeOverlay'); }}>Quit</button>