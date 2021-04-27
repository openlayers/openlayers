import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import View from '../../../../src/ol/View.js';
import {Circle, Fill, Stroke, Style} from '../../../../src/ol/style.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const points = [[0, 0]];

const vectorTileSource = new VectorTileSource({
  tileGrid: createXYZ({
    extent: [-20000000, -10000000, 10000000, 20000000],
    tileSize: 512,
  }),
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
  declutter: true,
  source: vectorTileSource,
  style: new Style({
    image: new Circle({
      radius: 100,
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
    zoom: 4,
    multiWorld: true,
  }),
});

render({
  message:
    'Vector tile source tile grid different from render tile grid, with decluttering',
});
