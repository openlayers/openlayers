import Feature, {FeatureLike} from '../../../build/ol/Feature.js';
import Point from '../../../build/ol/geom/Point.js';

export const feature = new Feature<Point, { foo: 'bar' }>({
    geometry: new Point([0, 0]),
    // @ts-expect-error We are intentionally breaking types here to test and expecting an error
    foo: 'foo',
});

// @ts-expect-error We are intentionally breaking types here to test and expecting an error
feature.setProperties({foo: 1});
feature.setProperties({foo: 'bar'});