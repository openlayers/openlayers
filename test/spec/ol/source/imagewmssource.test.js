goog.provide('ol.test.source.ImageWMS');

describe('ol.source.ImageWMS', function() {

  describe('constructor', function() {

    it('creates a source', function() {
      var source = new ol.source.ImageWMS({
        url: 'http://demo.opengeo.org/geoserver/wms',
        params: {'LAYERS': 'topp:states'},
        extent: [-13884991, 2870341, -7455066, 6338219]
      });

      expect(source).to.be.a(ol.source.ImageWMS);
      expect(source).to.be.a(ol.source.Source);
    });

  });

});

goog.require('goog.Uri');

goog.require('ol.Map');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.Source');
