goog.provide('ol.test.renderer.Map');

goog.require('ol.Disposable');
goog.require('ol.Map');
goog.require('ol.renderer.Map');


describe('ol.renderer.Map', function() {

  describe('constructor', function() {

    it('createst an instance', function() {
      var map = new ol.Map({});
      var renderer = new ol.renderer.Map(null, map);
      expect(renderer).to.be.a(ol.renderer.Map);
      expect(renderer).to.be.a(ol.Disposable);
      renderer.dispose();
      map.dispose();
    });

  });

});
