import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  /**
   * @param {number} x Center x.
   * @param {number} y Center y.
   * @param {number} [radius] Half the side length.
   * @return {Feature} Square polygon.
   */
  function square(x, y, radius = 28) {
    return new Feature(
      new Polygon([
        [
          [x - radius, y - radius],
          [x + radius, y - radius],
          [x + radius, y + radius],
          [x - radius, y + radius],
          [x - radius, y - radius],
        ],
      ]),
    );
  }

  /**
   * @param {Feature} feature Feature.
   * @param {string|Object} color Top fill color or pattern.
   * @param {'map'|'viewport'} anchor Displacement anchor.
   * @return {WebGPUVectorLayer} Layer with an offset fill over a dark base.
   */
  function displacedLayer(feature, color, anchor) {
    const topStyle =
      typeof color === 'string'
        ? {'fill-color': color}
        : {
            'fill-pattern-src': color.src,
            'fill-pattern-size': [64, 64],
            'fill-pattern-offset': [0, 0],
            'fill-pattern-offset-origin': 'top-left',
          };
    return new WebGPUVectorLayer({
      source: new VectorSource({features: [feature]}),
      style: [
        {'fill-color': '#263238'},
        {
          ...topStyle,
          'fill-displacement': [-12, -12],
          'fill-displacement-anchor': anchor,
        },
      ],
    });
  }

  const layers = [
    displacedLayer(square(-60, 50), '#ef6c00', 'map'),
    displacedLayer(square(60, 50), '#00897b', 'viewport'),
    displacedLayer(
      square(0, -65),
      {
        src: '/data/fish.png',
      },
      'viewport',
    ),
  ];
  const hitFeature = square(65, -65, 8);
  const hitLayer = new WebGPUVectorLayer({
    source: new VectorSource({features: [hitFeature]}),
    style: {
      'fill-color': '#1565c0',
      'fill-displacement': [24, 0],
      'fill-displacement-anchor': 'viewport',
    },
  });
  layers.push(hitLayer);

  const map = new Map({
    pixelRatio: 1,
    layers,
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
      rotation: Math.PI / 4,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (layers.some((layer) => !layer.getRenderer()?.buffers_)) {
      return;
    }
    const originalPixel = map.getPixelFromCoordinateInternal([65, -65]);
    const shiftedPixel = [originalPixel[0] + 24, originalPixel[1]];
    const originalHit = map.forEachFeatureAtPixel(originalPixel, (feature) => {
      return feature;
    });
    const shiftedHit = map.forEachFeatureAtPixel(shiftedPixel, (feature) => {
      return feature;
    });
    if (originalHit || shiftedHit !== hitFeature) {
      throw new Error('Fill hit detection does not match its displacement');
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'map- and viewport-anchored solid and pattern fills are displaced',
      tolerance: 0.02,
    });
  });
}
