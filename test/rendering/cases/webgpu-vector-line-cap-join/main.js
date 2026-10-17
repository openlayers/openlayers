import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  /**
   * @param {Array<Array<number>>} coordinates Coordinates.
   * @param {string} kind Kind.
   * @return {Feature} Feature.
   */
  function line(coordinates, kind) {
    return new Feature({geometry: new LineString(coordinates), kind});
  }

  const features = [
    line(
      [
        [-112, 82],
        [-45, 82],
      ],
      'butt',
    ),
    line(
      [
        [-112, 48],
        [-45, 48],
      ],
      'square',
    ),
    line(
      [
        [-112, 14],
        [-45, 14],
      ],
      'round-cap',
    ),
    line(
      [
        [-20, 88],
        [12, 50],
        [44, 88],
      ],
      'bevel',
    ),
    line(
      [
        [55, 88],
        [87, 50],
        [119, 88],
      ],
      'round-join',
    ),
    line(
      [
        [-20, 10],
        [12, -40],
        [44, 10],
      ],
      'miter',
    ),
    line(
      [
        [55, 10],
        [87, -40],
        [119, 10],
      ],
      'limited-miter',
    ),
    new Feature({
      geometry: new Polygon([
        [
          [-105, -35],
          [-70, -88],
          [-35, -35],
          [-105, -35],
        ],
      ]),
      kind: 'closed-round',
    }),
  ];

  const style = (kind, color, lineCap, lineJoin, miterLimit) => ({
    filter: ['==', ['get', 'kind'], kind],
    style: {
      'stroke-color': color,
      'stroke-width': 14,
      'stroke-line-cap': lineCap,
      'stroke-line-join': lineJoin,
      'stroke-miter-limit': miterLimit,
    },
  });
  const layer = new WebGPUVectorLayer({
    source: new VectorSource({features}),
    style: [
      style('butt', 'rgba(225,29,72,0.75)', 'butt', 'round', 10),
      style('square', 'rgba(22,163,74,0.75)', 'square', 'round', 10),
      style('round-cap', 'rgba(37,99,235,0.75)', 'round', 'round', 10),
      style('bevel', 'rgba(225,29,72,0.75)', 'butt', 'bevel', 10),
      style('round-join', 'rgba(37,99,235,0.75)', 'butt', 'round', 10),
      style('miter', 'rgba(22,163,74,0.75)', 'butt', 'miter', 10),
      style('limited-miter', 'rgba(245,158,11,0.75)', 'butt', 'miter', 1),
      style('closed-round', 'rgba(124,58,237,0.5)', 'square', 'round', 10),
    ],
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
    const renderer = layer.getRenderer();
    if (!renderer?.helper || !renderer.buffers_?.commands?.length) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'WebGPU renders butt, square, and round caps and bevel, round, and limited miter joins',
      tolerance: 0.02,
    });
  });
}
