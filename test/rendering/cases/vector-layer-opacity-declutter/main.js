import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {Polygon} from '../../../../src/ol/geom.js';
import {Vector as VectorLayer} from '../../../../src/ol/layer.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import {Vector as VectorSource} from '../../../../src/ol/source.js';

const center = fromLonLat([8.6, 50.2]);

const geometry = new Polygon([
  [
    [center[0] - 10000, center[1] - 10000],
    [center[0] + 10000, center[1] - 10000],
    [center[0] + 10000, center[1] + 10000],
    [center[0] - 10000, center[1] + 10000],
    [center[0] - 10000, center[1] - 10000],
  ],
]);

const map = new Map({
  layers: [
    new VectorLayer({
      opacity: 0.9,
      declutter: true,
      style: {
        'stroke-color': 'red',
        'stroke-width': 3,
      },
      source: new VectorSource({
        features: [new Feature(geometry)],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 9,
  }),
});

map.once('rendercomplete', function () {
  map.getView().setCenter(fromLonLat([8.5, 50.1]));
  map.renderSync();
  render();
});
