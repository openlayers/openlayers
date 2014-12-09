goog.provide('ol.test.style.Style');

describe('ol.style.Style', function() {

  describe('#setZIndex', function() {

    it('sets the zIndex', function() {
      var style = new ol.style.Style();

      style.setZIndex(0.7);
      expect(style.getZIndex()).to.be(0.7);
    });
  });
});

describe('ol.style.createStyleFunction()', function() {
  var style = new ol.style.Style();

  it('creates a style function from a single style', function() {
    var styleFunction = ol.style.createStyleFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function() {
    var styleFunction = ol.style.createStyleFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    var original = function() {
      return [style];
    };
    var styleFunction = ol.style.createStyleFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      ol.style.createStyleFunction({bogus: 'input'});
    }).to.throwException();
  });

});

goog.require('ol.style.Style');
