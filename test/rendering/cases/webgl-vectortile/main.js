import MVT from '../../../../src/ol/format/MVT.js';
import Map from '../../../../src/ol/Map.js';
import VectorTile from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorTileLayerRenderer from '../../../../src/ol/renderer/webgl/VectorTileLayer.js';
import {asArray} from '../../../../src/ol/color.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {packColor} from '../../../../src/ol/renderer/webgl/shaders.js';

class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      className: this.getClassName(),
      fill: {
        attributes: {
          color: () => packColor(asArray('#eee')),
          opacity: () => 1,
        },
      },
      stroke: {
        attributes: {
          color: () => packColor(asArray('#888')),
          opacity: () => 0.5,
          width: () => 1,
        },
      },
    });
  }
}

const map = new Map({
  layers: [
    new WebGLVectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: createXYZ(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 14,
  }),
});

map.getView().setRotation(Math.PI / 4);
render({message: 'Vector tile layer rotates', tolerance: 0.01});
