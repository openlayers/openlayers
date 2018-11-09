import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import {Vector as VectorLayer, Tile as TileLayer} from '../../../src/ol/layer.js';
import {Vector as VectorSource, OSM} from '../../../src/ol/source.js';
import Point from '../../../src/ol/geom/Point.js';
import Feature from '../../../src/ol/Feature.js';
import {fromLonLat} from '../../../src/ol/proj.js';

const center = fromLonLat([-111, 45.7]);

new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(
            new Point(center)
          )
        ]
      })
    })
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 4
  })
});

render();
