goog.provide('ol.test.reader.EsriJSON');


describe('ol.format.EsriJSON', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.EsriJSON();
  });

  var pointEsriJSON = {
    'geometry': {
      'x': 102.0,
      'y': 0.5
    },
    'attributes': {
      'prop0': 'value0'
    }
  };

  var multiPointEsriJSON = {
    'geometry': {
      'points' : [[102.0, 0.0], [103.0, 1.0]]
    },
    'attributes': {
      'prop0': 'value0'
    }
  };

  var lineStringEsriJSON = {
    'geometry': {
      'paths': [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]]
    },
    'attributes': {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var multiLineStringEsriJSON = {
    'geometry': {
      'paths': [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ], [
        [105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]
      ]]
    },
    'attributes': {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var polygonEsriJSON = {
    'geometry': {
      'rings': [[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]
    },
    'attributes': {
      'prop0': 'value0',
      'prop1': {'this': 'that'}
    }
  };

  var multiPolygonEsriJSON = {
    'geometry': {
      'rings': [
        [
          [0, 1],
          [1, 4],
          [4, 3],
          [3, 0]
        ], [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3]
        ], [
          [10, 1],
          [11, 5],
          [14, 3],
          [13, 0]
        ]
      ]
    }
  };

  var featureCollectionEsriJSON = {
    'features': [pointEsriJSON, lineStringEsriJSON, polygonEsriJSON]
  };

  var data = {
    'features': [
      {
        'attributes': {
          'LINK_ID': 573730499,
          'RP_TYPE': 14,
          'RP_FUNC': 0,
          'DIRECTION': 2,
          'LOGKOD': '',
          'CHANGED': '',
          'USERID': '',
          'ST_NAME': '',
          'L_REFADDR': '',
          'L_NREFADDR': '',
          'R_REFADDR': '',
          'R_NREFADDR': '',
          'SPEED_CAT': '7',
          'ZIPCODE': '59330',
          'SHAPE_LEN': 46.3826
        },
        'geometry': {
          'paths': [[
            [1549497.66985, 6403707.96],
            [1549491.1, 6403710.1],
            [1549488.03995, 6403716.7504],
            [1549488.5401, 6403724.5504],
            [1549494.37985, 6403733.54],
            [1549499.6799, 6403738.0504],
            [1549506.22, 6403739.2504]
          ]]
        }
      }, {
        'attributes': {
          'LINK_ID': 30760556,
          'RP_TYPE': 12,
          'RP_FUNC': 1,
          'DIRECTION': 0,
          'LOGKOD': '',
          'CHANGED': '',
          'USERID': '',
          'ST_NAME': 'BRUNNSGATAN',
          'L_REFADDR': '24',
          'L_NREFADDR': '16',
          'R_REFADDR': '',
          'R_NREFADDR': '',
          'SPEED_CAT': '7',
          'ZIPCODE': '59330',
          'SHAPE_LEN': 70.3106
        },
        'geometry': {
          'paths': [[
            [1549754.2769, 6403854.8024],
            [1549728.45985, 6403920.2]
          ]]
        }
      }
    ]
  };

  describe('#readFeature', function() {

    it('can read a single point feature', function() {
      var feature = format.readFeature(pointEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single multipoint feature', function() {
      var feature = format.readFeature(multiPointEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.MultiPoint);
      expect(geometry.getCoordinates()).to.eql([[102.0, 0.0] , [103.0, 1.0]]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single line string feature', function() {
      var feature = format.readFeature(lineStringEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql(
          [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a multi line string feature', function() {
      var feature = format.readFeature(multiLineStringEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.MultiLineString);
      expect(geometry.getCoordinates()).to.eql([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a single polygon feature', function() {
      var feature = format.readFeature(polygonEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Polygon);
      expect(geometry.getCoordinates()).to.eql([[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.eql({'this': 'that'});
    });

    it('can read a multi polygon feature', function() {
      var feature = format.readFeature(multiPolygonEsriJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.MultiPolygon);
      expect(geometry.getCoordinates()).to.eql([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2], [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
    });

    it('can read a feature collection', function() {
      var features = format.readFeatures(featureCollectionEsriJSON);
      expect(features).to.have.length(3);
      expect(features[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(features[1].getGeometry()).to.be.an(ol.geom.LineString);
      expect(features[2].getGeometry()).to.be.an(ol.geom.Polygon);
    });

    it('can read and transform a point', function() {
      var feature = format.readFeatures(pointEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      });
      expect(feature[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
          ol.proj.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    it('can read and transform a feature collection', function() {
      var features = format.readFeatures(featureCollectionEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      });
      expect(features[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(features[0].getGeometry().getCoordinates()).to.eql(
          ol.proj.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
      expect(features[1].getGeometry().getCoordinates()).to.eql([
        ol.proj.transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
      ]);
      expect(features[2].getGeometry().getCoordinates()).to.eql([[
        ol.proj.transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857')
      ]]);
    });

    it('can create a feature with a specific geometryName', function() {
      var feature = new ol.format.EsriJSON({geometryName: 'the_geom'}).
          readFeature(pointEsriJSON);
      expect(feature.getGeometryName()).to.be('the_geom');
      expect(feature.getGeometry()).to.be.an(ol.geom.Point);
    });

  });

  describe('#readFeatures', function() {

    it('parses feature collection', function() {
      var str = JSON.stringify(data),
          array = format.readFeatures(str);

      expect(array.length).to.be(2);

      var first = array[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('LINK_ID')).to.be(573730499);
      var firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(ol.geom.LineString);

      var second = array[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('ST_NAME')).to.be('BRUNNSGATAN');
      var secondGeom = second.getGeometry();
      expect(secondGeom).to.be.a(ol.geom.LineString);
    });

    it('parses ksfields.geojson', function(done) {
      afterLoadText('spec/ol/format/esrijson/ksfields.json', function(text) {
        var result = format.readFeatures(text);
        expect(result.length).to.be(306);

        var first = result[0];
        expect(first).to.be.a(ol.Feature);
        expect(first.get('field_name')).to.be('EUDORA');
        expect(first.getId()).to.be(6406);
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(firstGeom.getExtent(),
            [-10585772.743554419, 4712365.161160459,
              -10579560.16462974, 4716567.373073828]))
            .to.be(true);

        var last = result[305];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('field_name')).to.be('PAOLA-RANTOUL');
        expect(last.getId()).to.be(223);
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getExtent(),
            [-10596945.530910717, 4634530.860533288,
              -10538217.991305258, 4691558.678837225]))
            .to.be(true);
        done();
      });

    });

  });

  describe('#readGeometry', function() {

    it('parses point', function() {
      var str = JSON.stringify({
        x: 10,
        y: 20
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20]);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XY);
    });

    it('parses XYZ point', function() {
      var str = JSON.stringify({
        x: 10,
        y: 20,
        z: 10
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20, 10]);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XYZ);
    });

    it('parses multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20], [20, 30]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20], [20, 30]]);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XY);
    });

    it('parses XYZ multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20, 0], [20, 30, 0]],
        hasZ: true
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20, 0], [20, 30, 0]]);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XYZ);
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        paths: [[[10, 20], [30, 40]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getCoordinates()).to.eql([[10, 20], [30, 40]]);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XY);
    });

    it('parses XYZ linestring', function() {
      var str = JSON.stringify({
        hasZ: true,
        paths: [[[10, 20, 1534], [30, 40, 1420]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XYZ);
      expect(obj.getCoordinates()).to.eql([[10, 20, 1534], [30, 40, 1420]]);
    });

    it('parses polygon', function() {
      var outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
          inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
          inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]],
          str = JSON.stringify({
            rings: [outer, inner1, inner2]
          });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XY);
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XYZ polygon', function() {
      var outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]],
          inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]],
          inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]],
          str = JSON.stringify({
            rings: [outer, inner1, inner2],
            hasZ: true
          });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XYZ);
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XYZ multipolygon', function() {
      var str = JSON.stringify({
        rings: [
          [[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]],
          [[2, 2, 0], [3, 2, 0], [3, 3, 0], [2, 3, 0]],
          [[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]
        ],
        hasZ: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPolygon);
      expect(obj.getLayout()).to.eql(ol.geom.GeometryLayout.XYZ);
      expect(obj.getCoordinates()).to.eql([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
            [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ]);
    });

  });

  describe('#readProjection', function() {

    it('reads named crs from top-level object', function() {

      var json = {
        spatialReference: {
          wkid: 3857
        },
        features: [{
          attributes: {
            foo: 'bar'
          },
          geometry: {
            x: 1,
            y: 2
          }
        }, {
          attributes: {
            bam: 'baz'
          },
          geometry: {
            paths: [[[1, 2], [3, 4]]]
          }
        }]
      };
      var features = format.readFeatures(json);

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(format.readProjection(json)).to.be(ol.proj.get('EPSG:3857'));

    });

  });

});


goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.EsriJSON');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
