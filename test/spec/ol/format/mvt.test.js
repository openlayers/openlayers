goog.provide('ol.test.format.MVT');

goog.require('ol.Feature');
goog.require('ol.ext.pbf');
goog.require('ol.ext.vectortile');
goog.require('ol.format.MVT');
goog.require('ol.render.Feature');

where('ArrayBuffer').describe('ol.format.MVT', function() {

  var data;
  beforeEach(function(done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'spec/ol/data/14-8938-5680.vector.pbf');
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      data = xhr.response;
      done();
    };
    xhr.send();
  });

  describe('#readFeatures', function() {

    it('uses ol.render.Feature as feature class by default', function() {
      var format = new ol.format.MVT({layers: ['water']});
      var features = format.readFeatures(data);
      expect(features[0]).to.be.a(ol.render.Feature);
    });

    it('parses only specified layers', function() {
      var format = new ol.format.MVT({layers: ['water']});
      var features = format.readFeatures(data);
      expect(features.length).to.be(10);
    });

    it('parses geometries correctly', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature,
        layers: ['poi_label']
      });
      var pbf = new ol.ext.pbf(data);
      var tile = new ol.ext.vectortile.VectorTile(pbf);
      var geometry, rawGeometry;

      rawGeometry = tile.layers['poi_label'].feature(0).loadGeometry();
      geometry = format.readFeatures(data)[0]
          .getGeometry();
      expect(geometry.getType()).to.be('Point');
      expect(geometry.getCoordinates())
          .to.eql([rawGeometry[0][0].x, rawGeometry[0][0].y]);

      rawGeometry = tile.layers['water'].feature(0).loadGeometry();
      format.setLayers(['water']);
      geometry = format.readFeatures(data)[0]
          .getGeometry();
      expect(geometry.getType()).to.be('Polygon');
      expect(rawGeometry[0].length)
          .to.equal(geometry.getCoordinates()[0].length);
      expect(geometry.getCoordinates()[0][0])
          .to.eql([rawGeometry[0][0].x, rawGeometry[0][0].y]);

      rawGeometry = tile.layers['barrier_line'].feature(0).loadGeometry();
      format.setLayers(['barrier_line']);
      geometry = format.readFeatures(data)[0]
          .getGeometry();
      expect(geometry.getType()).to.be('MultiLineString');
      expect(rawGeometry[1].length)
          .to.equal(geometry.getCoordinates()[1].length);
      expect(geometry.getCoordinates()[1][0])
          .to.eql([rawGeometry[1][0].x, rawGeometry[1][0].y]);
    });

    it('parses id property', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature,
        layers: ['building']
      });
      var features = format.readFeatures(data);
      expect(features[0].getId()).to.be(2);
    });

  });

});
