import ImageLayer from '../../../../src/ol/layer/Image.js';
import ImageStatic from '../../../../src/ol/source/ImageStatic.js';
import Map from '../../../../src/ol/Map.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import View from '../../../../src/ol/View.js';

const extent = [0, -33614, 52354, 0];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});

new Map({
  layers: [
    new ImageLayer({
      source: new ImageStatic({
        url: '/data/cross-big.svg',
        projection: projection,
        imageExtent: extent,
      }),
      extent: extent,
    }),
  ],
  target: 'map',
  view: new View({
    projection: projection,
    center: [290, -290],
    zoom: 6,
  }),
});

render();
