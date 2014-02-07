goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('constructor', function() {
    var source = new ol.source.Vector();
    var style = new ol.style.Style();

    it('creates a new layer', function() {
      var layer = new ol.layer.Vector({source: source});
      expect(layer).to.be.a(ol.layer.Vector);
      expect(layer).to.be.a(ol.layer.Layer);
    });

    it('accepts a style option with a single style', function() {
      var layer = new ol.layer.Vector({
        source: source,
        style: style
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with an array of styles', function() {
      var layer = new ol.layer.Vector({
        source: source,
        style: [style]
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with a style function', function() {
      var layer = new ol.layer.Vector({
        source: source,
        style: function(feature, resolution) {
          return [style];
        }
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

  });

});

goog.require('ol.layer.Layer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
