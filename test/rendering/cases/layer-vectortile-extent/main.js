import {applyBackground, applyStyle} from 'ol-mapbox-style';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {buffer} from '../../../../src/ol/extent.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const center = [1822585.77586262, 6141438.140891937];
const extent = buffer([...center, ...center], 200);

// Use the same font bytes as the browser unit tests, with no system fallback.
const font = new FontFace(
  'Ubuntu Extent Test',
  'url(/data/fonts/ubuntu-regular-webfont.woff2)',
);
document.fonts.add(await font.load());
const style = await fetch('/data/styles/bright-v9/style.json').then(
  (response) => response.json(),
);
for (const layer of style.layers) {
  if (layer.layout?.['text-font']) {
    layer.layout['text-font'] = ['Ubuntu Extent Test Regular'];
  }
}
const mapboxVectorLayer = new VectorTileLayer({declutter: true, extent});
await applyStyle(mapboxVectorLayer, style);
await applyBackground(mapboxVectorLayer, style);
const extentLayer = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(fromExtent(extent))],
  }),
  style: {
    'stroke-color': 'cyan',
    'stroke-width': 3,
  },
});

const map = new Map({
  layers: [mapboxVectorLayer, extentLayer],
  target: 'map',
  view: new View({
    center,
    zoom: 16,
  }),
});

await new Promise((resolve) => map.once('rendercomplete', resolve));

render({
  message:
    'Vector tile layer clips rendering and filters declutter candidates to the layer extent',
  tolerance: 0.01,
});
