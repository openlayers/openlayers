import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

import Feature from 'ol/Feature.js';
import Polygon from 'ol/geom/Polygon.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          // Feature expects a Geometry
          new Feature(
            // Polygon expects coordinates as an array of linear rings
            new Polygon([
              // the first (and in this case only) linear ring
              [
                [-1000000, 5000000], // actual coordinates...
                [3000000, 5000000],
                [3000000, 7000000],
                [-1000000, 7000000],
                [-1000000, 5000000], // first coordinate repeated
              ],
            ]),
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
