import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const layer = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature({
          geometry: new Point([0, 36]),
          name: 'ⵍⵣⵣⴰⵢⴻⵔ الجزائر',
        }),
        new Feature({
          geometry: new Point([0, -36]),
          name: 'أدرار ⴰⴷⵔⴰⵔ',
        }),
      ],
    }),
    style: (feature) =>
      new Style({
        text: new Text({
          text: feature.get('name'),
          font: 'bold 22px sans-serif',
          fill: new Fill({color: '#222'}),
          stroke: new Stroke({color: '#fff', width: 3}),
          textAlign: 'center',
        }),
      }),
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'Tifinagh and Arabic labels keep graphemes and shaped runs',
      tolerance: 0.02,
    });
  });
}
