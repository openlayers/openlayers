import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLTextLayer from '../src/ol/layer/WebGLText.js';
// import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import WebGLPointsLayer from '../src/ol/layer/WebGLPoints.js'; // Use PointsLayer to match instrumented renderer
import OSM from '../src/ol/source/OSM.js';
import Vector from '../src/ol/source/Vector.js';
import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';

const vectorSource = new Vector({
    url: 'data/geojson/world-cities.geojson',
    format: new GeoJSON(),
    wrapX: true,
});

const features = [];
const count = 200000;
console.log(`[Performance] Generating ${count} features...`);

const e = 18000000; // Extent for random placement
for (let i = 0; i < count; ++i) {
    const x = 2 * e * Math.random() - e;
    const y = 2 * e * Math.random() - e;

    // Use a limited character set to fit in the atlas (since glyphs are 128px now)
    // 1024x1024 atlas can hold ~64 128px glyphs.
    // "OpenLayers" has 10 unique chars. "Performance" has 9.
    const label = i % 2 === 0 ? 'OpenLayers' : 'WebGL';

    features.push(new Feature({
        geometry: new Point([x, y]),
        name: label,
        color: [Math.random(), Math.random(), Math.random(), 1.0],
        outlineColor: [0.0, 0.0, 0.0, 1.0],
        outlineWidth: 0.2, // relative to SDF
        textSize: 24 + Math.random() * 24, // Random size 24-48px
        rotation: Math.random() * Math.PI * 2
    }));
}
vectorSource.addFeatures(features);
console.log(`[Performance] ${count} features added.`);

const textLayer = new WebGLTextLayer({
    source: vectorSource,
    style: {
        fontFamily: 'Courier New',
        fontWeight: 'bold'
    }
});

// FPS Counter
let frameCount = 0;
let lastTime = Date.now();
textLayer.on('postrender', () => {
    frameCount++;
    const now = Date.now();
    if (now - lastTime >= 1000) {
        console.log(`[Performance] FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = now;
    }
});

const map = new Map({
    layers: [
        new TileLayer({
            source: new OSM(),
            opacity: 0.5,
        }),
        textLayer
    ],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 4,
    }),
});

// Force continuous rendering to measure FPS
function animate() {
    map.render();
    requestAnimationFrame(animate);
}
animate();
