import Feature from '../../../build/ol/Feature.js';
import Map from '../../../build/ol/Map.js';
import Point from '../../../build/ol/geom/Point.js';
import type Layer from '../../../build/ol/layer/Layer.js';

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

const map = new Map();

map.getFeaturesAtPixel([0, 0], {
  layerFilter: (layer) => layer.getProperties().foo === 'bar',
});

map.getFeaturesAtPixel([0, 0], {
  layerFilter: (layer) =>
    //@ts-expect-error Should fail because of layer properties generic
    (layer as Layer<any, any, {foo: 'foo'}>).getProperties().foo === 'bar',
});
