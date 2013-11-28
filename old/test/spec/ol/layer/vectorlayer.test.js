goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('constructor', function() {

    it('creates a new layer', function() {

      var layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      expect(layer).to.be.a(ol.layer.Vector);
      expect(layer).to.be.a(ol.layer.Layer);

    });

  });

});

goog.require('ol.layer.Layer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
