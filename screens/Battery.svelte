<script>
    /*
        It will show a voltage graph for the last hour. It will sample the voltage every minute and add it to the graph.
        It will show the estimated amp hours and therefore range from the last valid voltage measurement.

        Battery will:
        - Show All Cells, min max, average, and total voltage
        - It will show charging data as well.
        - Estimated SOC, estimated time till finish charging, estimated range.
        - Colors of voltage chart should match line chart
        - Table of charging information. Screen shows hyphens when not charging. Greyed out.
            - Icons for descriptors of numbers. (Temperature for sure!)
        - Charger data will be shown on this screen when applicable "Please plug in the car to see charger data"
     */

    import {BMSData, chargerData, remainingAH} from "../SvelteComponents/data";

    import {Bar, Line} from 'svelte-chartjs';
    import 'chart.js/auto';
    import CellViewer from "../SvelteComponents/CellViewer.svelte";
    import BatteryIndicator from "../SvelteComponents/BatteryIndicator.svelte";
    import {batteryGraphDurationCustomValue, batteryGraphDurationSelection} from "../SvelteComponents/stores";
    import ChargerIndicator from "../SvelteComponents/ChargerIndicator.svelte";

    export let data = {
        labels: [],
        datasets: [
            {
                label: 'Voltage',
                fill: true,
                lineTension: 0.3,
                backgroundColor: 'rgba(225, 204,230, .3)',
                borderColor: 'rgb(205, 130, 158)',
                pointBorderColor: 'transparent',
                pointBackgroundColor: 'transparent',
                data: [],
                yAxisID: 'y',
            },
            {
                label: 'Miles Remaining',
                fill: true,
                lineTension: 0.3,
                backgroundColor: 'rgba(184, 185, 210, .3)',
                borderColor: 'rgb(35, 26, 136)',
                pointBorderColor: 'transparent',
                pointBackgroundColor: 'transparent',
                data: [],
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Voltage',
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Miles Remaining',
                },
                grid: {
                    drawOnChartArea: false,
                },
            }
        },
        animation: {
            duration: 0
        }
    }
    let interval;
    function updateBatteryGraphDuration(sel, custom, numDatapoints=120) {
        let duration = {
            '1 m': 60 * 1000,
            '3 m': 3 * 60 * 1000,
            '1 hr': 60 * 60 * 1000,
            'Custom': custom
        }[sel];
        clearInterval(interval);

        interval = setInterval(() => {
            if ($BMSData.batteryVoltage < 50) return;
            data.datasets[0].data.push($BMSData.batteryVoltage);
            data.datasets[1].data.push($remainingAH * 3.7 * 21 * 0.0035);
            const showSeconds = duration < 5 * 60 * 1000;
            const date = new Date();
            const hours = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            const time = `${hours}:${minutes < 10 ? '0' : ''}${minutes}${showSeconds ? `:${seconds < 10 ? '0' : ''}${seconds}` : ''}`;
            data.labels.push(time);
            if (data.datasets[0].data.length > numDatapoints) {
                data.datasets[0].data.shift();
                data.datasets[1].data.shift();
                data.labels.shift();
            }
            // adjust the scales of both the y-axis and y1 to be the min and max of data.datasets[0] and data.datasets[1] respectively.
            options.scales.y.min = Math.min(...data.datasets[0].data) - 0.5;
            options.scales.y.max = Math.max(...data.datasets[0].data) + 0.5;
            options.scales.y1.min = Math.min(...data.datasets[1].data) - 1;
            options.scales.y1.max = Math.max(...data.datasets[1].data) + 1;
            data = data;
        }, duration / numDatapoints);
    }

    $: updateBatteryGraphDuration($batteryGraphDurationSelection, $batteryGraphDurationCustomValue);

</script>

<style>
    table {
        border-collapse: collapse;
        font-size: 2.5em;
        padding-top: 5px;
    }

    td {
        padding: 20px;
    }

    td img {
        width: 50px;
    }

    td:has(img) {
        padding: 0;
    }

</style>
<div style="position: absolute; top: 20vh; left: 2vw; height: 35vh">
    <BatteryIndicator/>
</div>
<div style="position: absolute; top: 20vh; left: 25vw; width: 50vw; height: 50vh">
    <Line {data} {options}/>
</div>
<div style="position: absolute; top: 20vh; right: 2vw; height: 35vh">
    <ChargerIndicator/>
</div>

<div style="position: absolute; bottom: 0; width: 100vw; height: 20vw">
    <CellViewer/>
</div>

