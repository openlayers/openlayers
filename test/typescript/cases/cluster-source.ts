import Feature from '../../../src/ol/Feature.js';
import Geometry from '../../../src/ol/geom/Geometry.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import ClusterSource from '../../../src/ol/source/Cluster.js';
import VectorSource from '../../../src/ol/source/Vector.js';

export const layer1: VectorLayer<ClusterSource<Feature<Geometry>>> =
  new VectorLayer({
    source: new ClusterSource({
      distance: 10,
      source: new VectorSource({
        features: [new Feature(new Point([0, 0]))],
      }),
    }),
  });

export const layer2: VectorLayer<ClusterSource<Feature<Point>>> =
  new VectorLayer({
    source: new ClusterSource({
      distance: 10,
      source: new VectorSource({
        features: [new Feature(new Point([0, 0]))],
      }),
    }),
  });
