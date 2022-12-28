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
        }
    }

    setInterval(() => {
        data.datasets[0].data.push($BMSData.batteryVoltage);
        data.datasets[1].data.push($remainingAH * 3.7 * 21 * 0.0035);
        const str = new Date().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', hour12: true})
        data.labels.push(str.substring(0, str.length - 3));
        if (data.datasets[0].data.length > 60) {
            data.datasets[0].data.shift();
            data.datasets[1].data.shift();
            data.labels.shift();
        }
        data = data;
    }, 60000);

</script>

<style>
    table {
        border-collapse: collapse;
        font-size: 2.5em;
        padding-top: 5px;
    }

    table, td {
        /*border: 1px solid black;*/
    }

    td {
        padding: 20px;
    }

    td img {
        width: 50px;
        /*height: 40px;*/
    }

    /*    td with image as children should have no padding*/
    td:has(img) {
        padding: 0;
    }

</style>
<div style="position: absolute; top: 25vh; left: 26.5vw; width: 50vw; height: 50vh">
    <Line {data} {options}/>
</div>
<div style="position: absolute; top: 25vh; left: 2vw; width: 17vw; height: 50vh">
    <BatteryIndicator/>
</div>

<div style="position: absolute; top: 2vw; right: 2vw;">
    <div style="display: flex; justify-content: center; height: 20vh; transition: opacity 1s linear; opacity: {$chargerData.running ? 100 : 50}%">
        <img src="./static/charger.svg" alt="charger" style="height: 16vh;">
    </div>
    <table>
        <tr>
            <td><img src="./static/outlet.svg" alt="outlet"></td>
            <td>{$chargerData.running ? $chargerData.inputVoltage.toFixed(0) : ' - '} V</td>
        </tr>
        <tr>
            <td><img src="./static/battery.svg" alt="batt"></td>
            <td>{$chargerData.running ? $chargerData.outputVoltage.toFixed(1) : ' - '} V</td>
        </tr>
        <tr>
            <td><img src="./static/battery.svg" alt="batt"></td>
            <td>{$chargerData.running ? $chargerData.current.toFixed(1) : ' - '} A</td>
        </tr>
        <tr>
            <td><img src="./static/temp.svg" alt="temp"></td>
            <td>{$chargerData.running ? $chargerData.temp.toFixed(1) : ' - '} C</td>
        </tr>
    </table>
</div>
<div style="position: absolute; bottom: 0; width: 100vw; height: 20vw">
    <CellViewer/>
</div>

