import Point from 'ol/geom/Point.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
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
        [Math.cos(angle) * 15000000, Math.sin(angle) * 15000000],
      ]),
      myProp,
    }),
  );
  features.push(
    new Feature({
      geometry: new Point([
        Math.cos(angle) * 18000000,
        Math.sin(angle) * 18000000,
      ]),
      myProp,
    }),
  );
}

const vector = new HeatmapLayer({
  source: new VectorSource({
    features,
  }),
  blur: 7,
  radius: 7,
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
