/* eslint-disable prettier/prettier */
import ImageLayer from '../../../../src/ol/layer/Image.js';
import ImageStatic from '../../../../src/ol/source/ImageStatic.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
// eslint-disable-next-line sort-imports-es6-autofix/sort-imports-es6
import Projection from '../../../../src/ol/proj/Projection.js';
import { getCenter } from '../../../../src/ol/extent.js';

const extent = [0, 0, 60000, 40000];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});

new Map({
  layers: [
    new ImageLayer({
      source: new ImageStatic({
        attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
        url: 'https://test-1309221889.cos.ap-guangzhou.myqcloud.com/qhj/test-svg/test.svg',
        projection: projection,
        imageExtent: extent,
        imageSize: [800, 600]
      }),
      extent: extent,
    }),
  ],
  target: 'map',
  view: new View({
    projection: projection,
    center: getCenter(extent),
    zoom: 1,
  }),
});

render();
