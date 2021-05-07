import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';

describe('ol.render.Feature', function () {
  const type = 'Point';
  const flatCoordinates = [0, 0];
  const ends = null;
  const properties = {foo: 'bar'};

  describe('Constructor', function () {
    it('creates an instance', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature).to.be.a(RenderFeature);
    });
  });

  describe('#get()', function () {
    it('returns a single property', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.get('foo')).to.be('bar');
    });
  });

  describe('#getEnds()', function () {
    it('returns the ends it was created with', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getEnds()).to.equal(ends);
    });
  });

  describe('#getExtent()', function () {
    it('returns the correct extent for a point', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getExtent()).to.eql([0, 0, 0, 0]);
    });

    it('caches the extent', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getExtent()).to.equal(feature.extent_);
    });

    it('returns the correct extent for a linestring', function () {
      const feature = new RenderFeature('LineString', [-1, -2, 2, 1], null, {});
      expect(feature.getExtent()).to.eql([-1, -2, 2, 1]);
    });
  });

  describe('#getFlatCoordinates()', function () {
    it('returns the flat coordinates it was created with', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getFlatCoordinates()).to.equal(flatCoordinates);
    });
  });

  describe('#getFlatInteriorPoint()', function () {
    it('returns correct point and caches it', function () {
      const polygon = new Polygon([
        [
          [0, 0],
          [0, 10],
          [10, 10],
          [10, 0],
          [0, 0],
        ],
      ]);
      const feature = new RenderFeature(
        'Polygon',
        polygon.getOrientedFlatCoordinates(),
        polygon.getEnds()
      );
      expect(feature.getFlatInteriorPoint()).to.eql([5, 5, 10]);
      expect(feature.getFlatInteriorPoint()).to.be(feature.flatInteriorPoints_);
    });
  });

  describe('#getFlatInteriorPoints()', function () {
    it('returns correct points and caches them', function () {
      const polygon = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 10],
            [10, 10],
            [10, 0],
            [0, 0],
          ],
        ],
        [
          [
            [10, 0],
            [10, 10],
            [20, 10],
            [20, 0],
            [10, 0],
          ],
        ],
      ]);
      const feature = new RenderFeature(
        'MultiPolygon',
        polygon.getOrientedFlatCoordinates(),
        polygon.getEndss()
      );
      expect(feature.getFlatInteriorPoints()).to.eql([5, 5, 10, 15, 5, 10]);
      expect(feature.getFlatInteriorPoints()).to.be(
        feature.flatInteriorPoints_
      );
    });
  });

  describe('#getFlatMidpoint()', function () {
    it('returns correct point', function () {
      const line = new LineString([
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
        [0, 0],
      ]);
      const feature = new RenderFeature(
        'LineString',
        line.getFlatCoordinates()
      );
      expect(feature.getFlatMidpoint()).to.eql([10, 10]);
      expect(feature.getFlatMidpoint()).to.eql(feature.flatMidpoints_);
    });
  });

  describe('#getFlatMidpoints()', function () {
    it('returns correct points and caches them', function () {
      const line = new MultiLineString([
        [
          [0, 0],
          [0, 10],
          [10, 10],
          [10, 0],
          [0, 0],
        ],
        [
          [10, 0],
          [10, 10],
          [20, 10],
          [20, 0],
          [10, 0],
        ],
      ]);
      const feature = new RenderFeature(
        'MultiLineString',
        line.getFlatCoordinates(),
        line.getEnds()
      );
      expect(feature.getFlatMidpoints()).to.eql([10, 10, 20, 10]);
      expect(feature.getFlatMidpoints()).to.be(feature.flatMidpoints_);
    });
  });

  describe('#getGeometry()', function () {
    it('returns itself as geometry', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getGeometry()).to.equal(feature);
    });
  });

  describe('#getId()', function () {
    it('returns the feature id', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getId()).to.be('foo');
    });
  });

  describe('#getProperties()', function () {
    it('returns the properties it was created with', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getProperties()).to.equal(properties);
    });
  });

  describe('#getSimplifiedGeometry()', function () {
    it('returns itself as simplified geometry', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getSimplifiedGeometry()).to.equal(feature);
    });
  });

  describe('#getStride()', function () {
    it('returns 2', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getStride()).to.be(2);
    });
  });

  describe('#getStyleFunction()', function () {
    it('returns undefined', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getStyleFunction()).to.be(undefined);
    });
  });

  describe('#getType()', function () {
    it('returns the type it was created with', function () {
      const feature = new RenderFeature(
        type,
        flatCoordinates,
        ends,
        properties,
        'foo'
      );
      expect(feature.getType()).to.equal(type);
    });
  });
});
