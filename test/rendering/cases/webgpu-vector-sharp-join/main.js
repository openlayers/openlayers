import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const layer = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature(
          new LineString([
            [171, 188],
            [152, 169],
            [80, 140],
            [185, 131],
          ]),
        ),
        new Feature(
          new LineString([
            [24, 112],
            [80, 140],
          ]),
        ),
      ],
    }),
    style: [
      {
        'z-index': 0,
        'stroke-color': '#d9d9d9',
        'stroke-width': 48,
        'stroke-line-cap': 'butt',
        'stroke-line-join': 'round',
      },
      {
        'z-index': 1,
        'stroke-color': '#1d4ed8',
        'stroke-width': 36,
        'stroke-line-cap': 'butt',
        'stroke-line-join': 'round',
      },
    ],
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: [128, 150],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    const renderer = layer.getRenderer();
    if (!renderer?.helper || !renderer.buffers_?.commands?.length) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'A sharp round join stays inside its casing instead of covering the inner stroke',
    });
  });
}
