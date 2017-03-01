goog.provide('ol.test.render.Feature');

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
          new ol.render.Feature(type, flatCoordinates, ends, properties);
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

  describe('#getGeometry()', function() {
    it('returns itself as geometry', function() {
      expect(renderFeature.getGeometry()).to.equal(renderFeature);
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
