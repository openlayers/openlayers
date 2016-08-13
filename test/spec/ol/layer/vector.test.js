goog.provide('ol.test.layer.Vector');

goog.require('ol.layer.Layer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');


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

  describe('#setStyle()', function() {

    var layer, style;

    beforeEach(function() {
      layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      style = new ol.style.Style();
    });

    it('allows the style to be set after construction', function() {
      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);
    });

    it('dispatches the change event', function(done) {
      layer.on('change', function() {
        done();
      });
      layer.setStyle(style);
    });

    it('updates the internal style function', function() {
      expect(layer.getStyleFunction()).to.be(ol.style.Style.defaultFunction);
      layer.setStyle(style);
      expect(layer.getStyleFunction()).not.to.be(
          ol.style.Style.defaultFunction);
    });

    it('allows setting an null style', function() {
      layer.setStyle(null);
      expect(layer.getStyle()).to.be(null);
      expect(layer.getStyleFunction()).to.be(undefined);
    });

    it('sets the default style when passing undefined', function() {
      layer.setStyle(style);
      layer.setStyle(undefined);
      expect(layer.getStyle()).to.be(ol.style.Style.defaultFunction);
      expect(layer.getStyleFunction()).to.be(ol.style.Style.defaultFunction);
    });

  });

  describe('#getStyle()', function() {

    var source = new ol.source.Vector();
    var style = new ol.style.Style();

    it('returns what is provided to setStyle', function() {
      var layer = new ol.layer.Vector({
        source: source
      });

      expect(layer.getStyle()).to.be(ol.style.Style.defaultFunction);

      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);

      layer.setStyle([style]);
      expect(layer.getStyle()).to.eql([style]);

      var styleFunction = function(feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      expect(layer.getStyle()).to.be(styleFunction);

    });

  });

});
