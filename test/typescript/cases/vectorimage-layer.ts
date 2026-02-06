import Feature, {FeatureLike} from '../../../build/ol/Feature.js';
import Point from '../../../build/ol/geom/Point.js';
import {LineString} from '../../../build/ol/geom.js';
import VectorImageLayer, {
  Options as VectorImageLayerOptions,
} from '../../../build/ol/layer/VectorImage.js';
import VectorSource from '../../../build/ol/source/Vector.js';

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
