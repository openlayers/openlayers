goog.provide('ol.test.reproj.Triangulation');

describe('ol.reproj.Triangulation', function() {
  beforeEach(function() {
    proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs');
    var proj27700 = ol.proj.get('EPSG:27700');
    proj27700.setExtent([0, 0, 700000, 1300000]);
  });

  afterEach(function() {
    delete proj4.defs['EPSG:27700'];
  });

  describe('constructor', function() {
    it('is trivial for identity', function() {
      var proj4326 = ol.proj.get('EPSG:4326');
      var triangulation = new ol.reproj.Triangulation(proj4326, proj4326,
          [20, 20, 30, 30], [-180, -90, 180, 90], 0);
      expect(triangulation.getTriangles().length).to.be(2);
    });

    it('is empty when outside source extent', function() {
      var proj4326 = ol.proj.get('EPSG:4326');
      var proj27700 = ol.proj.get('EPSG:27700');
      var triangulation = new ol.reproj.Triangulation(proj27700, proj4326,
          [0, 0, 10, 10], proj27700.getExtent(), 0);
      expect(triangulation.getTriangles().length).to.be(0);
    });

    it('can handle null source extent', function() {
      var proj4326 = ol.proj.get('EPSG:4326');
      var triangulation = new ol.reproj.Triangulation(proj4326, proj4326,
          [20, 20, 30, 30], null, 0);
      expect(triangulation.getTriangles().length).to.be(2);
    });

    it('can handle wrapX in source', function() {
      proj4.defs('merc_180', '+proj=merc +lon_0=180 +units=m +no_defs');
      var proj_ = ol.proj.get('merc_180');
      proj_.setExtent([-20026376.39, -20048966.10, 20026376.39, 20048966.10]);

      var proj4326 = ol.proj.get('EPSG:4326');
      var triangulation = new ol.reproj.Triangulation(proj4326, proj_,
          proj_.getExtent(), [-180, -90, 180, 90], 0);
      expect(triangulation.getWrapsXInSource()).to.be(true);
      var triExtent = triangulation.calculateSourceExtent();
      expect(triExtent[2] < triExtent[0]).to.be(true);
    });

  });
});


goog.require('ol.proj');
goog.require('ol.reproj.Triangulation');
