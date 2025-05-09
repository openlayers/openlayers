import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

useGeographic();

const format = new GeoJSON();
const features = format.readFeatures({
  type: 'FeatureCollection',
  features: [
    {
      // for case 1: initially placed geometries should be transformed properly
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, -65],
            [100, 0],
            [0, 65],
            [-100, 0],
            [0, -65],
          ],
        ],
      },
    },
    {
      // for case 2: geometries changed after initial rendering should be transformed properly too
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, -65],
            [100, 0],
            [0, 65],
            [-100, 0],
            [0, -65],
          ],
        ],
      },
    },
  ],
});

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features,
  }),
  style: {
    'fill-color': '#ddd',
    'stroke-color': '#00AAFF',
    'stroke-width': 1,
  },
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

map.once('rendercomplete', function () {
  // case2: update geometry after initial rendering
  features[1].setGeometry(
    new Polygon([
      [
        [-100, 65],
        [0, 65],
        [-100, 0],
        [-100, 65],
      ],
    ]),
  );
  map.renderSync();

  render({
    message:
      'Geometries using geographic coordinates are always transformed properly',
  });
});
