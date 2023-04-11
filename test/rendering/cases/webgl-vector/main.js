import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
    });
  }
}

const vector = new WebGLLayer({
  source: new VectorSource({
    url: '/data/countries.json',
    format: new GeoJSON(),
  }),
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

render({
  message:
    'Countries are rendered as grey polygons using webgl and default shaders',
});
