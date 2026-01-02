import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLTextLayer from '../src/ol/layer/WebGLText.js';
import OSM from '../src/ol/source/OSM.js';
import Vector from '../src/ol/source/Vector.js';
import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';
import { fromLonLat } from '../src/ol/proj.js';

const vectorSource = new Vector({
    wrapX: true,
});

// Single Feature for Showcase
const testFeature = new Feature({
    geometry: new Point(fromLonLat([0, 0])),
    name: 'OpenLayers',
    color: [1.0, 1.0, 0.0, 1.0],
    outlineColor: [1.0, 0.0, 0.0, 1.0],
    outlineWidth: 0.1,
    textSize: 64,
    spacing: 0,
    rotation: Math.PI / 4,
    backgroundColor: [0, 0, 0, 0.5],
    backgroundOutlineColor: [1, 1, 1, 1],
    backgroundOutlineWidth: 2,
    visible: true,
});
vectorSource.addFeature(testFeature);

let textLayer;
let map;

function createLayer(fontFamily, fontWeight) {
    if (textLayer) {
        map.removeLayer(textLayer);
    }

    textLayer = new WebGLTextLayer({
        source: vectorSource,
        style: {
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            visible: ['get', 'visible'],
        }
    });

    map.addLayer(textLayer);
}

map = new Map({
    layers: [
        new TileLayer({
            source: new OSM(),
            opacity: 0.5
        })
    ],
    target: 'map',
    view: new View({
        center: fromLonLat([0, 0]),
        zoom: 4,
    }),
});

// Initial creation
createLayer('sans-serif', 'normal');

// Helper to hex to rgb array [r,g,b,a]
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, parseFloat(alpha)];
}

// UI Handling functions
function updateFeature() {
    const text = document.getElementById('textInput').value;
    const textSize = parseFloat(document.getElementById('textSize').value);
    const rotationDeg = parseFloat(document.getElementById('rotation').value);
    const spacing = parseFloat(document.getElementById('spacing').value);
    const visible = document.getElementById('visibility').checked;

    // Fill
    const fillHex = document.getElementById('fillColor').value;
    const fillAlpha = document.getElementById('fillAlpha').value;

    // Outline
    const outlineHex = document.getElementById('outlineColor').value;
    const outlineAlpha = document.getElementById('outlineAlpha').value;
    const outlineWidth = parseFloat(document.getElementById('outlineWidth').value);

    // BG
    const bgHex = document.getElementById('bgColor').value;
    const bgAlpha = document.getElementById('bgAlpha').value;

    // BG Outline
    const bgOHex = document.getElementById('bgOutlineColor').value;
    const bgOAlpha = document.getElementById('bgOutlineAlpha').value;
    const bgOWidth = parseFloat(document.getElementById('bgOutlineWidth').value);

    // Update Labels
    document.getElementById('textSizeVal').textContent = textSize;
    document.getElementById('rotationVal').textContent = rotationDeg;
    document.getElementById('spacingVal').textContent = spacing;
    document.getElementById('outlineWidthVal').textContent = outlineWidth;
    document.getElementById('bgOutlineWidthVal').textContent = bgOWidth;

    // Convert Rotation to Radians
    const rotationRad = rotationDeg * (Math.PI / 180);

    // Set Properties
    testFeature.set('name', text);
    testFeature.set('textSize', textSize);
    testFeature.set('rotation', rotationRad);
    testFeature.set('spacing', spacing);
    testFeature.set('color', hexToRgba(fillHex, fillAlpha));
    testFeature.set('outlineColor', hexToRgba(outlineHex, outlineAlpha));
    testFeature.set('outlineWidth', outlineWidth);
    testFeature.set('backgroundColor', hexToRgba(bgHex, bgAlpha));
    testFeature.set('backgroundOutlineColor', hexToRgba(bgOHex, bgOAlpha));
    testFeature.set('backgroundOutlineWidth', bgOWidth);
    testFeature.set('visible', visible);
}

// Global Re-create for Font
document.getElementById('fontFamily').addEventListener('change', () => {
    const fam = document.getElementById('fontFamily').value;
    const weight = document.getElementById('fontWeight').value;
    createLayer(fam, weight);
});

document.getElementById('fontWeight').addEventListener('change', () => {
    const fam = document.getElementById('fontFamily').value;
    const weight = document.getElementById('fontWeight').value;
    createLayer(fam, weight);
});

// Attach listeners
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('input', updateFeature);
    input.addEventListener('change', updateFeature);
});

// Run once
updateFeature();
