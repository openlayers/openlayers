goog.provide('ol.test.tilegrid.Zoomify');

describe('ol.tilegrid.Zoomify', function() {

  describe('constructor', function() {

    it('can be constructed with minimal arguments', function() {
      var instance = new ol.tilegrid.Zoomify({
        resolutions: [],
        extent: [],
        origin: [],
        tileSize: []
      });
      expect(instance).to.be.an(ol.tilegrid.Zoomify);
    });

  });

});

goog.require('ol.tilegrid.Zoomify');
