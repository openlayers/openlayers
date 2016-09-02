goog.provide('ol.test.style.Style');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.style.Style');


describe('ol.style.Style', function() {

  describe('#setZIndex', function() {

    it('sets the zIndex', function() {
      var style = new ol.style.Style();

      style.setZIndex(0.7);
      expect(style.getZIndex()).to.be(0.7);
    });
  });

  describe('#setGeometry', function() {
    var style = new ol.style.Style();

    it('creates a geometry function from a string', function() {
      var feature = new ol.Feature();
      feature.set('myGeom', new ol.geom.Point([0, 0]));
      style.setGeometry('myGeom');
      expect(style.getGeometryFunction()(feature))
          .to.eql(feature.get('myGeom'));
    });

    it('creates a geometry function from a geometry', function() {
      var geom = new ol.geom.Point([0, 0]);
      style.setGeometry(geom);
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });

    it('returns the configured geometry function', function() {
      var geom = new ol.geom.Point([0, 0]);
      style.setGeometry(function() {
        return geom;
      });
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });
  });

  describe('#getGeometry', function() {

    it('returns whatever was passed to setGeometry', function() {
      var style = new ol.style.Style();
      style.setGeometry('foo');
      expect(style.getGeometry()).to.eql('foo');
      var geom = new ol.geom.Point([1, 2]);
      style.setGeometry(geom);
      expect(style.getGeometry()).to.eql(geom);
      var fn = function() {
        return geom;
      };
      style.setGeometry(fn);
      expect(style.getGeometry()).to.eql(fn);
      style.setGeometry(null);
      expect(style.getGeometry()).to.eql(null);
    });

  });

});

describe('ol.style.Style.createFunction()', function() {
  var style = new ol.style.Style();

  it('creates a style function from a single style', function() {
    var styleFunction = ol.style.Style.createFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function() {
    var styleFunction = ol.style.Style.createFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    var original = function() {
      return [style];
    };
    var styleFunction = ol.style.Style.createFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      ol.style.Style.createFunction({bogus: 'input'});
    }).to.throwException();
  });

});
