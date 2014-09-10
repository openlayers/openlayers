goog.provide('ol.test.format.WKT');

describe('ol.format.WKT', function() {

  var format = new ol.format.WKT();

  it('Point read / written correctly', function() {
    var wkt = 'POINT(30 10)';
    var geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT (30 10)';
    geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
  });

  it('Point transformed / read / written correctly', function() {
    var wkt = 'POINT(1 2)';
    var geom = format.readGeometry(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    expect(geom.getCoordinates()).to.eql(
        ol.proj.transform([1, 2], 'EPSG:4326', 'EPSG:3857'));
    var newWkt = format.writeGeometry(geom, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    expect(newWkt).to.eql(wkt);
  });

  it('MultiPoint read / written correctly', function() {
    // there are two forms to test
    var wkt = 'MULTIPOINT((10 40),(40 30),(20 20),(30 10))';
    var geom = format.readGeometry(wkt);
    var points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40]);
    expect(points[1].getCoordinates()).to.eql([40, 30]);
    expect(points[2].getCoordinates()).to.eql([20, 20]);
    expect(points[3].getCoordinates()).to.eql([30, 10]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // this has whitespace
    wkt = 'MULTIPOINT (10 40, 40 30, 20 20, 30 10)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40]);
    expect(points[1].getCoordinates()).to.eql([40, 30]);
    expect(points[2].getCoordinates()).to.eql([20, 20]);
    expect(points[3].getCoordinates()).to.eql([30, 10]);
  });

  it('LineString read / written correctly', function() {
    var wkt = 'LINESTRING(30 10,10 30,40 40)';
    var geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(geom.getCoordinates()).to.eql([[30, 10], [10, 30], [40, 40]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING (30 10, 10 30, 40 40)';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(geom.getCoordinates()).to.eql([[30, 10], [10, 30], [40, 40]]);
  });

  it('MultiLineString read / written correctly', function() {
    var wkt = 'MULTILINESTRING((10 10,20 20,10 40),' +
        '(40 40,30 30,40 20,30 10))';
    var geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTI_LINE_STRING);
    var linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(linestrings[0].getCoordinates()).to.eql(
        [[10, 10], [20, 20], [10, 40]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'MULTILINESTRING ( (10 10, 20 20, 10 40), ' +
        '(40 40, 30 30, 40 20, 30 10) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTI_LINE_STRING);
    linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql(
        ol.geom.GeometryType.LINE_STRING);
    expect(linestrings[0].getCoordinates()).to.eql(
        [[10, 10], [20, 20], [10, 40]]);
  });

  it('Polygon read / written correctly', function() {
    var wkt = 'POLYGON((30 10,10 20,20 40,40 40,30 10))';
    var geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    var rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql(ol.geom.GeometryType.LINEAR_RING);
    expect(rings[0].getCoordinates()).to.eql(
        [[30, 10], [10, 20], [20, 40], [40, 40], [30, 10]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt = 'POLYGON((35 10,10 20,15 40,45 45,35 10),(20 30,30 20,35 35,20 30))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(2);
    expect(rings[0].getType()).to.eql(ol.geom.GeometryType.LINEAR_RING);
    expect(rings[1].getType()).to.eql(ol.geom.GeometryType.LINEAR_RING);
    expect(rings[0].getCoordinates()).to.eql(
        [[35, 10], [10, 20], [15, 40], [45, 45], [35, 10]]);
    expect(rings[1].getCoordinates()).to.eql(
        [[20, 30], [30, 20], [35, 35], [20, 30]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'POLYGON ( (30 10, 10 20, 20 40, 40 40, 30 10) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql(ol.geom.GeometryType.LINEAR_RING);
    expect(rings[0].getCoordinates()).to.eql(
        [[30, 10], [10, 20], [20, 40], [40, 40], [30, 10]]);
  });

  it('MultiPolygon read / written correctly', function() {
    // note that WKT doesn't care about winding order, we do
    var wkt = 'MULTIPOLYGON(((40 40,45 30,20 45,40 40)),' +
        '((20 35,45 20,30 5,10 10,10 30,20 35),(30 20,20 25,20 15,30 20)))';
    var geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTI_POLYGON);
    var polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(polygons[1].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql(
        [[40, 40], [45, 30], [20, 45], [40, 40]]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql(
        [[20, 35], [45, 20], [30, 5], [10, 10], [10, 30], [20, 35]]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql(
        [[30, 20], [20, 25], [20, 15], [30, 20]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'MULTIPOLYGON( ( ( 40 40,45 30, 20 45 ,40 40 )) ,' +
        '( (20 35, 45 20,30 5,10 10,10 30,20 35), ' +
        '( 30 20,  20 25,20 15  ,30 20 ) ))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTI_POLYGON);
    polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(polygons[1].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql(
        [[40, 40], [45, 30], [20, 45], [40, 40]]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql(
        [[20, 35], [45, 20], [30, 5], [10, 10], [10, 30], [20, 35]]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql(
        [[30, 20], [20, 25], [20, 15], [30, 20]]);
  });

  it('Empty geometries read / written correctly', function() {
    var wkts = ['POINT', 'LINESTRING', 'POLYGON',
                'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON'];
    for (var i = 0, ii = wkts.length; i < ii; ++i) {
      var wkt = wkts[i] + ' EMPTY';
      var geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([]);
      expect(format.writeGeometry(geom)).to.eql(wkt);
    }
  });

  it('Invalid geometries detected correctly', function() {
    expect(function() {
      format.readGeometry('POINT(1,2)');
    }).to.throwException();
    expect(function() {
      format.readGeometry('LINESTRING(1 2,3 4');
    }).to.throwException();
    expect(function() {
      format.readGeometry('POLYGON(1 2,3 4))');
    }).to.throwException();
    expect(function() {
      format.readGeometry('POLGON((1 2,3 4))');
    }).to.throwException();
    expect(function() {
      format.readGeometry('LINESTRING(1.2,3 4');
    }).to.throwException();
    expect(function() {
      format.readGeometry('MULTIPOINT((1 2),3 4))');
    }).to.throwException();
    expect(function() {
      format.readGeometry('MULTIPOLYGON((1 2,3 4))');
    }).to.throwException();
    expect(function() {
      format.readGeometry('GEOMETRYCOLLECTION(1 2,3 4)');
    }).to.throwException();
  });

  it('GeometryCollection read / written correctly', function() {
    var wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    var geom = format.readGeometry(wkt);
    var geoms = geom.getGeometries();
    expect(geoms.length).to.eql(2);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.GEOMETRY_COLLECTION);
    expect(geoms[0].getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(geoms[1].getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([[4, 6], [7, 10]]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'GEOMETRYCOLLECTION ( POINT (4 6), LINESTRING (4 6, 7 10) )';
    geom = format.readGeometry(wkt);
    geoms = geom.getGeometries();
    expect(geoms.length).to.eql(2);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.GEOMETRY_COLLECTION);
    expect(geoms[0].getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(geoms[1].getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([[4, 6], [7, 10]]);
  });

  it('Empty GeometryCollection read / written correctly', function() {
    var wkt = 'GEOMETRYCOLLECTION EMPTY';
    var geom = format.readGeometry(wkt);
    expect(geom.getGeometries()).to.eql([]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
  });

  it('GeometryCollection split / merged correctly', function() {
    format = new ol.format.WKT({splitCollection: true});
    var wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    var features = format.readFeatures(wkt);
    expect(features.length).to.eql(2);
    var geoms = [features[0].getGeometry(), features[1].getGeometry()];
    expect(geoms[0].getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(geoms[1].getType()).to.eql(ol.geom.GeometryType.LINE_STRING);
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([[4, 6], [7, 10]]);
    expect(format.writeFeatures(features)).to.eql(wkt);
  });

  it('Point feature read / written correctly', function() {
    var wkt = 'POINT(30 10)';
    var feature = format.readFeature(wkt);
    var geom = feature.getGeometry();
    expect(geom.getCoordinates()).to.eql([30, 10]);
    expect(format.writeFeature(feature)).to.eql(wkt);
  });

  it('Point feature transformed / read / written correctly', function() {
    var wkt = 'POINT(1 2)';
    var feature = format.readFeature(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    var geom = feature.getGeometry();
    expect(geom.getCoordinates()).to.eql(
        ol.proj.transform([1, 2], 'EPSG:4326', 'EPSG:3857'));
    var newWkt = format.writeFeature(feature, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    expect(newWkt).to.eql(wkt);
  });

  it('Features read / written correctly', function() {
    var wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4))';
    var features = format.readFeatures(wkt);
    expect(features.length).to.eql(2);
    var point1 = features[0].getGeometry();
    var point2 = features[1].getGeometry();
    expect(point1.getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(point2.getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(point1.getCoordinates()).to.eql([1, 2]);
    expect(point2.getCoordinates()).to.eql([3, 4]);
    expect(format.writeFeatures(features)).to.eql(wkt);
  });

  it('Features transformed / read / written correctly', function() {
    var wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(4 5))';
    var features = format.readFeatures(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    expect(features.length).to.eql(2);
    var point1 = features[0].getGeometry();
    var point2 = features[1].getGeometry();
    expect(point1.getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(point2.getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(point1.getCoordinates()).to.eql(
        ol.proj.transform([1, 2], 'EPSG:4326', 'EPSG:3857'));
    expect(point2.getCoordinates()).to.eql(
        ol.proj.transform([4, 5], 'EPSG:4326', 'EPSG:3857'));
    var newWkt = format.writeFeatures(features, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    expect(newWkt).to.eql(wkt);
  });

});

goog.require('ol.geom.GeometryType');
goog.require('ol.format.WKT');
goog.require('ol.proj');
