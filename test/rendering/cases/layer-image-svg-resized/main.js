import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import View from '../../../../src/ol/View.js';

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new ImageLayer({
      source: new Static({
        url: '/data/cross.svg',
        imageExtent: [-100, -100, 100, 100],
        imageSize: [200, 200],
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
