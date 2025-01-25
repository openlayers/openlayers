import Feature from '../../../build/ol/Feature.js';
import Point from '../../../build/ol/geom/Point.js';
import {Geometry} from '../../../build/ol/geom.js';
import Snap from '../../../build/ol/interaction/Snap.js';
import VectorLayer from '../../../build/ol/layer/Vector.js';
import VectorSource from '../../../build/ol/source/Vector.js';

const firstSource: VectorSource<Feature<Point>> = new VectorSource();

export const secondSource: VectorSource = firstSource; // secondSource is less specific

firstSource.getFeatures()?.[0].getGeometry(); // point is of type Point
secondSource.getFeatures()?.[0].getGeometry(); // point is of type Geometry

export function testFunction(inputSource: VectorSource<Feature<Point>>) {
  return new Snap({
    source: inputSource, // source property is less specific
  });
}

export const layer: VectorLayer<VectorSource<Feature<Geometry>>> =
  new VectorLayer({
    source: firstSource, // source property is less specific
  });
