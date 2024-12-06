import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

/**
 * This is a properly oriented polygon.  The exterior ring is oriented counterclockwise
 * and the interior rings (holes) are oriented clockwise.  This follows the "Right Hand Rule."
 */
const data = {
  type: 'Polygon',
  coordinates: [
    [
      [-170, -80],
      [170, -80],
      [170, 80],
      [-170, 80],
      [-170, -80],
    ],
    [
      [-150, -60],
      [-150, 60],
      [-30, 60],
      [-30, -60],
      [-150, -60],
    ],
    [
      [30, -60],
      [30, 60],
      [150, 60],
      [150, -60],
      [30, -60],
    ],
  ],
};

const format = new GeoJSON({featureProjection: 'EPSG:3857'});

new Map({
  layers: [
    new WebGLVectorLayer({
      source: new VectorSource({
        features: format.readFeatures(data),
      }),
      style: {
        'fill-color': '#ddd',
        'stroke-color': 'red',
        'stroke-width': 2,
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message: 'Holes are properly rendered',
});
