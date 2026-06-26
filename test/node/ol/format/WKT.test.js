import {assert} from 'chai';
import Feature from '../../../../src/ol/Feature.js';
import WKT from '../../../../src/ol/format/WKT.js';
import Point from '../../../../src/ol/geom/Point.js';
import {transform} from '../../../../src/ol/proj.js';

describe('ol/format/WKT.js', function () {
  let format = new WKT();

  describe('#readProjectionFromText', function () {
    it('returns the default projection', function () {
      const projection = format.readProjectionFromText('POINT(1 2)');
      assert.strictEqual(projection, undefined);
    });
  });

  describe('#readGeometry()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'POINT(1 2)';
      const geom = format.readGeometry(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      assert.deepEqual(
        geom.getCoordinates(),
        transform([1, 2], 'EPSG:4326', 'EPSG:3857'),
      );
    });
  });

  describe('#writeGeometry()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const geom = new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857');
      const wkt = format.writeGeometry(geom, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const got = format.readGeometry(wkt).getCoordinates();
      assert.approximately(got[0], 1, 1e-6);
      assert.approximately(got[1], 2, 1e-6);
    });
  });

  describe('#readFeature()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'POINT(1 2)';
      const feature = format.readFeature(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const geom = feature.getGeometry();
      assert.deepEqual(
        geom.getCoordinates(),
        transform([1, 2], 'EPSG:4326', 'EPSG:3857'),
      );
    });
  });

  describe('#writeFeature()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const feature = new Feature(
        new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857'),
      );
      const wkt = format.writeFeature(feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const gotFeature = format.readFeature(wkt);
      assert.instanceOf(gotFeature, Feature);
      const got = gotFeature.getGeometry().getCoordinates();
      assert.approximately(got[0], 1, 1e-6);
      assert.approximately(got[1], 2, 1e-6);
    });
  });

  describe('#readFeatures()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(4 5))';
      const features = format.readFeatures(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      assert.deepEqual(features.length, 2);
      const point1 = features[0].getGeometry();
      const point2 = features[1].getGeometry();
      assert.deepEqual(point1.getType(), 'Point');
      assert.deepEqual(point2.getType(), 'Point');
      assert.deepEqual(
        point1.getCoordinates(),
        transform([1, 2], 'EPSG:4326', 'EPSG:3857'),
      );
      assert.deepEqual(
        point2.getCoordinates(),
        transform([4, 5], 'EPSG:4326', 'EPSG:3857'),
      );
    });
  });

  describe('#writeFeatures()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const features = [
        new Feature(new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857')),
        new Feature(new Point([4, 5]).transform('EPSG:4326', 'EPSG:3857')),
      ];
      const wkt = format.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const gotFeatures = format.readFeatures(wkt);
      assert.lengthOf(gotFeatures, 2);
      assert.approximately(
        gotFeatures[0].getGeometry().getCoordinates()[0],
        1,
        1e-6,
      );
      assert.approximately(
        gotFeatures[0].getGeometry().getCoordinates()[1],
        2,
        1e-6,
      );
      assert.approximately(
        gotFeatures[1].getGeometry().getCoordinates()[0],
        4,
        1e-6,
      );
      assert.approximately(
        gotFeatures[1].getGeometry().getCoordinates()[1],
        5,
        1e-6,
      );
    });
  });

  it('Point read / written correctly', function () {
    let wkt = 'POINT(30 10)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'POINT (30 10)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10]);
  });

  it('Point Z read / written correctly', function () {
    let wkt = 'POINT Z(30 10 5)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'POINT Z (30 10 5)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5]);
  });

  it('Point M read / written correctly', function () {
    let wkt = 'POINT M(30 10 5)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'POINT M (30 10 5)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5]);
  });

  it('Point ZM read / written correctly', function () {
    let wkt = 'POINT ZM(30 10 5 0.1)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5, 0.1]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'POINT ZM (30 10 5 0.1)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getCoordinates(), [30, 10, 5, 0.1]);
  });

  it('MultiPoint read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT((10 40),(40 30),(20 20),(30 10))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // this has whitespace
    wkt = 'MULTIPOINT (10 40, 40 30, 20 20, 30 10)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10]);
  });

  it('MultiPoint Z read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT Z((10 40 1),(40 30 2),(20 20 3),(30 10 4))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT Z (10 40 1, 40 30 2, 20 20 3, 30 10 4)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4]);
  });

  it('MultiPoint M read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT M((10 40 1),(40 30 2),(20 20 3),(30 10 4))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT M (10 40 1, 40 30 2, 20 20 3, 30 10 4)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4]);
  });

  it('MultiPoint ZM read / written correctly', function () {
    // there are two forms to test
    let wkt =
      'MULTIPOINT ZM((10 40 1 0.1),(40 30 2 0.1),(20 20 3 0.1),(30 10 4 0.1))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1, 0.1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2, 0.1]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3, 0.1]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4, 0.1]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT ZM (10 40 1 0.1,40 30 2 0.1,20 20 3 0.1,30 10 4 0.1)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    assert.deepEqual(points.length, 4);
    assert.deepEqual(points[0].getCoordinates(), [10, 40, 1, 0.1]);
    assert.deepEqual(points[1].getCoordinates(), [40, 30, 2, 0.1]);
    assert.deepEqual(points[2].getCoordinates(), [20, 20, 3, 0.1]);
    assert.deepEqual(points[3].getCoordinates(), [30, 10, 4, 0.1]);
  });

  it('LineString read / written correctly', function () {
    let wkt = 'LINESTRING(30 10,10 30,40 40)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10],
      [10, 30],
      [40, 40],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'LINESTRING (30 10, 10 30, 40 40)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10],
      [10, 30],
      [40, 40],
    ]);
  });

  it('LineString Z read / written correctly', function () {
    let wkt = 'LINESTRING Z(30 10 1,10 30 2,40 40 3)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'LINESTRING Z (30 10 1, 10 30 2, 40 40 3)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
  });

  it('LineString M read / written correctly', function () {
    let wkt = 'LINESTRING M(30 10 1,10 30 2,40 40 3)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'LINESTRING M (30 10 1, 10 30 2, 40 40 3)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
  });

  it('LineString ZM read / written correctly', function () {
    let wkt = 'LINESTRING ZM(30 10 1 0.1,10 30 2 0.1,40 40 3 0.1)';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1, 0.1],
      [10, 30, 2, 0.1],
      [40, 40, 3, 0.1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'LINESTRING ZM (30 10 1 0.1, 10 30 2 0.1, 40 40 3 0.1)';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'LineString');
    assert.deepEqual(geom.getCoordinates(), [
      [30, 10, 1, 0.1],
      [10, 30, 2, 0.1],
      [40, 40, 3, 0.1],
    ]);
  });

  it('MultiLineString read / written correctly', function () {
    let wkt =
      'MULTILINESTRING((10 10,20 20,10 40),' + '(40 40,30 30,40 20,30 10))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    let linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10],
      [20, 20],
      [10, 40],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING ( (10 10, 20 20, 10 40), ' +
      '(40 40, 30 30, 40 20, 30 10) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10],
      [20, 20],
      [10, 40],
    ]);
  });

  it('MultiLineString Z read / written correctly', function () {
    let wkt =
      'MULTILINESTRING Z((10 10 1,20 20 2,10 40 3),' +
      '(40 40 1,30 30 2,40 20 3,30 10 4))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    let linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING Z ( (10 10 1, 20 20 2, 10 40 3), ' +
      '(40 40 1, 30 30 2, 40 20 3, 30 10 4) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
  });

  it('MultiLineString M read / written correctly', function () {
    let wkt =
      'MULTILINESTRING M((10 10 1,20 20 2,10 40 3),' +
      '(40 40 1,30 30 2,40 20 3,30 10 4))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    let linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING M ( (10 10 1, 20 20 2, 10 40 3), ' +
      '(40 40 1, 30 30 2, 40 20 3, 30 10 4) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
  });

  it('MultiLineString ZM read / written correctly', function () {
    let wkt =
      'MULTILINESTRING ZM((10 10 1 0.1,20 20 2 0.1,10 40 3 0.1),' +
      '(40 40 1 0.1,30 30 2 0.1,40 20 3 0.1,30 10 4 0.1))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    let linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1, 0.1],
      [20, 20, 2, 0.1],
      [10, 40, 3, 0.1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING ZM ( (10 10 1 0.1, 20 20 2 0.1, 10 40 3 0.1), ' +
      '(40 40 1 0.1, 30 30 2 0.1, 40 20 3 0.1, 30 10 4 0.1) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiLineString');
    linestrings = geom.getLineStrings();
    assert.deepEqual(linestrings.length, 2);
    assert.deepEqual(linestrings[0].getType(), 'LineString');
    assert.deepEqual(linestrings[0].getCoordinates(), [
      [10, 10, 1, 0.1],
      [20, 20, 2, 0.1],
      [10, 40, 3, 0.1],
    ]);
  });

  it('Polygon read / written correctly', function () {
    let wkt = 'POLYGON((30 10,10 20,20 40,40 40,30 10))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    let rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10],
      [10, 20],
      [20, 40],
      [40, 40],
      [30, 10],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // note that WKT doesn't care about winding order, we do
    wkt = 'POLYGON((35 10,10 20,15 40,45 45,35 10),(20 30,30 20,35 35,20 30))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 2);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[1].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [35, 10],
      [10, 20],
      [15, 40],
      [45, 45],
      [35, 10],
    ]);
    assert.deepEqual(rings[1].getCoordinates(), [
      [20, 30],
      [30, 20],
      [35, 35],
      [20, 30],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt = 'POLYGON ( (30 10, 10 20, 20 40, 40 40, 30 10) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10],
      [10, 20],
      [20, 40],
      [40, 40],
      [30, 10],
    ]);
  });

  it('Polygon Z read / written correctly', function () {
    let wkt = 'POLYGON Z((30 10 1,10 20 2,20 40 3,40 40 4,30 10 1))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    let rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON Z((35 10 1,10 20 2,15 40 3,45 45 4,35 10 1),(20 30 1,30 20 2,35 35 3,20 30 1))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 2);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[1].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [35, 10, 1],
      [10, 20, 2],
      [15, 40, 3],
      [45, 45, 4],
      [35, 10, 1],
    ]);
    assert.deepEqual(rings[1].getCoordinates(), [
      [20, 30, 1],
      [30, 20, 2],
      [35, 35, 3],
      [20, 30, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt = 'POLYGON  Z ( (30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 1) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
  });

  it('Polygon M read / written correctly', function () {
    let wkt = 'POLYGON M((30 10 1,10 20 2,20 40 3,40 40 4,30 10 1))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    let rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON M((35 10 1,10 20 2,15 40 3,45 45 4,35 10 1),(20 30 1,30 20 2,35 35 3,20 30 1))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 2);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[1].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [35, 10, 1],
      [10, 20, 2],
      [15, 40, 3],
      [45, 45, 4],
      [35, 10, 1],
    ]);
    assert.deepEqual(rings[1].getCoordinates(), [
      [20, 30, 1],
      [30, 20, 2],
      [35, 35, 3],
      [20, 30, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt = 'POLYGON  M ( (30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 1) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
  });

  it('Polygon ZM read / written correctly', function () {
    let wkt =
      'POLYGON ZM((30 10 1 0.1,10 20 2 0.1,20 40 3 0.1,40 40 4 0.1,30 10 1 0.1))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    let rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [20, 40, 3, 0.1],
      [40, 40, 4, 0.1],
      [30, 10, 1, 0.1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON ZM((35 10 1 0.1,10 20 2 0.1,15 40 3 0.1,45 45 4 0.1,35 10 1 0.1),(20 30 1 0.1,30 20 2 0.1,35 35 3 0.1,20 30 1 0.1))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 2);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[1].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [35, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [15, 40, 3, 0.1],
      [45, 45, 4, 0.1],
      [35, 10, 1, 0.1],
    ]);
    assert.deepEqual(rings[1].getCoordinates(), [
      [20, 30, 1, 0.1],
      [30, 20, 2, 0.1],
      [35, 35, 3, 0.1],
      [20, 30, 1, 0.1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt =
      'POLYGON  ZM ( (30 10 1 0.1, 10 20 2 0.1, 20 40 3 0.1, 40 40 4 0.1, 30 10 1 0.1) )';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'Polygon');
    rings = geom.getLinearRings();
    assert.deepEqual(rings.length, 1);
    assert.deepEqual(rings[0].getType(), 'LinearRing');
    assert.deepEqual(rings[0].getCoordinates(), [
      [30, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [20, 40, 3, 0.1],
      [40, 40, 4, 0.1],
      [30, 10, 1, 0.1],
    ]);
  });

  it('MultiPolygon read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON(((40 40,45 30,20 45,40 40)),' +
      '((20 35,45 20,30 5,10 10,10 30,20 35),(30 20,20 25,20 15,30 20)))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    let polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40],
      [45, 30],
      [20, 45],
      [40, 40],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35],
      [45, 20],
      [30, 5],
      [10, 10],
      [10, 30],
      [20, 35],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20],
      [20, 25],
      [20, 15],
      [30, 20],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON( ( ( 40 40,45 30, 20 45 ,40 40 )) ,' +
      '( (20 35, 45 20,30 5,10 10,10 30,20 35), ' +
      '( 30 20,  20 25,20 15  ,30 20 ) ))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40],
      [45, 30],
      [20, 45],
      [40, 40],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35],
      [45, 20],
      [30, 5],
      [10, 10],
      [10, 30],
      [20, 35],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20],
      [20, 25],
      [20, 15],
      [30, 20],
    ]);
  });

  it('MultiPolygon Z read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON Z(((40 40 1,45 30 2,20 45 3,40 40 1)),' +
      '((20 35 1,45 20 2,30 5 3,10 10 4,10 30 5,20 35 1),(30 20 1,20 25 2,20 15 3,30 20 1)))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    let polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON Z ( ( ( 40 40 1,45 30 2, 20 45 3 ,40 40 1 )) ,' +
      '( (20 35 1, 45 20 2,30 5 3,10 10 4,10 30 5,20 35 1), ' +
      '( 30 20 1,  20 25 2,20 15 3  ,30 20 1 ) ))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
  });

  it('MultiPolygon M read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON M(((40 40 1,45 30 2,20 45 3,40 40 1)),' +
      '((20 35 1,45 20 2,30 5 3,10 10 4,10 30 5,20 35 1),(30 20 1,20 25 2,20 15 3,30 20 1)))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    let polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON M ( ( ( 40 40 1,45 30 2, 20 45 3 ,40 40 1 )) ,' +
      '( (20 35 1, 45 20 2,30 5 3,10 10 4,10 30 5,20 35 1), ' +
      '( 30 20 1,  20 25 2,20 15 3  ,30 20 1 ) ))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
  });

  it('MultiPolygon ZM read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON ZM(((40 40 1 0.1,45 30 2 0.1,20 45 3 0.1,40 40 1 0.1)),' +
      '((20 35 1 0.1,45 20 2 0.1,30 5 3 0.1,10 10 4 0.1,10 30 5 0.1,20 35 1 0.1),(30 20 1 0.1,20 25 2 0.1,20 15 3 0.1,30 20 1 0.1)))';
    let geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    let polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1, 0.1],
      [45, 30, 2, 0.1],
      [20, 45, 3, 0.1],
      [40, 40, 1, 0.1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1, 0.1],
      [45, 20, 2, 0.1],
      [30, 5, 3, 0.1],
      [10, 10, 4, 0.1],
      [10, 30, 5, 0.1],
      [20, 35, 1, 0.1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1, 0.1],
      [20, 25, 2, 0.1],
      [20, 15, 3, 0.1],
      [30, 20, 1, 0.1],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON ZM ( ( ( 40 40 1 0.1,45 30 2 0.1, 20 45 3 0.1 ,40 40 1  0.1 )) ,' +
      '( (20 35 1 0.1, 45 20 2 0.1,30 5 3 0.1,10 10 4 0.1,10 30 5 0.1,20 35 1 0.1), ' +
      '( 30 20 1 0.1,  20 25 2 0.1,20 15 3 0.1  ,30 20 1 0.1 ) ))';
    geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getType(), 'MultiPolygon');
    polygons = geom.getPolygons();
    assert.deepEqual(polygons.length, 2);
    assert.deepEqual(polygons[0].getType(), 'Polygon');
    assert.deepEqual(polygons[1].getType(), 'Polygon');
    assert.deepEqual(polygons[0].getLinearRings().length, 1);
    assert.deepEqual(polygons[1].getLinearRings().length, 2);
    assert.deepEqual(polygons[0].getLinearRings()[0].getCoordinates(), [
      [40, 40, 1, 0.1],
      [45, 30, 2, 0.1],
      [20, 45, 3, 0.1],
      [40, 40, 1, 0.1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[0].getCoordinates(), [
      [20, 35, 1, 0.1],
      [45, 20, 2, 0.1],
      [30, 5, 3, 0.1],
      [10, 10, 4, 0.1],
      [10, 30, 5, 0.1],
      [20, 35, 1, 0.1],
    ]);
    assert.deepEqual(polygons[1].getLinearRings()[1].getCoordinates(), [
      [30, 20, 1, 0.1],
      [20, 25, 2, 0.1],
      [20, 15, 3, 0.1],
      [30, 20, 1, 0.1],
    ]);
  });

  it('Empty geometries read / written correctly', function () {
    const wkt = 'POINT EMPTY';
    const geom = format.readGeometry(wkt);
    const coordinates = geom.getCoordinates();
    assert.strictEqual(coordinates.length, 2);
    assert.strictEqual(isNaN(coordinates[0]), true);
    assert.strictEqual(isNaN(coordinates[1]), true);
    const wkts = [
      'LINESTRING',
      'POLYGON',
      'MULTIPOINT',
      'MULTILINESTRING',
      'MULTIPOLYGON',
    ];
    for (let i = 0, ii = wkts.length; i < ii; ++i) {
      const wkt = wkts[i] + ' EMPTY';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), []);
      assert.deepEqual(format.writeGeometry(geom), wkt);
    }
  });

  it('Invalid geometries detected correctly', function () {
    assert.throws(function () {
      format.readGeometry('POINT(1,2)');
    });
    assert.throws(function () {
      format.readGeometry('LINESTRING(1 2,3 4');
    });
    assert.throws(function () {
      format.readGeometry('POLYGON(1 2,3 4))');
    });
    assert.throws(function () {
      format.readGeometry('POLGON((1 2,3 4))');
    });
    assert.throws(function () {
      format.readGeometry('LINESTRING(1.2,3 4');
    });
    assert.throws(function () {
      format.readGeometry('MULTIPOINT((1 2),3 4))');
    });
    assert.throws(function () {
      format.readGeometry('MULTIPOLYGON((1 2,3 4))');
    });
    assert.throws(function () {
      format.readGeometry('GEOMETRYCOLLECTION(1 2,3 4)');
    });
  });

  it('GeometryCollection read / written correctly', function () {
    let wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    let geom = format.readGeometry(wkt);
    let geoms = geom.getGeometries();
    assert.deepEqual(geoms.length, 2);
    assert.deepEqual(geom.getType(), 'GeometryCollection');
    assert.deepEqual(geoms[0].getType(), 'Point');
    assert.deepEqual(geoms[1].getType(), 'LineString');
    assert.deepEqual(geoms[0].getCoordinates(), [4, 6]);
    assert.deepEqual(geoms[1].getCoordinates(), [
      [4, 6],
      [7, 10],
    ]);
    assert.deepEqual(format.writeGeometry(geom), wkt);
    // test whitespace when reading
    wkt = 'GEOMETRYCOLLECTION ( POINT (4 6), LINESTRING (4 6, 7 10) )';
    geom = format.readGeometry(wkt);
    geoms = geom.getGeometries();
    assert.deepEqual(geoms.length, 2);
    assert.deepEqual(geom.getType(), 'GeometryCollection');
    assert.deepEqual(geoms[0].getType(), 'Point');
    assert.deepEqual(geoms[1].getType(), 'LineString');
    assert.deepEqual(geoms[0].getCoordinates(), [4, 6]);
    assert.deepEqual(geoms[1].getCoordinates(), [
      [4, 6],
      [7, 10],
    ]);
  });

  it('Empty GeometryCollection read / written correctly', function () {
    const wkt = 'GEOMETRYCOLLECTION EMPTY';
    const geom = format.readGeometry(wkt);
    assert.deepEqual(geom.getGeometries(), []);
    assert.deepEqual(format.writeGeometry(geom), wkt);
  });

  it('GeometryCollection split / merged correctly', function () {
    format = new WKT({splitCollection: true});
    const wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    const features = format.readFeatures(wkt);
    assert.deepEqual(features.length, 2);
    const geoms = [features[0].getGeometry(), features[1].getGeometry()];
    assert.deepEqual(geoms[0].getType(), 'Point');
    assert.deepEqual(geoms[1].getType(), 'LineString');
    assert.deepEqual(geoms[0].getCoordinates(), [4, 6]);
    assert.deepEqual(geoms[1].getCoordinates(), [
      [4, 6],
      [7, 10],
    ]);
    assert.deepEqual(format.writeFeatures(features), wkt);
  });

  it('Point feature read / written correctly', function () {
    const wkt = 'POINT(30 10)';
    const feature = format.readFeature(wkt);
    const geom = feature.getGeometry();
    assert.deepEqual(geom.getCoordinates(), [30, 10]);
    assert.deepEqual(format.writeFeature(feature), wkt);
  });

  it('Features read / written correctly', function () {
    const wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4))';
    const features = format.readFeatures(wkt);
    assert.deepEqual(features.length, 2);
    const point1 = features[0].getGeometry();
    const point2 = features[1].getGeometry();
    assert.deepEqual(point1.getType(), 'Point');
    assert.deepEqual(point2.getType(), 'Point');
    assert.deepEqual(point1.getCoordinates(), [1, 2]);
    assert.deepEqual(point2.getCoordinates(), [3, 4]);
    assert.deepEqual(format.writeFeatures(features), wkt);
  });

  describe('scientific notation supported', function () {
    it('handles scientific notation correctly', function () {
      const wkt = 'POINT(3e1 1e1)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [30, 10]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(30 10)');
    });

    it('works with with negative exponent', function () {
      const wkt = 'POINT(3e-1 1e-1)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [0.3, 0.1]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(0.3 0.1)');
    });

    it('works with with explicitly positive exponent', function () {
      const wkt = 'POINT(3e+1 1e+1)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [30, 10]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(30 10)');
    });

    it('handles very small numbers in scientific notation', function () {
      // very small numbers keep the scientific notation, both when reading and
      // writing
      const wkt = 'POINT(3e-9 1e-9)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [3e-9, 1e-9]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(3e-9 1e-9)');
    });

    it('handles very big numbers in scientific notation', function () {
      // very big numbers keep the scientific notation, both when reading and
      // writing
      const wkt = 'POINT(3e25 1e25)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [3e25, 1e25]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(3e+25 1e+25)');
    });

    it('works case insensitively (e / E)', function () {
      const wkt = 'POINT(3E1 1E1)';
      const geom = format.readGeometry(wkt);
      assert.deepEqual(geom.getCoordinates(), [30, 10]);
      assert.deepEqual(format.writeGeometry(geom), 'POINT(30 10)');
    });

    it('detects invalid scientific notation', function () {
      assert.throws(function () {
        // note the double 'e'
        format.readGeometry('POINT(3ee1 10)');
      });
    });
  });
});
