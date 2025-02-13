import Feature, {FeatureLike} from '../../../build/ol/Feature.js';
import Point from '../../../build/ol/geom/Point.js';
import VectorLayer, {
  Options as VectorLayerOptions,
} from '../../../build/ol/layer/Vector.js';
import VectorSource from '../../../build/ol/source/Vector.js';

const options: VectorLayerOptions<VectorSource<Feature<Point>>> = {
  source: new VectorSource({
    features: [new Feature(new Point([0, 0]))],
  }),
};
export const layer1 = new VectorLayer(options);

export const layer2: VectorLayer<VectorSource<Feature<Point>>> =
  new VectorLayer({
    source: new VectorSource({
      features: [new Feature(new Point([0, 0]))],
    }),
  });

const createLayer = <F extends FeatureLike>(
  options?: VectorLayerOptions<VectorSource<F>>,
) => new VectorLayer<VectorSource<F>>(options);

export const layer3 = createLayer({
  source: new VectorSource({
    features: [new Feature(new Point([0, 0]))],
  }),
});
