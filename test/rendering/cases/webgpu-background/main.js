import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUTileLayer from '../../../../src/ol/layer/WebGPUTile.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  // Tiles on the left half only, so the tile layer's background shows on the
  // right. The vector layer shares the canvas and paints second, so its
  // background has to be composited over the tiles rather than cleared.
  const tiles = new WebGPUTileLayer({
    extent: [-20037508.34, -20037508.34, 0, 20037508.34],
    background: 'rgba(255, 200, 0, 0.8)',
    opacity: 0.75,
    source: new XYZ({
      url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      transition: 0,
    }),
  });

  const half = 5e6;
  const vector = new WebGPUVectorLayer({
    background: 'rgba(0, 0, 255, 0.5)',
    opacity: 0.5,
    source: new VectorSource({
      features: [
        new Feature(
          new Polygon([
            [
              [-half, -half],
              [half, -half],
              [half, half],
              [-half, half],
              [-half, -half],
            ],
          ]),
        ),
      ],
    }),
    style: {
      'fill-color': '#fff',
    },
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [tiles, vector],
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!tiles.getRenderer()?.helper || !vector.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      tolerance: 0.01,
      message: 'Backgrounds of WebGPU layers sharing a canvas are composited',
    });
  });
}
