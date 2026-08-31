import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const visible = new Feature({
    geometry: new Point([0, 0]),
    text: 'ATLAS',
    size: 32,
  });
  const features = [visible];
  // These labels lose declutter to the first one, but they are still laid out.
  // Distinct, increasingly large fonts deterministically grow the shared atlas
  // after ATLAS has copied its texel rectangle into a glyph instance.
  for (let i = 0; i < 60; ++i) {
    features.push(
      new Feature({
        geometry: new Point([0, 0]),
        text: String(i),
        size: 48 + i,
      }),
    );
  }

  const layer = new WebGPUVectorLayer({
    source: new VectorSource({features}),
    declutter: true,
    style: (feature) =>
      new Style({
        text: new Text({
          text: feature.get('text'),
          font: `bold ${feature.get('size')}px sans-serif`,
          fill: new Fill({color: '#111'}),
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
    const renderer = layer.getRenderer();
    if (
      !renderer?.helper ||
      !renderer.buffers_?.commands?.length ||
      renderer.atlas_.getCanvas().width === 512
    ) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'A label laid out before font atlas growth remains legible',
      tolerance: 0.02,
    });
  });
}
