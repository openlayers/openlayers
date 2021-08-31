import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import View from '../../../../src/ol/View.js';
import {Icon, Style} from '../../../../src/ol/style.js';
import {Vector as VectorLayer} from '../../../../src/ol/layer.js';
import {Vector as VectorSource} from '../../../../src/ol/source.js';

const center = [0, 0];

new Map({
  pixelRatio: 2,
  layers: [
    new VectorLayer({
      style: function () {
        return new Style({
          image: new Icon({
            src: '/data/sprites/gis_symbols.png',
            color: [255, 0, 0, 1],
            offset: [32, 0],
            size: [32, 32],
          }),
        });
      },
      source: new VectorSource({
        features: [new Feature(new Point(center))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 2,
  }),
});

render();
