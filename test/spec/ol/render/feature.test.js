import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import RenderFeature from '../../../../src/ol/render/Feature.js';


describe('ol.render.Feature', () => {
  const type = 'Point';
  const flatCoordinates = [0, 0];
  const ends = null;
  const properties = {foo: 'bar'};

  describe('Constructor', () => {
    test('creates an instance', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature).toBeInstanceOf(RenderFeature);
    });
  });

  describe('#get()', () => {
    test('returns a single property', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.get('foo')).toBe('bar');
    });
  });

  describe('#getEnds()', () => {
    test('returns the ends it was created with', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getEnds()).toBe(ends);
    });
  });

  describe('#getExtent()', () => {
    test('returns the correct extent for a point', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getExtent()).toEqual([0, 0, 0, 0]);
    });

    test('caches the extent', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getExtent()).toBe(feature.extent_);
    });

    test('returns the correct extent for a linestring', () => {
      const feature = new RenderFeature('LineString', [-1, -2, 2, 1], null, {});
      expect(feature.getExtent()).toEqual([-1, -2, 2, 1]);
    });
  });

  describe('#getFlatCoordinates()', () => {
    test('returns the flat coordinates it was created with', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getFlatCoordinates()).toBe(flatCoordinates);
    });
  });

  describe('#getFlatInteriorPoint()', () => {
    test('returns correct point and caches it', () => {
      const polygon = new Polygon([[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]);
      const feature = new RenderFeature('Polygon', polygon.getOrientedFlatCoordinates(),
        polygon.getEnds());
      expect(feature.getFlatInteriorPoint()).toEqual([5, 5, 10]);
      expect(feature.getFlatInteriorPoint()).toBe(feature.flatInteriorPoints_);
    });
  });

  describe('#getFlatInteriorPoints()', () => {
    test('returns correct points and caches them', () => {
      const polygon = new MultiPolygon([
        [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
        [[[10, 0], [10, 10], [20, 10], [20, 0], [10, 0]]]
      ]);
      const feature = new RenderFeature('MultiPolygon', polygon.getOrientedFlatCoordinates(),
        polygon.getEndss());
      expect(feature.getFlatInteriorPoints()).toEqual([5, 5, 10, 15, 5, 10]);
      expect(feature.getFlatInteriorPoints()).toBe(feature.flatInteriorPoints_);
    });
  });

  describe('#getFlatMidpoint()', () => {
    test('returns correct point', () => {
      const line = new LineString([[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]);
      const feature = new RenderFeature('LineString', line.getFlatCoordinates());
      expect(feature.getFlatMidpoint()).toEqual([10, 10]);
      expect(feature.getFlatMidpoint()).toEqual(feature.flatMidpoints_);
    });
  });

  describe('#getFlatMidpoints()', () => {
    test('returns correct points and caches them', () => {
      const line = new MultiLineString([
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
        [[10, 0], [10, 10], [20, 10], [20, 0], [10, 0]]
      ]);
      const feature = new RenderFeature('MultiLineString', line.getFlatCoordinates(),
        line.getEnds());
      expect(feature.getFlatMidpoints()).toEqual([10, 10, 20, 10]);
      expect(feature.getFlatMidpoints()).toBe(feature.flatMidpoints_);
    });
  });

  describe('#getGeometry()', () => {
    test('returns itself as geometry', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getGeometry()).toBe(feature);
    });
  });

  describe('#getId()', () => {
    test('returns the feature id', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getId()).toBe('foo');
    });
  });

  describe('#getProperties()', () => {
    test('returns the properties it was created with', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getProperties()).toBe(properties);
    });
  });

  describe('#getSimplifiedGeometry()', () => {
    test('returns itself as simplified geometry', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getSimplifiedGeometry()).toBe(feature);
    });
  });

  describe('#getStride()', () => {
    test('returns 2', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getStride()).toBe(2);
    });
  });

  describe('#getStyleFunction()', () => {
    test('returns undefined', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getStyleFunction()).toBe(undefined);
    });
  });

  describe('#getType()', () => {
    test('returns the type it was created with', () => {
      const feature = new RenderFeature(type, flatCoordinates, ends, properties, 'foo');
      expect(feature.getType()).toBe(type);
    });
  });

});
