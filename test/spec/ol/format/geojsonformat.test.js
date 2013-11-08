goog.provide('ol.test.reader.GeoJSON');


describe('ol.format.GeoJSON', function() {

  var pointGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [102.0, 0.5]
    },
    'properties': {
      'prop0': 'value0'
    }
  };

  var lineStringGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]
    },
    'properties': {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var polygonGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[
        [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]
      ]]
    },
    'properties': {
      'prop0': 'value0',
      'prop1': {'this': 'that'}
    }
  };

  var featureCollectionGeoJSON = {
    'type': 'FeatureCollection',
    'features': [pointGeoJSON, lineStringGeoJSON, polygonGeoJSON]
  };

  var format = new ol.format.GeoJSON();

  describe('readObject', function() {

    it('can read a single point feature', function() {
      var feature = format.readObject(pointGeoJSON, function(f) {
        return f;
      });
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Point);
      expect(geometry.getCoordinate()).to.eql([102.0, 0.5]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single line string feature', function() {
      var feature = format.readObject(lineStringGeoJSON,
          function(f) {
            return f;
          });
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql(
          [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a single polygon feature', function() {
      var feature = format.readObject(polygonGeoJSON, function(f) {
        return f;
      });
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Polygon);
      expect(geometry.getRings()).to.eql([[
        [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]
      ]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.eql({'this': 'that'});
    });

    it('can read a feature collection', function() {
      var features = [];
      format.readObject(featureCollectionGeoJSON, function(f) {
        features.push(f);
      });
      expect(features).to.have.length(3);
      expect(features[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(features[1].getGeometry()).to.be.an(ol.geom.LineString);
      expect(features[2].getGeometry()).to.be.an(ol.geom.Polygon);
    });

  });

});


goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
