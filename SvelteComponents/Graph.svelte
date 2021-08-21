<script>
    import { onMount } from "svelte";
    export let axisSettings;
    export let datas;
    let element;

    let objects = [];

    onMount(() => {
        const s = Snap(element);

        for (const line of axisSettings) {
            objects.push([
                s.polyline([10, 10]).attr({
                    fill: "none",
                    stroke: line.color,
                    strokeWidth: "5",
                }),
                s.text(line.axis, -19, "- " + line.units),
                s.text(line.axis, 132, "- " + line.units),
            ]);
        }
    });

    $: update(datas);
    function update() {
        for (let i = 0; i < objects.length; i++) {
            datas[i] = datas[i].slice(
                Math.max(datas[i].length - axisSettings[i].maxPoints, 0)
            );
            let maxY = datas[i].reduce(function (a, b) {
                return Math.max(a, b);
            });
            let minY = axisSettings[i].minIs0
                ? 0
                : datas[i].reduce(function (a, b) {
                      return Math.min(a, b);
                  });

            maxY += Math.max(1, 0.2 * (maxY - minY));
            minY -= axisSettings[i].minIs0
                ? 0
                : Math.max(1, 0.2 * (maxY - minY));

            maxY = Math.round(maxY);
            minY = Math.round(minY);

            objects[i][0].attr({
                points: getPathString(datas[i], minY, maxY),
            });
            objects[i][2].attr({ text: minY + axisSettings[i].units });
            objects[i][1].attr({ text: maxY + axisSettings[i].units });

        }
    }

    function getPathString(data, minY, maxY) {
        let ret = "";

        let i = 0;
        data.forEach((e) => {
            // -25 = 90,  125 = 60
            ret += i + "," + Math.map(minY, maxY, 125, -25, e).toFixed(1) + ",";
            i += 10;
        });
        return ret.slice(0, -1);
    }
</script>

<div class="container">
    <svg class="voltages" viewBox="0 0 400 100" bind:this={element} />
</div>

<style>
    .container {
        width: 93%;
        height: 25%;
        background-color: #daf7a6;
        padding: 10px;
        box-shadow: 0 0 15px 0px #c6f56f;
        margin: 5px;
    }

    .voltages {
        border-left: 2px dotted #555;
        border-bottom: 2px dotted #555;
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
