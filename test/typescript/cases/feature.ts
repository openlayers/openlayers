import Feature from '../../../build/ol/Feature.js';
import Point from '../../../build/ol/geom/Point.js';

export const feature = new Feature<Point, {foo: 'bar'}>({
  geometry: new Point([0, 0]),
  // @ts-expect-error We are intentionally breaking types here to test and expecting an error
  foo: 'foo',
});

// @ts-expect-error We are intentionally breaking types here to test and expecting an error
feature.setProperties({foo: 1});
feature.setProperties({foo: 'bar'});

export const untypedFeature = new Feature({
  geometry: new Point([0, 0]),
  foo: 'foo',
});

untypedFeature.setProperties({foo: 1});
untypedFeature.setProperties({foo: 'bar'});
