goog.provide('ol.test.parser.WKT');

describe('ol.parser.WKT', function() {

  var parser = new ol.parser.WKT();

  it('Point read / written correctly', function() {
    var wkt = 'POINT(30 10)';
    var geom = parser.read(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
    expect(parser.write(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT (30 10)';
    geom = parser.read(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
  });

  it('MultiPoint read / written correctly', function() {
    // there are two forms to test
    var wkt = 'MULTIPOINT((10 40),(40 30),(20 20),(30 10))';
    var geom = parser.read(wkt);
    expect(geom.components.length).to.eql(4);
    expect(geom.components[0].getCoordinates()).to.eql([10, 40]);
    expect(geom.components[1].getCoordinates()).to.eql([40, 30]);
    expect(geom.components[2].getCoordinates()).to.eql([20, 20]);
    expect(geom.components[3].getCoordinates()).to.eql([30, 10]);
    expect(parser.write(geom)).to.eql(wkt);
    // this has whitespace
    wkt = 'MULTIPOINT (10 40, 40 30, 20 20, 30 10)';
    geom = parser.read(wkt);
    expect(geom.components.length).to.eql(4);
    expect(geom.components[0].getCoordinates()).to.eql([10, 40]);
    expect(geom.components[1].getCoordinates()).to.eql([40, 30]);
    expect(geom.components[2].getCoordinates()).to.eql([20, 20]);
    expect(geom.components[3].getCoordinates()).to.eql([30, 10]);
  });

  it('LineString read / written correctly', function() {
    var wkt = 'LINESTRING(30 10,10 30,40 40)';
    var geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.LINESTRING);
    expect(geom.getCoordinates()).to.eql([[30, 10], [10, 30], [40, 40]]);
    expect(parser.write(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING (30 10, 10 30, 40 40)';
    geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.LINESTRING);
    expect(geom.getCoordinates()).to.eql([[30, 10], [10, 30], [40, 40]]);
  });

  it('MultiLineString read / written correctly', function() {
    var wkt = 'MULTILINESTRING((10 10,20 20,10 40),' +
        '(40 40,30 30,40 20,30 10))';
    var geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTILINESTRING);
    expect(geom.components.length).to.eql(2);
    expect(geom.components[0].getType()).to.eql(
        ol.geom.GeometryType.LINESTRING);
    expect(geom.components[0].getCoordinates()).to.eql(
        [[10, 10], [20, 20], [10, 40]]);
    expect(parser.write(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'MULTILINESTRING ( (10 10, 20 20, 10 40), ' +
        '(40 40, 30 30, 40 20, 30 10) )';
    geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTILINESTRING);
    expect(geom.components.length).to.eql(2);
    expect(geom.components[0].getType()).to.eql(
        ol.geom.GeometryType.LINESTRING);
    expect(geom.components[0].getCoordinates()).to.eql(
        [[10, 10], [20, 20], [10, 40]]);
  });

  it('Polygon read / written correctly', function() {
    var wkt = 'POLYGON((30 10,10 20,20 40,40 40,30 10))';
    var geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.rings.length).to.eql(1);
    expect(geom.rings[0].getType()).to.eql(ol.geom.GeometryType.LINEARRING);
    expect(geom.rings[0].getCoordinates()).to.eql(
        [[30, 10], [10, 20], [20, 40], [40, 40], [30, 10]]);
    expect(parser.write(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt = 'POLYGON((35 10,10 20,15 40,45 45,35 10),(20 30,30 20,35 35,20 30))';
    geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.rings.length).to.eql(2);
    expect(geom.rings[0].getType()).to.eql(ol.geom.GeometryType.LINEARRING);
    expect(geom.rings[1].getType()).to.eql(ol.geom.GeometryType.LINEARRING);
    expect(geom.rings[0].getCoordinates()).to.eql(
        [[35, 10], [10, 20], [15, 40], [45, 45], [35, 10]]);
    expect(geom.rings[1].getCoordinates()).to.eql(
        [[20, 30], [30, 20], [35, 35], [20, 30]]);
    expect(parser.write(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'POLYGON ( (30 10, 10 20, 20 40, 40 40, 30 10) )';
    geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.rings.length).to.eql(1);
    expect(geom.rings[0].getType()).to.eql(ol.geom.GeometryType.LINEARRING);
    expect(geom.rings[0].getCoordinates()).to.eql(
        [[30, 10], [10, 20], [20, 40], [40, 40], [30, 10]]);
  });

  it('MultiPolygon read / written correctly', function() {
    // note that WKT doesn't care about winding order, we do
    var wkt = 'MULTIPOLYGON(((40 40,45 30,20 45,40 40)),' +
        '((20 35,45 20,30 5,10 10,10 30,20 35),(30 20,20 25,20 15,30 20)))';
    var geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTIPOLYGON);
    expect(geom.components.length).to.eql(2);
    expect(geom.components[0].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.components[1].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.components[0].rings.length).to.eql(1);
    expect(geom.components[1].rings.length).to.eql(2);
    expect(geom.components[0].rings[0].getCoordinates()).to.eql(
        [[40, 40], [45, 30], [20, 45], [40, 40]]);
    expect(geom.components[1].rings[0].getCoordinates()).to.eql(
        [[20, 35], [45, 20], [30, 5], [10, 10], [10, 30], [20, 35]]);
    expect(geom.components[1].rings[1].getCoordinates()).to.eql(
        [[30, 20], [20, 25], [20, 15], [30, 20]]);
    expect(parser.write(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'MULTIPOLYGON( ( ( 40 40,45 30, 20 45 ,40 40 )) ,' +
        '( (20 35, 45 20,30 5,10 10,10 30,20 35), ' +
        '( 30 20,  20 25,20 15  ,30 20 ) ))';
    geom = parser.read(wkt);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.MULTIPOLYGON);
    expect(geom.components.length).to.eql(2);
    expect(geom.components[0].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.components[1].getType()).to.eql(ol.geom.GeometryType.POLYGON);
    expect(geom.components[0].rings.length).to.eql(1);
    expect(geom.components[1].rings.length).to.eql(2);
    expect(geom.components[0].rings[0].getCoordinates()).to.eql(
        [[40, 40], [45, 30], [20, 45], [40, 40]]);
    expect(geom.components[1].rings[0].getCoordinates()).to.eql(
        [[20, 35], [45, 20], [30, 5], [10, 10], [10, 30], [20, 35]]);
    expect(geom.components[1].rings[1].getCoordinates()).to.eql(
        [[30, 20], [20, 25], [20, 15], [30, 20]]);
  });

  it('GeometryCollection read / written correctly', function() {
    var wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    var geom = parser.read(wkt);
    expect(geom.components.length).to.eql(2);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.GEOMETRYCOLLECTION);
    expect(geom.components[0].getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(geom.components[1].getType()).to.eql(
        ol.geom.GeometryType.LINESTRING);
    expect(geom.components[0].getCoordinates()).to.eql([4, 6]);
    expect(geom.components[1].getCoordinates()).to.eql([[4, 6], [7, 10]]);
    expect(parser.write(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'GEOMETRYCOLLECTION ( POINT (4 6), LINESTRING (4 6, 7 10) )';
    geom = parser.read(wkt);
    expect(geom.components.length).to.eql(2);
    expect(geom.getType()).to.eql(ol.geom.GeometryType.GEOMETRYCOLLECTION);
    expect(geom.components[0].getType()).to.eql(ol.geom.GeometryType.POINT);
    expect(geom.components[1].getType()).to.eql(
        ol.geom.GeometryType.LINESTRING);
    expect(geom.components[0].getCoordinates()).to.eql([4, 6]);
    expect(geom.components[1].getCoordinates()).to.eql([[4, 6], [7, 10]]);
  });

});

goog.require('ol.geom.GeometryType');
goog.require('ol.parser.WKT');
