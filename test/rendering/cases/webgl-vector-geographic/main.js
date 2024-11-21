import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Map from '../../../../src/ol/Map.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';
import {useGeographic} from '../../../../src/ol/proj.js';

useGeographic();

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      style: {
        'fill-color': '#ddd',
        'stroke-color': '#00AAFF',
        'stroke-width': 1,
      },
    });
  }
}

const format = new GeoJSON();
const features = format.readFeatures({
  type: 'FeatureCollection',
  features: [
    {
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

const vector = new WebGLLayer({
  source: new VectorSource({
    features,
  }),
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message:
    'Geometries using geographic coordinates are transformed before rendering',
});
