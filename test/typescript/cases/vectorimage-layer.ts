import Feature, {FeatureLike} from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorImageLayer, {
  Options as VectorImageLayerOptions,
} from '../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import {LineString} from '../../../src/ol/geom.js';

const options: VectorImageLayerOptions<VectorSource<Feature<Point>>> = {
  source: new VectorSource({
    features: [new Feature(new Point([0, 0]))],
  }),
};
export const layer1 = new VectorImageLayer(options);

export const layer2: VectorImageLayer<VectorSource<Feature<Point>>> =
  new VectorImageLayer({
    source: new VectorSource({
      features: [new Feature(new Point([0, 0]))],
    }),
  });

const createLayer = <F extends FeatureLike>(
  options?: VectorImageLayerOptions<VectorSource<F>>,
) => new VectorImageLayer<VectorSource<F>>(options);

export const layer3 = createLayer({
  source: new VectorSource({
    features: [new Feature(new LineString([0, 0]))],
  }),
});
