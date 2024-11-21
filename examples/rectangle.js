import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

import Feature from 'ol/Feature.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';
import {fromExtent} from 'ol/geom/Polygon.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(
            // Here a `Geometry` is expected, e.g. a `Polygon`, which has a handy function to create a rectangle from bbox coordinates
            fromExtent([-1000000, 5000000, 3000000, 7000000]), // minX, minY, maxX, maxY
          ),
        ],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [1000000, 6000000],
    zoom: 4,
  }),
});
