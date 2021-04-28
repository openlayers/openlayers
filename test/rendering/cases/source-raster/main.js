import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const raster = new RasterSource({
  sources: [
    new XYZ({
      url: '/data/tiles/osm/{z}/{x}/{y}.png',
      transition: 0,
    }),
  ],
  threads: 0, // Avoid using workers to work with puppeteer
  operation: function (pixels) {
    const pixel = pixels[0];
    const red = pixel[0];
    pixel[0] = pixel[2];
    pixel[2] = red;
    return pixel;
  },
});

new Map({
  layers: [new ImageLayer({source: raster})],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render();
