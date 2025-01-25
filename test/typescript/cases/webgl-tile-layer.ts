import WebGLTileLayer from '../../../build/ol/layer/WebGLTile.js';
import ImageTileSource from '../../../build/ol/source/ImageTile.js';

new WebGLTileLayer({
  source: new ImageTileSource({
    url: 'http://example.com/tiles/{z}/{x}/{y}.png',
    wrapX: true,
  }),
});
