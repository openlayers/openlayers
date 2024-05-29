import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {MVT} from '../../../src/ol/format.js';
import {toFeature} from '../../../src/ol/render/Feature.js';

const options = {
  source: new VectorTileSource({
    format: new MVT(),
  }),
};
const layer1 = new VectorTileLayer(options);
export const feature = toFeature(
  layer1.getSource().getFeaturesInExtent([0, 0, 1, 1])[0],
);

const layer2: VectorTileLayer<Feature<Point>> = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT({featureClass: Feature}),
  }),
});
const features = layer2.getSource().getFeaturesInExtent([0, 0, 1, 1]);
export const coordinates = features[0].getGeometry().getCoordinates();
