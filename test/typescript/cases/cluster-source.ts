import Feature from '../../../build/ol/Feature.js';
import Geometry from '../../../build/ol/geom/Geometry.js';
import Point from '../../../build/ol/geom/Point.js';
import VectorLayer from '../../../build/ol/layer/Vector.js';
import ClusterSource from '../../../build/ol/source/Cluster.js';
import VectorSource from '../../../build/ol/source/Vector.js';

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
