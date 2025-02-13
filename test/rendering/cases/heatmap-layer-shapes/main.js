import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const features = [];
for (let i = 0; i < 16; i++) {
  const angle = (i * Math.PI) / 8;
  const myProp = (100 * (i + 1)) / 16;
  features.push(
    new Feature({
      geometry: new LineString([
        [0, 0],
        fromLonLat([Math.cos(angle) * 160, Math.sin(angle) * 80]),
      ]),
      myProp,
    }),
  );
}

const vector = new HeatmapLayer({
  source: new VectorSource({
    features,
  }),
  blur: 15,
  radius: 15,
  weight: ['/', ['get', 'myProp'], 100],
  filter: ['any', ['<', ['get', 'myProp'], 50], ['>', ['get', 'myProp'], 65]],
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message: 'Heatmap layer with lines renders properly using webgl',
});
