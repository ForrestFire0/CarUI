<script>
    import { onMount, getContext } from "svelte";
    export let data;
    let element;
    let object;
    let Q0Q4;
    let Q1Q3;
    let text;
    const centerX = 200;
    const centerY = 180;
    let ptFrmVal;

    let width = 0.7;
    let radius = 0.72;

    $: update(data);

    function update() {
        const animationDuration = getContext("animationDuration");
        if (!data || !Q0Q4 || !Q1Q3) return;
        const sorted = data.sort(function (a, b) {
            return a - b;
        });
        const Q0 = sorted[0];
        const Q1 = sorted[Math.round(data.length / 4)];
        const Q3 = sorted[Math.round((3 * data.length) / 4)];
        const Q4 = sorted.last();

        Q0Q4.animate(
            {
                d: [
                    "M",
                    ptFrmVal(Q0),
                    "A",
                    centerX * radius,
                    centerX * radius,
                    0,
                    0,
                    1,
                    ptFrmVal(Q4),
                ].join(" "),
            },
            animationDuration * 1000,
            mina.easeinout
        );

        Q1Q3.animate(
            {
                d: [
                    "M",
                    ptFrmVal(Q1),
                    "A",
                    centerX * radius,
                    centerX * radius,
                    0,
                    0,
                    1,
                    ptFrmVal(Q3),
                ].join(" "),
            },
            animationDuration * 1000,
            mina.easeinout
        );

        text.attr({
            text: "Min: " + Q0.toFixed(0) + " Max: " + Q4.toFixed(0),
        });
    }

    onMount(() => {
        object = Snap(element);
        let marker = object
            .line(5, 4, 5, 6)
            .attr({
                stroke: "#FF5733",
                strokeLinecap: "round",
                strokeWidth: 0.75,
            })
            .marker(4, 2, 6, 8, 5, 5);

        // The main arc
        const background = object
            .path(
                [
                    "M",
                    centerX * (1 - width),
                    centerY,
                    "A",
                    centerX * radius,
                    centerX * radius,
                    0,
                    1,
                    1,
                    centerX * (1 + width),
                    centerY,
                ].join(" ")
            )
            .attr({
                stroke: "#566675",
                strokeWidth: 9,
                strokeLinecap: "round",
                fill: "rgba(0, 0, 0, 0.267)",
            });

        ptFrmVal = function (value) {
            value = Math.clamp(value, 10, 50);
            const totalLen = background.getTotalLength();
            const len = (totalLen * (value - 10)) / 50;

            let pt = background.getPointAtLength(len);
            return pt.x + " " + pt.y;
        };

        //The max to min arc
        Q0Q4 = object
            .path(
                [
                    "M",
                    ptFrmVal(10),
                    "A",
                    centerX * radius,
                    centerX * radius,
                    0,
                    0,
                    1,
                    ptFrmVal(13),
                ].join(" ")
            )
            .attr({
                stroke: "#FF5733",
                // strokeLinecap: "round",
                strokeWidth: 15,
                fill: "none",
                "marker-start": marker,
                "marker-end": marker,
            });

        //The Q1 to Q3 arc
        //The max to min arc
        Q1Q3 = object
            .path(
                [
                    "M",
                    ptFrmVal(11),
                    "A",
                    centerX * radius,
                    centerX * radius,
                    0,
                    0,
                    1,
                    ptFrmVal(12),
                ].join(" ")
            )
            .attr({
                stroke: "#FFC300",
                strokeWidth: 25,
                fill: "none",
            });

        text = object.text(centerX, centerY - 50, "Min: 00 Max: 00").attr({
            fontWeight: "bolder",
            fontSize: "23px",
        });
        text.attr({
            x: centerX - text.node.getBBox().width/2
        });
        object.text(centerX * (1 - 0.85 * width), centerY - 10, "10").attr({
            fontWeight: "bolder",
            fontSize: "30px",
            fill: "#566675",
        });
        object.text(centerX * (1 + 0.7 * width), centerY - 10, "50").attr({
            fontWeight: "bolder",
            fontSize: "30px",
            fill: "#566675",
        });
    });
</script>

<svg
    bind:this={element}
    viewBox="0 0 400 200"
    style="width: 100%; height: 20%" />
