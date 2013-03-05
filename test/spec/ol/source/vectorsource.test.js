goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector({});
      expect(source).toBeA(ol.source.Vector);
      expect(source).toBeA(ol.source.Source);
    });
  });

});

goog.require('ol.source.Source');
goog.require('ol.source.Vector');
