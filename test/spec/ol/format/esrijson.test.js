goog.provide('ol.test.reader.EsriJSON');

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.EsriJSON');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');


describe('ol.format.EsriJSON', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.EsriJSON();
  });

  var pointEsriJSON = {
    geometry: {
      x: 102.0,
      y: 0.5
    },
    attributes: {
      'prop0': 'value0'
    }
  };

  var multiPointEsriJSON = {
    geometry: {
      'points' : [[102.0, 0.0], [103.0, 1.0]]
    },
    attributes: {
      'prop0': 'value0'
    }
  };

  var lineStringEsriJSON = {
    geometry: {
      paths: [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var multiLineStringEsriJSON = {
    geometry: {
      paths: [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ], [
        [105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var polygonEsriJSON = {
    geometry: {
      rings: [[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': {'this': 'that'}
    }
  };

  var multiPolygonEsriJSON = {
    geometry: {
      rings: [[
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
      ]]
    }
  };

  var featureCollectionEsriJSON = {
    features: [pointEsriJSON, lineStringEsriJSON, polygonEsriJSON]
  };

  var data = {
    features: [{
      attributes: {
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
      geometry: {
        paths: [[
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
      attributes: {
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
      geometry: {
        paths: [[
          [1549754.2769, 6403854.8024],
          [1549728.45985, 6403920.2]
        ]]
      }
    }]
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
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);

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
        expect(result.length).to.be(9);

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

        var last = result[8];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('field_name')).to.be('FEAGINS');
        expect(last.getId()).to.be(6030);
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getExtent(),
            [-10555714.026858449, 4576511.565880965,
              -10553671.199322715, 4578554.9934867555]))
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
      expect(obj.getLayout()).to.eql('XY');
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
      expect(obj.getLayout()).to.eql('XYZ');
    });

    it('parses XYM point', function() {
      var str = JSON.stringify({
        x: 10,
        y: 20,
        m: 10
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20, 10]);
      expect(obj.getLayout()).to.eql('XYM');
    });

    it('parses XYZM point', function() {
      var str = JSON.stringify({
        x: 10,
        y: 20,
        z: 0,
        m: 10
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20, 0, 10]);
      expect(obj.getLayout()).to.eql('XYZM');
    });

    it('parses multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20], [20, 30]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20], [20, 30]]);
      expect(obj.getLayout()).to.eql('XY');
    });

    it('parses XYZ multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20, 0], [20, 30, 0]],
        hasZ: true
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20, 0], [20, 30, 0]]);
      expect(obj.getLayout()).to.eql('XYZ');
    });

    it('parses XYM multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20, 0], [20, 30, 0]],
        hasM: true
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20, 0], [20, 30, 0]]);
      expect(obj.getLayout()).to.eql('XYM');
    });

    it('parses XYZM multipoint', function() {
      var str = JSON.stringify({
        points: [[10, 20, 0, 1], [20, 30, 0, 1]],
        hasZ: true,
        hasM: true
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPoint);
      expect(obj.getCoordinates()).to.eql([[10, 20, 0, 1], [20, 30, 0, 1]]);
      expect(obj.getLayout()).to.eql('XYZM');
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        paths: [[[10, 20], [30, 40]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getCoordinates()).to.eql([[10, 20], [30, 40]]);
      expect(obj.getLayout()).to.eql('XY');
    });

    it('parses XYZ linestring', function() {
      var str = JSON.stringify({
        hasZ: true,
        paths: [[[10, 20, 1534], [30, 40, 1420]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getLayout()).to.eql('XYZ');
      expect(obj.getCoordinates()).to.eql([[10, 20, 1534], [30, 40, 1420]]);
    });

    it('parses XYM linestring', function() {
      var str = JSON.stringify({
        hasM: true,
        paths: [[[10, 20, 1534], [30, 40, 1420]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getLayout()).to.eql('XYM');
      expect(obj.getCoordinates()).to.eql([[10, 20, 1534], [30, 40, 1420]]);
    });

    it('parses XYZM linestring', function() {
      var str = JSON.stringify({
        hasZ: true,
        hasM: true,
        paths: [[[10, 20, 1534, 1], [30, 40, 1420, 2]]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getLayout()).to.eql('XYZM');
      expect(obj.getCoordinates()).to.eql([[10, 20, 1534, 1],
            [30, 40, 1420, 2]]);
    });

    it('parses multilinestring', function() {
      var str = JSON.stringify({
        paths: [[
          [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ], [
          [105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]
        ]]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiLineString);
      expect(obj.getCoordinates()).to.eql([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      expect(obj.getLayout()).to.eql('XY');
    });

    it('parses XYZ multilinestring', function() {
      var str = JSON.stringify({
        hasZ: true,
        paths: [[
          [102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]
        ], [
          [105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]
        ]]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiLineString);
      expect(obj.getCoordinates()).to.eql([
        [[102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]],
        [[105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]]
      ]);
      expect(obj.getLayout()).to.eql('XYZ');
    });

    it('parses XYM multilinestring', function() {
      var str = JSON.stringify({
        hasM: true,
        paths: [[
          [102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]
        ], [
          [105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]
        ]]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiLineString);
      expect(obj.getCoordinates()).to.eql([
        [[102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]],
        [[105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]]
      ]);
      expect(obj.getLayout()).to.eql('XYM');
    });

    it('parses XYZM multilinestring', function() {
      var str = JSON.stringify({
        hasM: true,
        hasZ: true,
        paths: [[
          [102, 0, 1, 2], [103, 1, 1, 2], [104, 0, 1, 2], [105, 1, 1, 2]
        ], [
          [105, 3, 1, 2], [106, 4, 1, 2], [107, 3, 1, 2], [108, 4, 1, 2]
        ]]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiLineString);
      expect(obj.getCoordinates()).to.eql([
        [[102, 0, 1, 2], [103, 1, 1, 2], [104, 0, 1, 2], [105, 1, 1, 2]],
        [[105, 3, 1, 2], [106, 4, 1, 2], [107, 3, 1, 2], [108, 4, 1, 2]]
      ]);
      expect(obj.getLayout()).to.eql('XYZM');
    });

    it('parses polygon', function() {
      var outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
      var inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      var inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var str = JSON.stringify({
        rings: [outer, inner1, inner2]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql('XY');
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0].getCoordinates()[0].length).to.equal(2);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XYZ polygon', function() {
      var outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      var inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      var inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      var str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql('XYZ');
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0].getCoordinates()[0].length).to.equal(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XYM polygon', function() {
      var outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      var inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      var inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      var str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasM: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql('XYM');
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0].getCoordinates()[0].length).to.equal(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XYZM polygon', function() {
      var outer = [
        [0, 0, 5, 1], [0, 10, 5, 1], [10, 10, 5, 1],
        [10, 0, 5, 1], [0, 0, 5, 1]
      ];
      var inner1 = [
        [1, 1, 3, 2], [2, 1, 3, 2], [2, 2, 3, 2],
        [1, 2, 3, 2], [1, 1, 3, 2]
      ];
      var inner2 = [
        [8, 8, 2, 1], [9, 8, 2, 1], [9, 9, 2, 1],
        [8, 9, 2, 1], [8, 8, 2, 1]
      ];
      var str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true,
        hasM: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.getLayout()).to.eql('XYZM');
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0].getCoordinates()[0].length).to.equal(4);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    it('parses XY multipolygon', function() {
      var str = JSON.stringify({
        rings: [
          [[0, 1], [1, 4], [4, 3], [3, 0]],
          [[2, 2], [3, 2], [3, 3], [2, 3]],
          [[10, 1], [11, 5], [14, 3], [13, 0]]
        ]
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPolygon);
      expect(obj.getLayout()).to.eql('XY');
      expect(obj.getCoordinates()).to.eql([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2],
            [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
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
      expect(obj.getLayout()).to.eql('XYZ');
      expect(obj.getCoordinates()).to.eql([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
            [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ]);
    });

    it('parses XYM multipolygon', function() {
      var str = JSON.stringify({
        rings: [
          [[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]],
          [[2, 2, 0], [3, 2, 0], [3, 3, 0], [2, 3, 0]],
          [[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]
        ],
        hasM: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPolygon);
      expect(obj.getLayout()).to.eql('XYM');
      expect(obj.getCoordinates()).to.eql([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
            [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ]);
    });

    it('parses XYZM multipolygon', function() {
      var str = JSON.stringify({
        rings: [
          [[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 1], [3, 0, 0, 1]],
          [[2, 2, 0, 1], [3, 2, 0, 1], [3, 3, 0, 1], [2, 3, 0, 1]],
          [[10, 1, 0, 1], [11, 5, 0, 1], [14, 3, 0, 1], [13, 0, 0, 1]]
        ],
        hasZ: true,
        hasM: true
      });
      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.MultiPolygon);
      expect(obj.getLayout()).to.eql('XYZM');
      expect(obj.getCoordinates()).to.eql([
        [[[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 1], [3, 0, 0, 1]],
          [[2, 2, 0, 1], [3, 2, 0, 1],
            [3, 3, 0, 1], [2, 3, 0, 1]]],
        [[[10, 1, 0, 1], [11, 5, 0, 1], [14, 3, 0, 1], [13, 0, 0, 1]]]
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

  describe('#writeGeometry', function() {

    it('encodes point', function() {
      var point = new ol.geom.Point([10, 20]);
      var esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ point', function() {
      var point = new ol.geom.Point([10, 20, 0], 'XYZ');
      var esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM point', function() {
      var point = new ol.geom.Point([10, 20, 0], 'XYM');
      var esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM point', function() {
      var point = new ol.geom.Point([10, 20, 5, 0],
          'XYZM');
      var esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20], [30, 40]]);
      var esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20, 1534], [30, 40, 1420]],
          'XYZ');
      var esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20, 1534], [30, 40, 1420]],
          'XYM');
      var esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20, 1534, 1],
            [30, 40, 1420, 1]],
          'XYZM');
      var esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      var inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      var inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2]);
      var esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ polygon', function() {
      var outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      var inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      var inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2],
          'XYZ');
      var esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM polygon', function() {
      var outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      var inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      var inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2],
          'XYM');
      var esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM polygon', function() {
      var outer = [
        [0, 0, 5, 1], [0, 10, 5, 2], [10, 10, 5, 1], [10, 0, 5, 1], [0, 0, 5, 1]
      ];
      var inner1 = [
        [1, 1, 3, 1], [2, 1, 3, 2], [2, 2, 3, 1], [1, 2, 3, 1], [1, 1, 3, 1]
      ];
      var inner2 = [
        [8, 8, 2, 1], [9, 8, 2, 2], [9, 9, 2, 1], [8, 9, 2, 1], [8, 8, 2, 1]
      ];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2],
          'XYZM');
      var esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes multipoint', function() {
      var multipoint = new ol.geom.MultiPoint([[102.0, 0.0] , [103.0, 1.0]]);
      var esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ multipoint', function() {
      var multipoint = new ol.geom.MultiPoint([[102.0, 0.0, 3],
            [103.0, 1.0, 4]], 'XYZ');
      var esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM multipoint', function() {
      var multipoint = new ol.geom.MultiPoint([[102.0, 0.0, 3],
            [103.0, 1.0, 4]], 'XYM');
      var esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM multipoint', function() {
      var multipoint = new ol.geom.MultiPoint([[102.0, 0.0, 3, 1],
            [103.0, 1.0, 4, 1]], 'XYZM');
      var esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes multilinestring', function() {
      var multilinestring = new ol.geom.MultiLineString([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      var esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ multilinestring', function() {
      var multilinestring = new ol.geom.MultiLineString([
        [[102.0, 0.0, 1], [103.0, 1.0, 2], [104.0, 0.0, 3], [105.0, 1.0, 4]],
        [[105.0, 3.0, 1], [106.0, 4.0, 2], [107.0, 3.0, 3], [108.0, 4.0, 4]]
      ], 'XYZ');
      var esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM multilinestring', function() {
      var multilinestring = new ol.geom.MultiLineString([
        [[102.0, 0.0, 1], [103.0, 1.0, 2], [104.0, 0.0, 3], [105.0, 1.0, 4]],
        [[105.0, 3.0, 1], [106.0, 4.0, 2], [107.0, 3.0, 3], [108.0, 4.0, 4]]
      ], 'XYM');
      var esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM multilinestring', function() {
      var multilinestring = new ol.geom.MultiLineString([
        [[102.0, 0.0, 1, 0], [103.0, 1.0, 2, 2], [104.0, 0.0, 3, 1],
          [105.0, 1.0, 4, 2]],
        [[105.0, 3.0, 1, 0], [106.0, 4.0, 2, 1], [107.0, 3.0, 3, 1],
          [108.0, 4.0, 4, 2]]
      ], 'XYZM');
      var esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes multipolygon', function() {
      var multipolygon = new ol.geom.MultiPolygon([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2], [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
      var esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZ multipolygon', function() {
      var multipolygon = new ol.geom.MultiPolygon([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
            [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ], 'XYZ');
      var esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYM multipolygon', function() {
      var multipolygon = new ol.geom.MultiPolygon([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
            [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ], 'XYM');
      var esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('encodes XYZM multipolygon', function() {
      var multipolygon = new ol.geom.MultiPolygon([
        [[[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 3], [3, 0, 0, 3]],
          [[2, 2, 0, 3], [3, 2, 0, 4],
            [3, 3, 0, 1], [2, 3, 0, 1]]],
        [[[10, 1, 0, 1], [11, 5, 0, 2], [14, 3, 0, 3], [13, 0, 0, 3]]]
      ], 'XYZM');
      var esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).to.eql(
          format.readGeometry(esrijson).getCoordinates());
    });

    it('transforms and encodes a point', function() {
      var point = new ol.geom.Point([2, 3]);
      var esrijson = format.writeGeometry(point, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      var newPoint = format.readGeometry(esrijson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      expect(point.getCoordinates()[0]).to.roughlyEqual(
          newPoint.getCoordinates()[0], 1e-8);
      expect(
          Math.abs(point.getCoordinates()[1] - newPoint.getCoordinates()[1]))
          .to.be.lessThan(0.0000001);
    });

  });

  describe('#writeFeatures', function() {

    it('encodes feature collection', function() {
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);
      var esrijson = format.writeFeaturesObject(array);
      var result = format.readFeatures(esrijson);
      expect(array.length).to.equal(result.length);
      var got, exp, gotProp, expProp;
      for (var i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().getCoordinates()).to.eql(
            exp.getGeometry().getCoordinates());
        gotProp = got.getProperties();
        delete gotProp.geometry;
        expProp = exp.getProperties();
        delete expProp.geometry;
        expect(gotProp).to.eql(expProp);
      }
    });

    it('transforms and encodes feature collection', function() {
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);
      var esrijson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      });
      var result = format.readFeatures(esrijson);
      var got, exp;
      for (var i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().transform('EPSG:3857', 'EPSG:4326')
            .getCoordinates()).to.eql(exp.getGeometry().getCoordinates());
      }
    });

    it('writes out a feature with a different geometryName correctly',
        function() {
          var feature = new ol.Feature({'foo': 'bar'});
          feature.setGeometryName('mygeom');
          feature.setGeometry(new ol.geom.Point([5, 10]));
          var esrijson = format.writeFeaturesObject([feature]);
          expect(esrijson.features[0].attributes.mygeom).to.eql(undefined);
        });

    it('writes out a feature without properties correctly', function() {
      var feature = new ol.Feature(new ol.geom.Point([5, 10]));
      var esrijson = format.writeFeatureObject(feature);
      expect(esrijson.attributes).to.eql({});
    });

  });

});
