import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';

export const layer: VectorLayer<Feature<Point>> = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(new Point([0, 0]))],
  }),
});
