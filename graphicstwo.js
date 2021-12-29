const interpolateHSL = function (color1, color2, factor) {
    if (arguments.length < 3) { factor = 0.5; }
    var hsl1 = rgb2hsl(color1);
    var hsl2 = rgb2hsl(color2);
    for (var i = 0; i < 3; i++) {
        hsl1[i] += factor * (hsl2[i] - hsl1[i]);
    }
    return hsl2rgb(hsl1);
};

export function getColor(voltage, max = 4.15, min = 3.2) {
    const start = "#ff5000", end = "#00ff00";
    // from 3.2 to 4.15
    let factor = (voltage - min) / (max - min);
    return r2h(interpolateHSL(h2r(start), h2r(end), factor));
}

// Converts a #ffffff hex string into an [r,g,b] array
var h2r = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
var r2h = function (rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

const rgb2hsl = function (color) {
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
};

const hsl2rgb = function (color) {
    let l = color[2];

    if (color[1] === 0) {
        l = Math.round(l * 255);
        return [l, l, l];
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        const s = color[1];
        const q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
        const p = 2 * l - q;
        const r = hue2rgb(p, q, color[0] + 1 / 3);
        const g = hue2rgb(p, q, color[0]);
        const b = hue2rgb(p, q, color[0] - 1 / 3);
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
};