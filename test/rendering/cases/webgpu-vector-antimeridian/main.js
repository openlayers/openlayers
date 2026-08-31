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
  // Wide enough to appear in the world either side of the antimeridian. A
  // source that wraps hands such a feature to the renderer once per world, and
  // drawing it twice shows as a darker fill.
  const ring = [];
  for (let lon = -170; lon <= 170; lon += 10) {
    ring.push(fromLonLat([lon, 40]));
  }
  for (let lon = 170; lon >= -170; lon -= 10) {
    ring.push(fromLonLat([lon, -40]));
  }
  ring.push(ring[0]);

  const vector = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [new Feature(new Polygon([ring]))],
    }),
    style: {
      'fill-color': 'rgba(0, 170, 255, 0.5)',
    },
  });

  const map = new Map({
    layers: [vector],
    target: 'map',
    view: new View({
      center: fromLonLat([180, 0]),
      zoom: 0,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    // The device arrives a frame or two after the first one is complete, and
    // with no tiles to load nothing else asks for another.
    if (!vector.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      // Loose enough for another GPU's edge antialiasing. Filling twice
      // darkens the whole polygon, which is a tenth of the image.
      tolerance: 0.02,
      message: 'A polygon across the antimeridian is filled once, not twice',
    });
  });
}
