import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const center = [13.4, 52.5];
  const radius = 0.0005;
  const feature = new Feature(
    new Polygon([
      [
        [center[0] - radius, center[1] - radius],
        [center[0] + radius, center[1] - radius],
        [center[0] + radius, center[1] + radius],
        [center[0] - radius, center[1] + radius],
        [center[0] - radius, center[1] - radius],
      ],
    ]),
  );
  const source = new VectorSource({features: [feature]});
  source.setProjection('EPSG:4326');
  const layer = new WebGPUVectorLayer({
    source,
    style: [
      {'fill-color': '#263238'},
      {
        'fill-color': '#7e57c2',
        'fill-displacement': [-16, -16],
        'fill-displacement-anchor': 'viewport',
      },
    ],
  });
  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: fromLonLat(center),
      resolution: 2,
      rotation: Math.PI / 6,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.buffers_) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'a reprojected fill is displaced after GPU warping',
      tolerance: 0.02,
    });
  });
}
