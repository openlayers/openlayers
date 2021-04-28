import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import View from '../../../../src/ol/View.js';
import {Circle, Fill, Stroke, Style} from '../../../../src/ol/style.js';

const offset = 1380000;
const points = [
  [-offset, -offset],
  [-offset, offset],
  [offset, offset],
  [offset, -offset],
];

const vectorTileSource = new VectorTileSource({
  tileUrlFunction: (tileCoord) => tileCoord,
  tileLoadFunction(tile, tileCoord) {
    const features = points.map(
      (corner) =>
        new Feature({
          geometry: new Point(corner),
          tileCoord,
        })
    );
    tile.setFeatures(features);
  },
});

const vectorTileLayer = new VectorTileLayer({
  source: vectorTileSource,
  style: new Style({
    image: new Circle({
      radius: 50,
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.5)',
      }),
      stroke: new Stroke({
        width: 1,
        color: 'black',
      }),
    }),
  }),
});

new Map({
  target: 'map',
  layers: [vectorTileLayer],
  view: new View({
    center: [0, 0],
    zoom: 2,
    multiWorld: true,
  }),
});

render({
  message: 'Vector tile layer renders tiles from renderBuffer',
});
