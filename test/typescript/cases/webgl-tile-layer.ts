import ImageTileSource from '../../../src/ol/source/ImageTile.js';
import WebGLTileLayer from '../../../src/ol/layer/WebGLTile.js';

new WebGLTileLayer({
  source: new ImageTileSource({
    url: 'http://example.com/tiles/{z}/{x}/{y}.png',
    wrapX: true,
  }),
});
