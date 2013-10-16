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

  describe('#getFeatureInfoForPixel()', function() {

    var viewport, map, view, source;
    beforeEach(function() {
      viewport = document.createElement('div');
      var style = viewport.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(viewport);

      source = new ol.source.ImageWMS({
        url: 'http://example.com/',
        projection: 'EPSG:4326',
        params: {'LAYERS': 'test-layer'}
      });

      view = new ol.View2D({
        projection: 'EPSG:4326',
        center: [0, 0]
      });

      map = new ol.Map({
        target: viewport,
        layers: [
          new ol.layer.Image({
            source: source
          })
        ],
        view: view
      });

      sinon.spy(ol.source.wms, 'getFeatureInfo');
    });

    afterEach(function() {
      ol.source.wms.getFeatureInfo.restore();
      document.body.removeChild(viewport);
    });

    it('calls ol.source.wms.getFeatureInfo (resolution 1)', function(done) {
      // confirm things look good at resolution: 2
      map.once('postrender', function() {
        source.getFeatureInfoForPixel([0, 0], map, function() {
          expect(ol.source.wms.getFeatureInfo.calledOnce).to.be(true);
          var args = ol.source.wms.getFeatureInfo.getCall(0).args;

          // check url arg
          var url = new goog.Uri(args[0]);
          var query = url.getQueryData();
          expect(query.containsKey('BBOX')).to.be(true);
          expect(query.get('BBOX').split(',')).to.eql([-90, -180, 90, 180]);

          // check pixel arg
          var pixel = args[1];
          expect(pixel).to.eql([0, 0]);

          done();
        });
      });
      view.setResolution(1);
    });

    it('calls ol.source.wms.getFeatureInfo (resolution 2)', function(done) {
      // confirm things look good at resolution: 2
      map.once('postrender', function() {
        source.getFeatureInfoForPixel([10, 20], map, function() {
          expect(ol.source.wms.getFeatureInfo.calledOnce).to.be(true);
          var args = ol.source.wms.getFeatureInfo.getCall(0).args;

          // check url arg
          var url = new goog.Uri(args[0]);
          var query = url.getQueryData();
          expect(query.containsKey('BBOX')).to.be(true);
          expect(query.get('BBOX').split(',')).to.eql([-180, -360, 180, 360]);

          // check pixel arg
          var pixel = args[1];
          expect(pixel).to.eql([10, 20]);

          done();
        });

      });
      view.setResolution(2);
    });
  });

});

goog.require('goog.Uri');

goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Image');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.Source');
goog.require('ol.source.wms');
