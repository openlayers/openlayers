goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.render.Feature');


describe('ol.render.Feature', function() {

  var renderFeature;
  var type = 'Point';
  var flatCoordinates = [0, 0];
  var ends = null;
  var properties = {foo: 'bar'};

  describe('Constructor', function() {
    it('creates an instance', function() {
      renderFeature =
          new ol.render.Feature(type, flatCoordinates, ends, properties, 'foo');
      expect(renderFeature).to.be.a(ol.render.Feature);
    });
  });

  describe('#get()', function() {
    it('returns a single property', function() {
      expect(renderFeature.get('foo')).to.be('bar');
    });
  });

  describe('#getEnds()', function() {
    it('returns the ends it was created with', function() {
      expect(renderFeature.getEnds()).to.equal(ends);
    });
  });

  describe('#getExtent()', function() {
    it('returns the correct extent for a point', function() {
      expect(renderFeature.getExtent()).to.eql([0, 0, 0, 0]);
    });
    it('caches the extent', function() {
      expect(renderFeature.getExtent()).to.equal(renderFeature.extent_);
    });
    it('returns the correct extent for a linestring', function() {
      var feature =
          new ol.render.Feature('LineString', [-1, -2, 2, 1], null, {});
      expect(feature.getExtent()).to.eql([-1, -2, 2, 1]);
    });
  });

  describe('#getFlatCoordinates()', function() {
    it('returns the flat coordinates it was created with', function() {
      expect(renderFeature.getFlatCoordinates()).to.equal(flatCoordinates);
    });
  });

  describe('#getFlatInteriorPoint()', function() {
    it('returns correct point and caches it', function() {
      var polygon = new ol.geom.Polygon([[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]);
      var feature = new ol.render.Feature('Polygon', polygon.getOrientedFlatCoordinates(),
          polygon.getEnds());
      expect(feature.getFlatInteriorPoint()).to.eql([5, 5, 10]);
      expect(feature.getFlatInteriorPoint()).to.be(feature.flatInteriorPoints_);
    });
  });

  describe('#getFlatInteriorPoints()', function() {
    it('returns correct points and caches them', function() {
      var polygon = new ol.geom.MultiPolygon([
        [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
        [[[10, 0], [10, 10], [20, 10], [20, 0], [10, 0]]]
      ]);
      var feature = new ol.render.Feature('MultiPolygon', polygon.getOrientedFlatCoordinates(),
          polygon.getEndss());
      expect(feature.getFlatInteriorPoints()).to.eql([5, 5, 10, 15, 5, 10]);
      expect(feature.getFlatInteriorPoints()).to.be(feature.flatInteriorPoints_);
    });
  });

  describe('#getFlatMidpoint()', function() {
    it('returns correct point', function() {
      var line = new ol.geom.LineString([[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]);
      var feature = new ol.render.Feature('LineString', line.getFlatCoordinates());
      expect(feature.getFlatMidpoint()).to.eql([10, 10]);
      expect(feature.getFlatMidpoint()).to.eql(feature.flatMidpoints_);
    });
  });

  describe('#getFlatMidpoints()', function() {
    it('returns correct points and caches them', function() {
      var line = new ol.geom.MultiLineString([
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
        [[10, 0], [10, 10], [20, 10], [20, 0], [10, 0]]
      ]);
      var feature = new ol.render.Feature('MultiLineString', line.getFlatCoordinates(),
          line.getEnds());
      expect(feature.getFlatMidpoints()).to.eql([10, 10, 20, 10]);
      expect(feature.getFlatMidpoints()).to.be(feature.flatMidpoints_);
    });
  });

  describe('#getGeometry()', function() {
    it('returns itself as geometry', function() {
      expect(renderFeature.getGeometry()).to.equal(renderFeature);
    });
  });

  describe('#getId()', function() {
    it('returns the feature id', function() {
      expect(renderFeature.getId()).to.be('foo');
    });
  });

  describe('#getProperties()', function() {
    it('returns the properties it was created with', function() {
      expect(renderFeature.getProperties()).to.equal(properties);
    });
  });

  describe('#getSimplifiedGeometry()', function() {
    it('returns itself as simplified geometry', function() {
      expect(renderFeature.getSimplifiedGeometry()).to.equal(renderFeature);
    });
  });

  describe('#getStride()', function() {
    it('returns 2', function() {
      expect(renderFeature.getStride()).to.be(2);
    });
  });

  describe('#getStyleFunction()', function() {
    it('returns undefined', function() {
      expect(renderFeature.getStyleFunction()).to.be(undefined);
    });
  });

  describe('#getType()', function() {
    it('returns the type it was created with', function() {
      expect(renderFeature.getType()).to.equal(type);
    });
  });

});
