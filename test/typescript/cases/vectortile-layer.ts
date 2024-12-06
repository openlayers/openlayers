import Feature from '../../../src/ol/Feature.js';
import {MVT} from '../../../src/ol/format.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';
import {toFeature} from '../../../src/ol/render/Feature.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {OGCVectorTile as OGCVectorTileSource} from '../../../src/ol/source.js';

const options = {
  source: new VectorTileSource({
    format: new MVT(),
  }),
};
const layer1 = new VectorTileLayer(options);
toFeature(layer1.getFeaturesInExtent([0, 0, 1, 1])[0]);

const layer2: VectorTileLayer<VectorTileSource<Feature<Point>>> =
  new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT({featureClass: Feature}),
    }),
  });
layer2.getFeaturesInExtent([0, 0, 1, 1])[0].getGeometry().getCoordinates();

const layer3: VectorTileLayer<VectorTileSource<Feature<Point>>> =
  new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT({featureClass: Feature}),
    }),
  });
layer3.getFeaturesInExtent([0, 0, 1, 1])[0].getGeometry().getCoordinates();

const layer4: VectorTileLayer<VectorTileSource<Feature<Point>>> =
  new VectorTileLayer({
    source: new OGCVectorTileSource({
      format: new MVT({featureClass: Feature}),
      url: 'http://example.com',
    }),
  });
layer4.getFeaturesInExtent([0, 0, 1, 1])[0].getGeometry().getCoordinates();
