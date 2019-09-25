import Feature from '../../../../src/ol/Feature.js';
import {find} from '../../../../src/ol/array.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import KML, {getDefaultStyle, getDefaultStyleArray, getDefaultFillStyle, getDefaultImageStyle, getDefaultStrokeStyle, getDefaultTextStyle, readFlatCoordinates} from '../../../../src/ol/format/KML.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {addProjection, addCoordinateTransforms, transform, get as getProjection} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import {remove as removeTransform} from '../../../../src/ol/proj/transforms.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import IconAnchorUnits from '../../../../src/ol/style/IconAnchorUnits.js';
import IconOrigin from '../../../../src/ol/style/IconOrigin.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import {parse} from '../../../../src/ol/xml.js';


describe('ol.format.KML', () => {

  let format;

  describe('using defaultStyle', () => {

    const dfltStyle = new Style();

    beforeEach(() => {
      format = new KML({
        defaultStyle: [dfltStyle]
      });
    });

    test('set constant variables', () => {
      expect(getDefaultStyleArray()).toBeInstanceOf(Array);
    });

    describe('#readFeatures', () => {

      test('can apply a default style to a feature', () => {
        const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark/>' +
            '  </Document>' +
            '</kml>';
        const fs = format.readFeatures(text);
        expect(fs).toHaveLength(1);
        const f = fs[0];
        expect(f).toBeInstanceOf(Feature);
        const styleFunction = f.getStyleFunction();
        expect(styleFunction).not.toBe(undefined);
        const styleArray = styleFunction(f, 0);
        expect(styleArray).toBeInstanceOf(Array);
        expect(styleArray).toHaveLength(1);
        const style = styleArray[0];
        expect(style).toBeInstanceOf(Style);
        expect(style).toBe(dfltStyle);
      });
    });
  });

  describe('without parameters', () => {

    beforeEach(() => {
      format = new KML();
    });

    test('set constant variables', () => {
      expect(getDefaultStyleArray()).toBeInstanceOf(Array);
    });

    describe('#readProjection', () => {
      test('returns the default projection from document', () => {
        const projection = format.readProjectionFromDocument();
        expect(projection).toEqual(getProjection('EPSG:4326'));
      });

      test('returns the default projection from node', () => {
        const projection = format.readProjectionFromNode();
        expect(projection).toEqual(getProjection('EPSG:4326'));
      });
    });

    describe('#readFeatures', () => {

      describe('id', () => {

        test('can read a Feature\'s id', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark id="foo"/>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getId()).toBe('foo');
        });

        test('treats a missing id as undefined', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark/>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getId()).toBe(undefined);
        });

        test('can write a Feature', () => {
          const features = [new Feature()];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark/>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write a Feature as string', () => {
          const features = [new Feature()];
          const node = format.writeFeatures(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark/>' +
              '</kml>';
          expect(parse(node)).to.xmleql(parse(text));
        });

        test('can write a Feature\'s id', () => {
          const feature = new Feature();
          feature.setId('foo');
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark id="foo"/>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

      });

      describe('geometry', () => {

        test('treats a missing geometry as null', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark/>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBe(null);
        });

        test('can write feature with null geometries', () => {
          const features = [new Feature(null)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark/>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });


        test('can write properties', () => {
          const lineString = new LineString([[1, 2], [3, 4]]);
          lineString.set('extrude', false);
          lineString.set('tessellate', true);
          lineString.set('altitudeMode', 'clampToGround');
          lineString.set('unsupportedProperty', 'foo');
          const features = [new Feature(lineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <extrude>0</extrude>' +
              '      <tessellate>1</tessellate>' +
              '      <altitudeMode>clampToGround</altitudeMode>' +
              '      <coordinates>1,2 3,4</coordinates>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read Point geometries', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '      <extrude>0</extrude>' +
              '      <altitudeMode>absolute</altitudeMode>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Point);
          expect(g.getCoordinates()).toEqual([1, 2, 3]);
          expect(g.get('extrude')).toBe(false);
          expect(g.get('altitudeMode')).toBe('absolute');
        });

        test('can transform and read Point geometries', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text, {
            featureProjection: 'EPSG:3857'
          });
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          expect(g.getCoordinates()).toEqual(expectedPoint);
        });

        test('can read a single Point geometry', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const f = format.readFeature(text);
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Point);
          expect(g.getCoordinates()).toEqual([1, 2, 3]);
        });

        test('can transform and read a single Point geometry', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const f = format.readFeature(text, {
            featureProjection: 'EPSG:3857'
          });
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          expect(g.getCoordinates()).toEqual(expectedPoint);
        });

        test('can write XY Point geometries', () => {
          const layout = 'XY';
          const point = new Point([1, 2], layout);
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZ Point geometries', () => {
          const layout = 'XYZ';
          const point = new Point([1, 2, 3], layout);
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can transform and write XYZ Point geometries', () => {
          addProjection(new Projection({code: 'double'}));
          addCoordinateTransforms('EPSG:4326', 'double',
            function(coordinate) {
              return [2 * coordinate[0], 2 * coordinate[1]];
            },
            function(coordinate) {
              return [coordinate[0] / 2, coordinate[1] / 2];
            });

          const layout = 'XYZ';
          const point = new Point([1, 2, 3], layout).transform(
            'EPSG:4326', 'double');
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features, {
            featureProjection: 'double'
          });
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));

          removeTransform(getProjection('EPSG:4326'), getProjection('double'));
          removeTransform(getProjection('double'), getProjection('EPSG:4326'));
        });

        test('can write XYM Point geometries', () => {
          const layout = 'XYM';
          const point = new Point([1, 2, 100], layout);
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZM Point geometries', () => {
          const layout = 'XYZM';
          const point = new Point([1, 2, 3, 100], layout);
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read LineString geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <coordinates>1,2,3 4,5,6</coordinates>' +
              '      <extrude>0</extrude>' +
              '      <tessellate>1</tessellate>' +
              '      <altitudeMode>absolute</altitudeMode>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(LineString);
          expect(g.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
          expect(g.get('extrude')).toBe(false);
          expect(g.get('tessellate')).toBe(true);
          expect(g.get('altitudeMode')).toBe('absolute');
        });

        test('can write XY LineString geometries', () => {
          const layout = 'XY';
          const lineString = new LineString([[1, 2], [3, 4]], layout);
          const features = [new Feature(lineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <coordinates>1,2 3,4</coordinates>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZ LineString geometries', () => {
          const layout = 'XYZ';
          const lineString = new LineString(
            [[1, 2, 3], [4, 5, 6]], layout);
          const features = [new Feature(lineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <coordinates>1,2,3 4,5,6</coordinates>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYM LineString geometries', () => {
          const layout = 'XYM';
          const lineString = new LineString(
            [[1, 2, 100], [3, 4, 200]], layout);
          const features = [new Feature(lineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <coordinates>1,2 3,4</coordinates>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZM LineString geometries', () => {
          const layout = 'XYZM';
          const lineString = new LineString(
            [[1, 2, 3, 100], [4, 5, 6, 200]], layout);
          const features = [new Feature(lineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LineString>' +
              '      <coordinates>1,2,3 4,5,6</coordinates>' +
              '    </LineString>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read LinearRing geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <LinearRing>' +
              '      <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
              '    </LinearRing>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Polygon);
          expect(g.getCoordinates()).toEqual([[[1, 2, 3], [4, 5, 6], [7, 8, 9]]]);
        });

        test('can write XY LinearRing geometries', () => {
          const layout = 'XY';
          const linearRing = new LinearRing(
            [[1, 2], [3, 4], [1, 2]], layout);
          const features = [new Feature(linearRing)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LinearRing>' +
              '      <coordinates>1,2 3,4 1,2</coordinates>' +
              '    </LinearRing>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZ LinearRing geometries', () => {
          const layout = 'XYZ';
          const linearRing = new LinearRing(
            [[1, 2, 3], [4, 5, 6], [1, 2, 3]], layout);
          const features = [new Feature(linearRing)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LinearRing>' +
              '      <coordinates>1,2,3 4,5,6 1,2,3</coordinates>' +
              '    </LinearRing>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYM LinearRing geometries', () => {
          const layout = 'XYM';
          const linearRing = new LinearRing(
            [[1, 2, 100], [3, 4, 200], [1, 2, 100]], layout);
          const features = [new Feature(linearRing)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LinearRing>' +
              '      <coordinates>1,2 3,4 1,2</coordinates>' +
              '    </LinearRing>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZM LinearRing geometries', () => {
          const layout = 'XYZM';
          const linearRing = new LinearRing(
            [[1, 2, 3, 100], [4, 5, 6, 200], [1, 2, 3, 100]], layout);
          const features = [new Feature(linearRing)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <LinearRing>' +
              '      <coordinates>1,2,3 4,5,6 1,2,3</coordinates>' +
              '    </LinearRing>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read Polygon geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <extrude>0</extrude>' +
              '      <altitudeMode>absolute</altitudeMode>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Polygon);
          expect(g.getCoordinates()).toEqual([[[0, 0, 1], [0, 5, 1], [5, 5, 2], [5, 0, 3]]]);
          expect(g.get('extrude')).toBe(false);
          expect(g.get('altitudeMode')).toBe('absolute');
        });

        test('can write XY Polygon geometries', () => {
          const layout = 'XY';
          const polygon = new Polygon(
            [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]], layout);
          const features = [new Feature(polygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>0,0 0,2 2,2 2,0 0,0</coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZ Polygon geometries', () => {
          const layout = 'XYZ';
          const polygon = new Polygon(
            [[[0, 0, 1], [0, 2, 2], [2, 2, 3], [2, 0, 4], [0, 0, 5]]], layout);
          const features = [new Feature(polygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>' +
              '            0,0,1 0,2,2 2,2,3 2,0,4 0,0,5' +
              '          </coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYM Polygon geometries', () => {
          const layout = 'XYM';
          const polygon = new Polygon(
            [[[0, 0, 1], [0, 2, 1], [2, 2, 1], [2, 0, 1], [0, 0, 1]]], layout);
          const features = [new Feature(polygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>' +
              '            0,0 0,2 2,2 2,0 0,0' +
              '          </coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write XYZM Polygon geometries', () => {
          const layout = 'XYZM';
          const polygon = new Polygon([
            [[0, 0, 1, 1], [0, 2, 2, 1], [2, 2, 3, 1], [2, 0, 4, 1], [0, 0, 5, 1]]
          ], layout);
          const features = [new Feature(polygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '        <coordinates>0,0,1 0,2,2 2,2,3 2,0,4 0,0,5</coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read complex Polygon geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <innerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>1,1,0 1,2,0 2,2,0 2,1,0</coordinates>' +
              '        </LinearRing>' +
              '      </innerBoundaryIs>' +
              '      <innerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>3,3,0 3,4,0 4,4,0 4,3,0</coordinates>' +
              '        </LinearRing>' +
              '      </innerBoundaryIs>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Polygon);
          expect(g.getCoordinates()).toEqual([
            [[0, 0, 1], [0, 5, 1], [5, 5, 2], [5, 0, 3]],
            [[1, 1, 0], [1, 2, 0], [2, 2, 0], [2, 1, 0]],
            [[3, 3, 0], [3, 4, 0], [4, 4, 0], [4, 3, 0]]
          ]);
        });

        test('can write complex Polygon geometries', () => {
          const layout = 'XYZ';
          const polygon = new Polygon([
            [[0, 0, 1], [0, 5, 1], [5, 5, 2], [5, 0, 3]],
            [[1, 1, 0], [1, 2, 0], [2, 2, 0], [2, 1, 0]],
            [[3, 3, 0], [3, 4, 0], [4, 4, 0], [4, 3, 0]]
          ], layout);
          const features = [new Feature(polygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <innerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>1,1,0 1,2,0 2,2,0 2,1,0</coordinates>' +
              '        </LinearRing>' +
              '      </innerBoundaryIs>' +
              '      <innerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>3,3,0 3,4,0 4,4,0 4,3,0</coordinates>' +
              '        </LinearRing>' +
              '      </innerBoundaryIs>' +
              '      <outerBoundaryIs>' +
              '        <LinearRing>' +
              '          <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>' +
              '        </LinearRing>' +
              '      </outerBoundaryIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read MultiPolygon geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Polygon>' +
              '        <extrude>0</extrude>' +
              '        <altitudeMode>absolute</altitudeMode>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(MultiPolygon);
          expect(g.getCoordinates()).toEqual([[[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
            [[[3, 0, 0], [3, 1, 0], [4, 1, 0], [4, 0, 0]]]]);
          expect(g.get('extrude')).toBeInstanceOf(Array);
          expect(g.get('extrude')).toHaveLength(2);
          expect(g.get('extrude')[0]).toBe(false);
          expect(g.get('extrude')[1]).toBe(undefined);
          expect(g.get('altitudeMode')).toBeInstanceOf(Array);
          expect(g.get('altitudeMode')).toHaveLength(2);
          expect(g.get('altitudeMode')[0]).toBe('absolute');
          expect(g.get('altitudeMode')[1]).toBe(undefined);
        });

        test('can write MultiPolygon geometries', () => {
          const layout = 'XYZ';
          const multiPolygon = new MultiPolygon(
            [[[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
              [[[3, 0, 0], [3, 1, 0], [4, 1, 0], [4, 0, 0]]]], layout);
          const features = [new Feature(multiPolygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read MultiPoint geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Point>' +
              '        <coordinates>1,2,3</coordinates>' +
              '        <extrude>0</extrude>' +
              '        <altitudeMode>absolute</altitudeMode>' +
              '      </Point>' +
              '      <Point>' +
              '        <coordinates>4,5,6</coordinates>' +
              '        <extrude>1</extrude>' +
              '        <altitudeMode>clampToGround</altitudeMode>' +
              '      </Point>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(MultiPoint);
          expect(g.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
          expect(g.get('extrude')).toBeInstanceOf(Array);
          expect(g.get('extrude')).toHaveLength(2);
          expect(g.get('extrude')[0]).toBe(false);
          expect(g.get('extrude')[1]).toBe(true);
          expect(g.get('altitudeMode')).toBeInstanceOf(Array);
          expect(g.get('altitudeMode')).toHaveLength(2);
          expect(g.get('altitudeMode')[0]).toBe('absolute');
          expect(g.get('altitudeMode')[1]).toBe('clampToGround');
        });

        test('can write MultiPoint geometries', () => {
          const layout = 'XYZ';
          const multiPoint = new MultiPoint(
            [[1, 2, 3], [4, 5, 6]], layout);
          const features = [new Feature(multiPoint)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Point>' +
              '        <coordinates>1,2,3</coordinates>' +
              '      </Point>' +
              '      <Point>' +
              '        <coordinates>4,5,6</coordinates>' +
              '      </Point>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read MultiLineString geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <LineString>' +
              '        <extrude>0</extrude>' +
              '        <tessellate>0</tessellate>' +
              '        <altitudeMode>absolute</altitudeMode>' +
              '        <coordinates>1,2,3 4,5,6</coordinates>' +
              '      </LineString>' +
              '      <LineString>' +
              '        <coordinates>7,8,9 10,11,12</coordinates>' +
              '      </LineString>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(MultiLineString);
          expect(g.getCoordinates()).toEqual([[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
          expect(g.get('extrude')).toBeInstanceOf(Array);
          expect(g.get('extrude')).toHaveLength(2);
          expect(g.get('extrude')[0]).toBe(false);
          expect(g.get('extrude')[1]).toBe(undefined);
          expect(g.get('tessellate')).toBeInstanceOf(Array);
          expect(g.get('tessellate')).toHaveLength(2);
          expect(g.get('tessellate')[0]).toBe(false);
          expect(g.get('tessellate')[1]).toBe(undefined);
          expect(g.get('altitudeMode')).toBeInstanceOf(Array);
          expect(g.get('altitudeMode')).toHaveLength(2);
          expect(g.get('altitudeMode')[0]).toBe('absolute');
          expect(g.get('altitudeMode')[1]).toBe(undefined);
        });

        test('can write MultiLineString geometries', () => {
          const layout = 'XYZ';
          const multiLineString = new MultiLineString(
            [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]], layout);
          const features = [new Feature(multiLineString)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <LineString>' +
              '        <coordinates>1,2,3 4,5,6</coordinates>' +
              '      </LineString>' +
              '      <LineString>' +
              '        <coordinates>7,8,9 10,11,12</coordinates>' +
              '      </LineString>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read MultiPolygon geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Polygon>' +
              '        <extrude>0</extrude>' +
              '        <altitudeMode>absolute</altitudeMode>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(MultiPolygon);
          expect(g.getCoordinates()).toEqual([
            [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
            [[[3, 0, 0], [3, 1, 0], [4, 1, 0], [4, 0, 0]]]
          ]);
          expect(g.get('extrude')).toBeInstanceOf(Array);
          expect(g.get('extrude')).toHaveLength(2);
          expect(g.get('extrude')[0]).toBe(false);
          expect(g.get('extrude')[1]).toBe(undefined);
          expect(g.get('altitudeMode')).toBeInstanceOf(Array);
          expect(g.get('altitudeMode')).toHaveLength(2);
          expect(g.get('altitudeMode')[0]).toBe('absolute');
          expect(g.get('altitudeMode')[1]).toBe(undefined);
        });

        test('can write MultiPolygon geometries', () => {
          const layout = 'XYZ';
          const multiPolygon = new MultiPolygon([
            [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
            [[[3, 0, 0], [3, 1, 0], [4, 1, 0], [4, 0, 0]]]
          ], layout);
          const features = [new Feature(multiPolygon)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read empty GeometryCollection geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(GeometryCollection);
          expect(g.getGeometries()).toHaveLength(0);
        });

        test('can read heterogeneous GeometryCollection geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Point>' +
              '        <coordinates>1,2,3</coordinates>' +
              '      </Point>' +
              '      <LineString>' +
              '        <coordinates>1,2,3 4,5,6</coordinates>' +
              '      </LineString>' +
              '      <LinearRing>' +
              '        <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
              '      </LinearRing>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(GeometryCollection);
          const gs = g.getGeometries();
          expect(gs).toHaveLength(4);
          expect(gs[0]).toBeInstanceOf(Point);
          expect(gs[1]).toBeInstanceOf(LineString);
          expect(gs[2]).toBeInstanceOf(Polygon);
          expect(gs[3]).toBeInstanceOf(Polygon);
        });

        test('can read nested GeometryCollection geometries', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <MultiGeometry>' +
              '      </MultiGeometry>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(GeometryCollection);
          const gs = g.getGeometries();
          expect(gs).toHaveLength(1);
          expect(gs[0]).toBeInstanceOf(GeometryCollection);
        });

        test('can write GeometryCollection geometries', () => {
          const collection = new GeometryCollection([
            new Point([1, 2]),
            new LineString([[1, 2], [3, 4]]),
            new Polygon([[[1, 2], [3, 4], [3, 2], [1, 2]]])
          ]);
          const features = [new Feature(collection)];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Point>' +
              '        <coordinates>1,2</coordinates>' +
              '      </Point>' +
              '      <LineString>' +
              '        <coordinates>1,2 3,4</coordinates>' +
              '      </LineString>' +
              '      <Polygon>' +
              '        <outerBoundaryIs>' +
              '          <LinearRing>' +
              '            <coordinates>1,2 3,4 3,2 1,2</coordinates>' +
              '          </LinearRing>' +
              '        </outerBoundaryIs>' +
              '      </Polygon>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read gx:Track', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2"' +
              '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
              '  <Placemark>' +
              '    <gx:Track>' +
              '      <when>2014-01-06T19:38:55Z</when>' +
              '      <when>2014-01-06T19:39:03Z</when>' +
              '      <when>2014-01-06T19:39:10Z</when>' +
              '      <gx:coord>8.1 46.1 1909.9</gx:coord>' +
              '      <gx:coord>8.2 46.2 1925.2</gx:coord>' +
              '      <gx:coord>8.3 46.3 1926.2</gx:coord>' +
              '    </gx:Track>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(LineString);
        });

        test('can read gx:MultiTrack', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2"' +
              '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
              '  <Placemark>' +
              '    <gx:MultiTrack>' +
              '      <gx:Track>' +
              '        <when>2014-01-06T19:38:55Z</when>' +
              '        <gx:coord>8.1 46.1 1909.9</gx:coord>' +
              '      </gx:Track>' +
              '      <gx:Track>' +
              '        <when>2014-01-06T19:38:55Z</when>' +
              '        <when>2014-01-06T19:39:10Z</when>' +
              '        <gx:coord>8.1 46.1 1909.9</gx:coord>' +
              '        <gx:coord>8.2 46.2 1925.2</gx:coord>' +
              '      </gx:Track>' +
              '    </gx:MultiTrack>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(MultiLineString);
          const gs = g.getLineStrings();
          expect(gs).toHaveLength(2);
          expect(gs[0]).toBeInstanceOf(LineString);
        });

        test('can read dateTime', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2"' +
              '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
              '  <Placemark>' +
              '    <gx:Track>' +
              '      <when>2014</when>' +
              '      <when>2014-02</when>' +
              '      <when>2014-02-06</when>' +
              '      <when>2014-02-06T19:39:03Z</when>' +
              '      <when>2014-02-06T19:39:10+03:00</when>' +
              '      <gx:coord>8.1 46.1 1909.9</gx:coord>' +
              '      <gx:coord>8.2 46.2 1925.2</gx:coord>' +
              '      <gx:coord>8.3 46.3 1926.2</gx:coord>' +
              '      <gx:coord>8.4 46.4 1927.2</gx:coord>' +
              '      <gx:coord>8.5 46.5 1928.2</gx:coord>' +
              '    </gx:Track>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          const f = fs[0];
          const g = f.getGeometry();
          const flatCoordinates = g.flatCoordinates;
          expect(flatCoordinates[3]).toEqual(Date.UTC(2014, 0, 1, 0, 0, 0));
          expect(flatCoordinates[7]).toEqual(Date.UTC(2014, 1, 1, 0, 0, 0));
          expect(flatCoordinates[11]).toEqual(Date.UTC(2014, 1, 6, 0, 0, 0));
          expect(flatCoordinates[15]).toEqual(Date.UTC(2014, 1, 6, 19, 39, 3));
          expect(flatCoordinates[19]).toEqual(Date.UTC(2014, 1, 6, 16, 39, 10));
        });

      });

      describe('attributes', () => {

        test('can read boolean attributes', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <open>1</open>' +
              '    <visibility>0</visibility>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('open')).toBe(true);
          expect(f.get('visibility')).toBe(false);
        });

        test('can read string attributes', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <address>My address</address>' +
              '    <description>My description</description>' +
              '    <name>My name</name>' +
              '    <phoneNumber>My phone number</phoneNumber>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('address')).toBe('My address');
          expect(f.get('description')).toBe('My description');
          expect(f.get('name')).toBe('My name');
          expect(f.get('phoneNumber')).toBe('My phone number');
        });

        test('strips leading and trailing whitespace in strings', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <description>\n\nMy  description\n\n</description>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('description')).toBe('My  description');
        });

        test('can read CDATA sections in strings', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <name><![CDATA[My name in CDATA]]></name>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('name')).toBe('My name in CDATA');
        });

        test('strips leading and trailing whitespace around CDATA', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <name>\n\n<![CDATA[My name in CDATA]]>\n\n</name>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('name')).toBe('My name in CDATA');
        });

        test('can write Feature\'s string attributes', () => {
          const feature = new Feature();
          feature.set('address', 'My address');
          feature.set('description', 'My description');
          feature.set('name', 'My name');
          feature.set('phoneNumber', 'My phone number');
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <name>My name</name>' +
              '    <address>My address</address>' +
              '    <phoneNumber>My phone number</phoneNumber>' +
              '    <description>My description</description>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write Feature\'s boolean attributes', () => {
          const feature = new Feature();
          feature.set('open', true);
          feature.set('visibility', false);
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <open>1</open>' +
              '    <visibility>0</visibility>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

      });

      describe('region', () => {

        test('can read Region', () => {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '      <Region>' +
            '        <LatLonAltBox>' +
            '          <north>43.651015</north>' +
            '          <south>43.540908</south>' +
            '          <east>1.514582</east>' +
            '          <west>1.384133</west>' +
            '          <minAltitude>133.57</minAltitude>' +
            '          <maxAltitude>146.16</maxAltitude>' +
            '          <altitudeMode>relativeToGround</altitudeMode>' +
            '        </LatLonAltBox>' +
            '      </Region>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const extent = f.get('extent');
          expect(extent).toBeInstanceOf(Array);
          expect(extent).toHaveLength(4);
          expect(extent[0]).toBe(1.384133);
          expect(extent[1]).toBe(43.540908);
          expect(extent[2]).toBe(1.514582);
          expect(extent[3]).toBe(43.651015);
          expect(f.get('altitudeMode')).toBe('relativeToGround');
          expect(f.get('minAltitude')).toBe(133.57);
          expect(f.get('maxAltitude')).toBe(146.16);
        });

        test('can read Lod', () => {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '      <Region>' +
            '        <Lod>' +
            '          <minLodPixels>128</minLodPixels>' +
            '          <maxLodPixels>2048</maxLodPixels>' +
            '          <minFadeExtent>0.2</minFadeExtent>' +
            '          <maxFadeExtent>10.5</maxFadeExtent>' +
            '        </Lod>' +
            '      </Region>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('minLodPixels')).toBe(128);
          expect(f.get('maxLodPixels')).toBe(2048);
          expect(f.get('minFadeExtent')).toBe(0.2);
          expect(f.get('maxFadeExtent')).toBe(10.5);
        });

      });

      describe('extended data', () => {

        test('can write ExtendedData with no values', () => {
          const feature = new Feature();
          feature.set('foo', null);
          feature.set('bar', undefined);
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <ExtendedData>' +
              '      <Data name="bar"/>' +
              '      <Data name="foo"/>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write ExtendedData with values', () => {
          const feature = new Feature();
          feature.set('foo', 'bar');
          feature.set('aNumber', 1000);
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <ExtendedData>' +
              '      <Data name="aNumber">' +
              '        <value>1000</value>' +
              '      </Data>' +
              '      <Data name="foo">' +
              '        <value>bar</value>' +
              '      </Data>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write ExtendedData pair with displayName and value', () => {
          const pair = {
            value: 'bar',
            displayName: 'display name'
          };

          const feature = new Feature();
          feature.set('foo', pair);

          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <ExtendedData>' +
              '      <Data name="foo">' +
              '        <displayName><![CDATA[display name]]></displayName>' +
              '        <value>bar</value>' +
              '      </Data>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write ExtendedData after Style tag', () => {
          const style = new Style({
            stroke: new Stroke({
              color: '#112233',
              width: 2
            })
          });
          const feature = new Feature();
          feature.set('foo', null);
          feature.setStyle([style]);
          const features = [feature];
          const node = format.writeFeaturesNode(features);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>ff332211</color>' +
              '        <width>2</width>' +
              '      </LineStyle>' +
              '    </Style>' +
              '    <ExtendedData>' +
              '      <Data name="foo"/>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can read ExtendedData', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '    <ExtendedData>' +
              '      <Data name="foo">' +
              '        <value>bar</value>' +
              '      </Data>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getProperties()).to.only.have.keys(['foo', 'geometry']);
          expect(f.get('foo')).toBe('bar');
        });

        test('can read ExtendedData with no values', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '    <ExtendedData>' +
              '      <Data name="foo">' +
              '        <value>200</value>' +
              '      </Data>' +
              '      <Data name="bar"/>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getProperties()).to.only.have.keys(['foo', 'bar', 'geometry']);
          expect(f.get('foo')).toBe('200');
          expect(f.get('bar')).toBe(undefined);
        });

        test('can read ExtendedData with displayName instead of name', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '    <ExtendedData>' +
              '      <Data>' +
              '        <displayName>foo</displayName>' +
              '        <value>bar</value>' +
              '      </Data>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('foo')).toBe('bar');
        });

        test('can read SchemaData', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '    <ExtendedData>' +
              '      <SchemaData schemaUrl="#mySchema">' +
              '        <SimpleData name="capital">London</SimpleData>' +
              '        <SimpleData name="population">60000000</SimpleData>' +
              '      </SchemaData>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('capital')).toBe('London');
          expect(f.get('population')).toBe('60000000');
        });

        test('can read ExtendedData with displayName', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '    <ExtendedData>' +
              '      <Data>' +
              '        <displayName>capital</displayName>' +
              '        <value>London</value>' +
              '      </Data>' +
              '      <Data name="country">' +
              '        <displayName>Country</displayName>' +
              '        <value>United-Kingdom</value>' +
              '      </Data>' +
              '    </ExtendedData>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('capital')).toBe('London');
          expect(f.get('country').value).toBe('United-Kingdom');
          expect(f.get('country').displayName).toBe('Country');
        });
      });

      describe('styles', () => {

        test('applies the default style if no style is defined', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(getDefaultFillStyle());
          expect(style.getFill().getColor()).toEqual([255, 255, 255, 1]);
          expect(style.getImage()).toBe(getDefaultImageStyle());
          expect(style.getStroke()).toBe(getDefaultStrokeStyle());
          expect(style.getStroke().getColor()).toEqual([255, 255, 255, 1]);
          expect(style.getStroke().getWidth()).toBe(1);
        });

        test('can read a feature\'s IconStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <IconStyle>' +
              '        <Icon>' +
              '          <href>http://foo.png</href>' +
              '        </Icon>' +
              '      </IconStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(getDefaultFillStyle());
          expect(style.getStroke()).toBe(getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          expect(imageStyle).toBeInstanceOf(Icon);
          expect(new URL(imageStyle.getSrc()).href).toEqual(new URL('http://foo.png').href);
          expect(imageStyle.getAnchor()).toBe(null);
          expect(imageStyle.getOrigin()).toBe(null);
          expect(imageStyle.getRotation()).toEqual(0);
          expect(imageStyle.getSize()).toBe(null);
          expect(imageStyle.getScale()).toBe(1);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('can read a IconStyle\'s hotspot', () => {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="1">' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '        <hotSpot x="0.5" xunits="fraction" y="0.5" yunits="fraction" />' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '  <Placemark id="2">' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '        <hotSpot x="5" xunits="pixels" y="5" yunits="pixels" />' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '  <Placemark id="3">' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '        <hotSpot x="5" xunits="insetPixels" y="5" yunits="pixels" />' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '  <Placemark id="4">' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '        <hotSpot x="5" xunits="pixels" y="5" yunits="insetPixels" />' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '  <Placemark id="5">' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '        <hotSpot x="5" xunits="insetPixels" y="5" yunits="insetPixels" />' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(5);
          fs.forEach(function(f) {
            expect(f).toBeInstanceOf(Feature);
            expect(f.getId() > 1 && f.getId() < 5).toBeTruthy();
            const styleFunction = f.getStyleFunction();
            expect(styleFunction).not.toBe(undefined);
            const styleArray = styleFunction(f, 0);
            expect(styleArray).toBeInstanceOf(Array);
            expect(styleArray).toHaveLength(1);
            const style = styleArray[0];
            expect(style).toBeInstanceOf(Style);
            expect(style.getFill()).toBe(getDefaultFillStyle());
            expect(style.getStroke()).toBe(getDefaultStrokeStyle());
            const imageStyle = style.getImage();
            expect(imageStyle).toBeInstanceOf(Icon);
            expect(new URL(imageStyle.getSrc()).href).toEqual(new URL('http://foo.png').href);
            expect(imageStyle.anchor_).toBeInstanceOf(Array);
            expect(imageStyle.anchor_).toHaveLength(2);
            if (f.getId() == 1) {
              expect(imageStyle.anchor_[0]).toBe(0.5);
              expect(imageStyle.anchor_[1]).toBe(0.5);
              expect(imageStyle.anchorOrigin_).toBe(IconOrigin.BOTTOM_LEFT);
              expect(imageStyle.anchorXUnits_).toBe(IconAnchorUnits.FRACTION);
              expect(imageStyle.anchorYUnits_).toBe(IconAnchorUnits.FRACTION);
            } else {
              expect(imageStyle.anchor_[0]).toBe(5);
              expect(imageStyle.anchor_[1]).toBe(5);
              expect(imageStyle.anchorXUnits_).toBe(IconAnchorUnits.PIXELS);
              expect(imageStyle.anchorYUnits_).toBe(IconAnchorUnits.PIXELS);
              if (f.getId() == 2) {
                expect(imageStyle.anchorOrigin_).toBe(IconOrigin.BOTTOM_LEFT);
              }
              if (f.getId() == 3) {
                expect(imageStyle.anchorOrigin_).toBe(IconOrigin.BOTTOM_RIGHT);
              }
              if (f.getId() == 4) {
                expect(imageStyle.anchorOrigin_).toBe(IconOrigin.TOP_LEFT);
              }
              if (f.getId() == 5) {
                expect(imageStyle.anchorOrigin_).toBe(IconOrigin.TOP_RIGHT);
              }
            }
            expect(imageStyle.getRotation()).toEqual(0);
            expect(imageStyle.getSize()).toBe(null);
            expect(imageStyle.getScale()).toBe(1);
            expect(style.getText()).toBe(getDefaultTextStyle());
            expect(style.getZIndex()).toBe(undefined);
          });
        });

        test('can read a complex feature\'s IconStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2"' +
              '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <IconStyle>' +
              '        <scale>3.0</scale>' +
              '        <Icon>' +
              '          <href>http://foo.png</href>' +
              '          <gx:x>24</gx:x>' +
              '          <gx:y>36</gx:y>' +
              '          <gx:w>48</gx:w>' +
              '          <gx:h>48</gx:h>' +
              '        </Icon>' +
              '        <hotSpot x="0.5" y="12" xunits="fraction" ' +
              '                 yunits="pixels"/>' +
              '      </IconStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(getDefaultFillStyle());
          expect(style.getStroke()).toBe(getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          imageStyle.iconImage_.size_ = [144, 192];
          expect(imageStyle.getSize()).toEqual([48, 48]);
          expect(imageStyle.getAnchor()).toEqual([24, 36]);
          expect(imageStyle.getOrigin()).toEqual([24, 108]);
          expect(imageStyle.getRotation()).toEqual(0);
          expect(imageStyle.getScale()).toEqual(3.0);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('can read a feature\'s LabelStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LabelStyle>' +
              '        <color>12345678</color>' +
              '        <scale>0.25</scale>' +
              '      </LabelStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(getDefaultFillStyle());
          expect(style.getImage()).toBe(getDefaultImageStyle());
          expect(style.getStroke()).toBe(getDefaultStrokeStyle());
          const textStyle = style.getText();
          expect(textStyle).toBeInstanceOf(Text);
          expect(textStyle.getScale()).toBe(0.25);
          const textFillStyle = textStyle.getFill();
          expect(textFillStyle).toBeInstanceOf(Fill);
          expect(textFillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(style.getZIndex()).toBe(undefined);
        });

        test('can read a feature\'s LineStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>12345678</color>' +
              '        <width>9</width>' +
              '      </LineStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(getDefaultFillStyle());
          expect(style.getImage()).toBe(getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          expect(strokeStyle).toBeInstanceOf(Stroke);
          expect(strokeStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(strokeStyle.getWidth()).toBe(9);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('can read a feature\'s PolyStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          const fillStyle = style.getFill();
          expect(fillStyle).toBeInstanceOf(Fill);
          expect(fillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(style.getImage()).toBe(getDefaultImageStyle());
          expect(style.getStroke()).toBe(getDefaultStrokeStyle());
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('can read a feature\'s LineStyle and PolyStyle', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>12345678</color>' +
              '        <width>9</width>' +
              '      </LineStyle>' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);


          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          const fillStyle = style.getFill();
          expect(fillStyle).toBeInstanceOf(Fill);
          expect(fillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(style.getImage()).toBe(getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          expect(strokeStyle).toBeInstanceOf(Stroke);
          expect(strokeStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(strokeStyle.getWidth()).toBe(9);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('disables the fill when fill is \'0\'', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>12345678</color>' +
              '        <width>9</width>' +
              '      </LineStyle>' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '        <fill>0</fill>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          expect(style.getFill()).toBe(null);
          expect(style.getImage()).toBe(getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          expect(strokeStyle).toBeInstanceOf(Stroke);
          expect(strokeStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(strokeStyle.getWidth()).toBe(9);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test('disables the stroke when outline is \'0\'', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>12345678</color>' +
              '        <width>9</width>' +
              '      </LineStyle>' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '        <outline>0</outline>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          const fillStyle = style.getFill();
          expect(fillStyle).toBeInstanceOf(Fill);
          expect(fillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
          expect(style.getImage()).toBe(getDefaultImageStyle());
          expect(style.getStroke()).toBe(null);
          expect(style.getText()).toBe(getDefaultTextStyle());
          expect(style.getZIndex()).toBe(undefined);
        });

        test(
          'disables both fill and stroke when fill and outline are \'0\'',
          () => {
            const text =
                  '<kml xmlns="http://earth.google.com/kml/2.2">' +
                  '  <Placemark>' +
                  '    <Style>' +
                  '      <LineStyle>' +
                  '        <color>12345678</color>' +
                  '        <width>9</width>' +
                  '      </LineStyle>' +
                  '      <PolyStyle>' +
                  '        <color>12345678</color>' +
                  '        <fill>0</fill>' +
                  '        <outline>0</outline>' +
                  '      </PolyStyle>' +
                  '    </Style>' +
                  '  </Placemark>' +
                  '</kml>';
            const fs = format.readFeatures(text);
            expect(fs).toHaveLength(1);
            const f = fs[0];
            expect(f).toBeInstanceOf(Feature);
            const styleFunction = f.getStyleFunction();
            expect(styleFunction).not.toBe(undefined);
            const styleArray = styleFunction(f, 0);
            expect(styleArray).toBeInstanceOf(Array);
            expect(styleArray).toHaveLength(1);
            const style = styleArray[0];
            expect(style).toBeInstanceOf(Style);
            expect(style.getFill()).toBe(null);
            expect(style.getImage()).toBe(getDefaultImageStyle());
            expect(style.getStroke()).toBe(null);
            expect(style.getText()).toBe(getDefaultTextStyle());
            expect(style.getZIndex()).toBe(undefined);
          }
        );

        test('can create text style for named point placemarks', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Style id="sh_ylw-pushpin">' +
              '    <IconStyle>' +
              '      <scale>0.3</scale>' +
              '      <Icon>' +
              '        <href>http://maps.google.com/mapfiles/kml/pushpin/' +
              'ylw-pushpin.png</href>' +
              '      </Icon>' +
              '      <hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
              '    </IconStyle>' +
              '  </Style>' +
              '  <StyleMap id="msn_ylw-pushpin0">' +
              '    <Pair>' +
              '      <key>normal</key>' +
              '      <styleUrl>#sn_ylw-pushpin</styleUrl>' +
              '    </Pair>' +
              '    <Pair>' +
              '      <key>highlight</key>' +
              '      <styleUrl>#sh_ylw-pushpin</styleUrl>' +
              '    </Pair>' +
              '  </StyleMap>' +
              '  <Placemark>' +
              '    <name>Test</name>' +
              '    <styleUrl>#msn_ylw-pushpin0</styleUrl>' +
              '    <Point>' +
              '      <coordinates>1,2</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(2);
          const style = styleArray[1];
          expect(style).toBeInstanceOf(Style);
          expect(style.getText().getText()).toEqual(f.getProperties()['name']);
        });

        test('can create text style for named point placemarks', () => {
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Style id="sh_ylw-pushpin">' +
              '    <IconStyle>' +
              '      <scale>0.3</scale>' +
              '      <Icon>' +
              '        <href>http://maps.google.com/mapfiles/kml/pushpin/' +
              'ylw-pushpin.png</href>' +
              '      </Icon>' +
              '      <hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
              '    </IconStyle>' +
              '  </Style>' +
              '  <StyleMap id="msn_ylw-pushpin0">' +
              '    <Pair>' +
              '      <key>normal</key>' +
              '      <styleUrl>#sn_ylw-pushpin</styleUrl>' +
              '    </Pair>' +
              '    <Pair>' +
              '      <key>highlight</key>' +
              '      <styleUrl>#sh_ylw-pushpin</styleUrl>' +
              '    </Pair>' +
              '  </StyleMap>' +
              '  <Placemark>' +
              '    <name>Test</name>' +
              '    <styleUrl>#msn_ylw-pushpin0</styleUrl>' +
              '    <Point>' +
              '      <coordinates>1,2</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(2);
          const style = styleArray[1];
          expect(style).toBeInstanceOf(Style);
          expect(style.getText().getText()).toEqual(f.getProperties()['name']);
        });

        test('can write an feature\'s icon style', () => {
          const style = new Style({
            image: new Icon({
              anchor: [0.25, 36],
              anchorOrigin: 'top-left',
              anchorXUnits: 'fraction',
              anchorYUnits: 'pixels',
              crossOrigin: 'anonymous',
              offset: [96, 96],
              offsetOrigin: 'top-left',
              rotation: 45,
              scale: 0.5,
              size: [48, 48],
              src: 'http://foo.png'
            })
          });
          const imageStyle = style.getImage();
          imageStyle.iconImage_.size_ = [192, 144]; // sprite de 12 images(4*3)
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <IconStyle>' +
              '        <scale>0.5</scale>' +
              '        <heading>45</heading>' +
              '        <Icon>' +
              '          <href>http://foo.png</href>' +
              '          <gx:x>96</gx:x>' +
              '          <gx:y>0</gx:y>' +
              '          <gx:w>48</gx:w>' +
              '          <gx:h>48</gx:h>' +
              '        </Icon>' +
              '        <hotSpot x="12" y="12" xunits="pixels" ' +
              '                 yunits="pixels"/>' +
              '      </IconStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('does not write styles when writeStyles option is false', () => {
          format = new KML({writeStyles: false});
          const style = new Style({
            image: new Icon({
              src: 'http://foo.png'
            })
          });
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('skips image styles that are not icon styles', () => {
          const style = new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({
                color: 'rgb(12, 34, 223)'
              })
            })
          });
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Style>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write an feature\'s text style', () => {
          const style = new Style({
            text: new Text({
              scale: 0.5,
              text: 'foo',
              fill: new Fill({
                color: 'rgb(12, 34, 223)'
              })
            })
          });
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <name>foo</name>' +
              '    <Style>' +
              '      <LabelStyle>' +
              '        <color>ffdf220c</color>' +
              '        <scale>0.5</scale>' +
              '      </LabelStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write an feature\'s stroke style', () => {
          const style = new Style({
            stroke: new Stroke({
              color: '#112233',
              width: 2
            })
          });
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <LineStyle>' +
              '        <color>ff332211</color>' +
              '        <width>2</width>' +
              '      </LineStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write an feature\'s fill style', () => {
          const style = new Style({
            fill: new Fill({
              color: 'rgba(12, 34, 223, 0.7)'
            })
          });
          const feature = new Feature();
          feature.setStyle([style]);
          const node = format.writeFeaturesNode([feature]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Placemark>' +
              '    <Style>' +
              '      <PolyStyle>' +
              '        <color>b2df220c</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '  </Placemark>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

        test('can write multiple features with Style', () => {
          const style = new Style({
            fill: new Fill({
              color: 'rgba(12, 34, 223, 0.7)'
            })
          });
          const feature = new Feature();
          feature.setStyle(style);
          const feature2 = new Feature();
          feature2.setStyle(style);
          const node = format.writeFeaturesNode([feature, feature2]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Document>' +
              '    <Placemark>' +
              '      <Style>' +
              '        <PolyStyle>' +
              '          <color>b2df220c</color>' +
              '        </PolyStyle>' +
              '      </Style>' +
              '    </Placemark>' +
              '    <Placemark>' +
              '      <Style>' +
              '        <PolyStyle>' +
              '          <color>b2df220c</color>' +
              '        </PolyStyle>' +
              '      </Style>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });
      });

      describe('style maps', () => {

        test('can read a normal style', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Placemark id="a">' +
              '      <StyleMap>' +
              '        <Pair>' +
              '          <key>normal</key>' +
              '          <Style>' +
              '            <PolyStyle>' +
              '              <color>00000000</color>' +
              '            </PolyStyle>' +
              '          </Style>' +
              '        </Pair>' +
              '      </StyleMap>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s.getFill()).not.toBe(null);
          expect(s.getFill().getColor()).toEqual([0, 0, 0, 0]);
        });

        test('ignores highlight styles', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Placemark>' +
              '      <StyleMap>' +
              '        <Pair>' +
              '          <key>highlight</key>' +
              '          <Style>' +
              '            <PolyStyle>' +
              '              <color>00000000</color>' +
              '            </PolyStyle>' +
              '          </Style>' +
              '        </Pair>' +
              '      </StyleMap>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s).toBe(getDefaultStyle());

        });

        test('uses normal styles instead of highlight styles', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Placemark id="a">' +
              '      <StyleMap>' +
              '        <Pair>' +
              '          <key>normal</key>' +
              '          <Style>' +
              '            <PolyStyle>' +
              '              <color>00000000</color>' +
              '            </PolyStyle>' +
              '          </Style>' +
              '        </Pair>' +
              '        <Pair>' +
              '          <key>highlight</key>' +
              '          <Style>' +
              '            <PolyStyle>' +
              '              <color>ffffffff</color>' +
              '            </PolyStyle>' +
              '          </Style>' +
              '        </Pair>' +
              '      </StyleMap>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s.getFill()).not.toBe(null);
          expect(s.getFill().getColor()).toEqual([0, 0, 0, 0]);
        });

        test('can read normal styleUrls', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Style id="foo">' +
              '      <PolyStyle>' +
              '        <color>00000000</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '    <Placemark>' +
              '      <StyleMap>' +
              '        <Pair>' +
              '          <key>normal</key>' +
              '          <styleUrl>#foo</styleUrl>' +
              '        </Pair>' +
              '      </StyleMap>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s.getFill()).not.toBe(null);
          expect(s.getFill().getColor()).toEqual([0, 0, 0, 0]);
        });

        test('ignores highlight styleUrls', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Style id="foo">' +
              '      <PolyStyle>' +
              '        <color>00000000</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '    <Placemark>' +
              '      <StyleMap>' +
              '        <Pair>' +
              '          <key>highlight</key>' +
              '          <styleUrl>#foo</styleUrl>' +
              '        </Pair>' +
              '      </StyleMap>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s).toBe(getDefaultStyle());
        });

        test('can use Styles in StyleMaps before they are defined', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <StyleMap id="fooMap">' +
              '      <Pair>' +
              '        <key>normal</key>' +
              '        <styleUrl>#foo</styleUrl>' +
              '       </Pair>' +
              '    </StyleMap>' +
              '    <Style id="foo">' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '    <Placemark>' +
              '      <styleUrl>#fooMap</styleUrl>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const s = styleArray[0];
          expect(s).toBeInstanceOf(Style);
          expect(s.getFill()).not.toBe(null);
          expect(s.getFill().getColor()).toEqual([120, 86, 52, 18 / 255]);
        });

      });

      describe('shared styles', () => {

        test('can apply a shared style to a feature', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Style id="foo">' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '    <Placemark>' +
              '      <styleUrl>#foo</styleUrl>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          const fillStyle = style.getFill();
          expect(fillStyle).toBeInstanceOf(Fill);
          expect(fillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
        });

        test('can read a shared style from a Folder', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Folder>' +
              '      <Style id="foo">' +
              '        <PolyStyle>' +
              '          <color>12345678</color>' +
              '        </PolyStyle>' +
              '      </Style>' +
              '    </Folder>' +
              '    <Placemark>' +
              '      <styleUrl>#foo</styleUrl>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const styleFunction = f.getStyleFunction();
          expect(styleFunction).not.toBe(undefined);
          const styleArray = styleFunction(f, 0);
          expect(styleArray).toBeInstanceOf(Array);
          expect(styleArray).toHaveLength(1);
          const style = styleArray[0];
          expect(style).toBeInstanceOf(Style);
          const fillStyle = style.getFill();
          expect(fillStyle).toBeInstanceOf(Fill);
          expect(fillStyle.getColor()).toEqual([0x78, 0x56, 0x34, 0x12 / 255]);
        });

        test('can apply a shared style to multiple features', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Style id="foo">' +
              '      <PolyStyle>' +
              '        <color>12345678</color>' +
              '      </PolyStyle>' +
              '    </Style>' +
              '    <Placemark id="a">' +
              '      <styleUrl>#foo</styleUrl>' +
              '    </Placemark>' +
              '    <Placemark id="b">' +
              '      <styleUrl>#foo</styleUrl>' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(2);
          const f1 = fs[0];
          expect(f1).toBeInstanceOf(Feature);
          const styleFunction1 = f1.getStyleFunction();
          expect(styleFunction1).not.toBe(undefined);
          const styleArray1 = styleFunction1(f1, 0);
          expect(styleArray1).toBeInstanceOf(Array);
          const f2 = fs[1];
          expect(f2).toBeInstanceOf(Feature);
          const styleFunction2 = f2.getStyleFunction();
          expect(styleFunction2).not.toBe(undefined);
          const styleArray2 = styleFunction2(f2, 0);
          expect(styleArray2).toBeInstanceOf(Array);
          expect(styleArray1).toBe(styleArray2);
        });

      });

      describe('multiple features', () => {

        test('returns no features from an empty Document', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '</Document>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(0);
        });

        test('can read a single feature from a Document', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '  </Placemark>' +
              '</Document>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can read a single feature from nested Document', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Placemark>' +
              '    </Placemark>' +
              '  </Document>' +
              '</Document>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can transform and read a single feature from a Document', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>1,2,3</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</Document>';
          const fs = format.readFeatures(text, {
            featureProjection: 'EPSG:3857'
          });
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          expect(g.getCoordinates()).toEqual(expectedPoint);
        });

        test('can read a multiple features from a Document', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark id="1">' +
              '  </Placemark>' +
              '  <Placemark id="2">' +
              '  </Placemark>' +
              '</Document>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(2);
          expect(fs[0]).toBeInstanceOf(Feature);
          expect(fs[0].getId()).toBe('1');
          expect(fs[1]).toBeInstanceOf(Feature);
          expect(fs[1].getId()).toBe('2');
        });

        test('returns no features from an empty Folder', () => {
          const text =
              '<Folder xmlns="http://earth.google.com/kml/2.2">' +
              '</Folder>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(0);
        });

        test('can read a single feature from a Folder', () => {
          const text =
              '<Folder xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark>' +
              '  </Placemark>' +
              '</Folder>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can read a multiple features from a Folder', () => {
          const text =
              '<Folder xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark id="1">' +
              '  </Placemark>' +
              '  <Placemark id="2">' +
              '  </Placemark>' +
              '</Folder>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(2);
          expect(fs[0]).toBeInstanceOf(Feature);
          expect(fs[0].getId()).toBe('1');
          expect(fs[1]).toBeInstanceOf(Feature);
          expect(fs[1].getId()).toBe('2');
        });

        test('can read features from Folders nested in Documents', () => {
          const text =
              '<Document xmlns="http://earth.google.com/kml/2.2">' +
              '  <Folder>' +
              '    <Placemark>' +
              '    </Placemark>' +
              '  </Folder>' +
              '</Document>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can read features from Folders nested in Folders', () => {
          const text =
              '<Folder xmlns="http://earth.google.com/kml/2.2">' +
              '  <Folder>' +
              '    <Placemark>' +
              '    </Placemark>' +
              '  </Folder>' +
              '</Folder>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can read a single feature', () => {
          const text =
              '<Placemark xmlns="http://earth.google.com/kml/2.2">' +
              '</Placemark>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(1);
          expect(fs[0]).toBeInstanceOf(Feature);
        });

        test('can read features at multiple levels', () => {
          const text =
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Document>' +
              '    <Placemark id="a"/>' +
              '    <Folder>' +
              '      <Placemark id="b"/>' +
              '      <Folder>' +
              '        <Placemark id="c"/>' +
              '      </Folder>' +
              '      <Placemark id="d"/>' +
              '    </Folder>' +
              '    <Placemark id="e"/>' +
              '  </Document>' +
              '</kml>';
          const fs = format.readFeatures(text);
          expect(fs).toHaveLength(5);
          expect(fs[0]).toBeInstanceOf(Feature);
          expect(fs[0].getId()).toBe('a');
          expect(fs[1]).toBeInstanceOf(Feature);
          expect(fs[1].getId()).toBe('b');
          expect(fs[2]).toBeInstanceOf(Feature);
          expect(fs[2].getId()).toBe('c');
          expect(fs[3]).toBeInstanceOf(Feature);
          expect(fs[3].getId()).toBe('d');
          expect(fs[4]).toBeInstanceOf(Feature);
          expect(fs[4].getId()).toBe('e');
        });

        test('supports common namespaces', () => {
          expect(format.readFeatures(
            '<kml xmlns="http://earth.google.com/kml/2.0">' +
              '  <Placemark/>' +
              '</kml>')).toHaveLength(1);
          expect(format.readFeatures(
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
              '  <Placemark/>' +
              '</kml>')).toHaveLength(1);
          expect(format.readFeatures(
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark/>' +
              '</kml>')).toHaveLength(1);
        });

        test('ignores unknown namespaces', () => {
          expect(format.readFeatures(
            '<kml xmlns="http://example.com/notkml/1.0">' +
              '  <Placemark/>' +
              '</kml>')).toHaveLength(0);
        });

        test('can write multiple features', () => {
          const feature1 = new Feature();
          feature1.setId('1');
          const feature2 = new Feature();
          feature2.setId('2');
          const node = format.writeFeaturesNode([feature1, feature2]);
          const text =
              '<kml xmlns="http://www.opengis.net/kml/2.2"' +
              ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
              ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
              ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
              ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
              '  <Document>' +
              '    <Placemark id="1">' +
              '    </Placemark>' +
              '    <Placemark id="2">' +
              '    </Placemark>' +
              '  </Document>' +
              '</kml>';
          expect(node).to.xmleql(parse(text));
        });

      });

      describe('error handling', () => {

        test('should ignore invalid coordinates', () => {
          const doc = new DOMParser().parseFromString('<coordinates>INVALID</coordinates>', 'application/xml');
          const node = doc.firstChild;
          expect(readFlatCoordinates(node)).toBe(undefined);
        });

        test('should ignore Points with invalid coordinates', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>INVALID COORDINATES</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getGeometry()).toBe(null);
        });

        test('should ignore LineStrings with invalid coordinates', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <Point>' +
              '      <coordinates>INVALID COORDINATES</coordinates>' +
              '    </Point>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getGeometry()).toBe(null);
        });

        test('should ignore Polygons with no rings', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <coordinates>INVALID COORDINATES</coordinates>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getGeometry()).toBe(null);
        });

        test('should ignore Polygons with no outer ring', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <Polygon>' +
              '      <innerRingIs>' +
              '        <LinearRing>' +
              '          <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
              '        </LinearRing>' +
              '      </innerRingIs>' +
              '    </Polygon>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.getGeometry()).toBe(null);
        });

        test('should ignore geometries with invalid coordinates', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <MultiGeometry>' +
              '      <Point>' +
              '        <coordinates>INVALID COORDINATES</coordinates>' +
              '      </Point>' +
              '    </MultiGeometry>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          const g = f.getGeometry();
          expect(g).toBeInstanceOf(GeometryCollection);
          expect(g.getGeometries()).toHaveLength(0);
        });

        test('should ignore invalid booleans', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark>' +
              '    <visibility>foo</visibility>' +
              '  </Placemark>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(1);
          const f = fs[0];
          expect(f).toBeInstanceOf(Feature);
          expect(f.get('visibility')).toBe(undefined);
        });

        test('parse all valid features in a Folder, without error', () => {
          const kml =
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
              '  <Placemark id="a"/>' +
              '  <Folder>' +
              '    <Placemark id="b"/>' +
              '    <Placemark id="c">' +
              '      <visibility>foo</visibility>' +
              '    </Placemark>' +
              '    <Placemark id="d"/>' +
              '  </Folder>' +
              '  <Placemark id="e"/>' +
              '</kml>';
          const fs = format.readFeatures(kml);
          expect(fs).toBeInstanceOf(Array);
          expect(fs).toHaveLength(5);
          expect(fs[0]).toBeInstanceOf(Feature);
          expect(fs[0].getId()).toBe('a');
          expect(fs[1]).toBeInstanceOf(Feature);
          expect(fs[1].getId()).toBe('b');
          expect(fs[2]).toBeInstanceOf(Feature);
          expect(fs[2].getId()).toBe('c');
          expect(fs[3]).toBeInstanceOf(Feature);
          expect(fs[3].getId()).toBe('d');
          expect(fs[4]).toBeInstanceOf(Feature);
          expect(fs[4].getId()).toBe('e');
        });

      });

    });

    describe('when parsing states.kml', () => {

      let features;
      beforeAll(function(done) {
        afterLoadText('spec/ol/format/kml/states.kml', function(xml) {
          try {
            features = format.readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      test('creates 50 features', () => {
        expect(features).toHaveLength(50);
      });

      test('creates features with heterogeneous geometry collections', () => {
        // FIXME decide if we should instead create features with multiple geoms
        const feature = features[0];
        expect(feature).toBeInstanceOf(Feature);
        const geometry = feature.getGeometry();
        expect(geometry).toBeInstanceOf(GeometryCollection);
      });

      test('creates a Point and a MultiPolygon for Alaska', () => {
        const alaska = find(features, function(feature) {
          return feature.get('name') === 'Alaska';
        });
        expect(alaska).toBeInstanceOf(Feature);
        const geometry = alaska.getGeometry();
        expect(geometry).toBeInstanceOf(GeometryCollection);
        const components = geometry.getGeometries();
        expect(components).toHaveLength(2);
        expect(components[0]).toBeInstanceOf(Point);
        expect(components[1]).toBeInstanceOf(MultiPolygon);
      });

      test('reads style and icon', () => {
        const f = features[0];
        const styleFunction = f.getStyleFunction();
        expect(styleFunction).not.toBe(undefined);
        const styleArray = styleFunction(f, 0);
        expect(styleArray).toBeInstanceOf(Array);
        const style = styleArray[0];
        expect(style).toBeInstanceOf(Style);
        const imageStyle = style.getImage();
        expect(imageStyle).toBeInstanceOf(Icon);
        expect(imageStyle.getSrc()).toEqual('http://maps.google.com/mapfiles/kml/shapes/star.png');
      });

    });

    describe('#JSONExport', () => {

      let features;
      beforeAll(function(done) {
        afterLoadText('spec/ol/format/kml/style.kml', function(xml) {
          try {
            features = format.readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      test('feature must not have a properties property', () => {
        const geojsonFormat = new GeoJSON();
        features.forEach(function(feature) {
          const geojsonFeature = geojsonFormat.writeFeatureObject(feature);
          expect(geojsonFeature.properties).toBe(null);
          JSON.stringify(geojsonFeature);
        });
      });

    });

    describe('#readName', () => {

      test('returns undefined if there is no name', () => {
        const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Document>' +
            '    <Folder>' +
            '     <Placemark/>' +
            '    </Folder>' +
            '  </Document>' +
            '</kml>';
        expect(format.readName(kml)).toBe(undefined);
      });

      test('returns the name of the first Document', () => {
        const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Document>' +
            '    <name>Document name</name>' +
            '  </Document>' +
            '</kml>';
        expect(format.readName(kml)).toBe('Document name');
      });

      test('returns the name of the first Folder', () => {
        const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Folder>' +
            '    <name>Folder name</name>' +
            '  </Folder>' +
            '</kml>';
        expect(format.readName(kml)).toBe('Folder name');
      });

      test('returns the name of the first Placemark', () => {
        const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <name>Placemark name</name>' +
            '  </Placemark>' +
            '</kml>';
        expect(format.readName(kml)).toBe('Placemark name');
      });

      test('searches breadth-first', () => {
        const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Document>' +
            '    <Placemark>' +
            '      <name>Placemark name</name>' +
            '    </Placemark>' +
            '    <name>Document name</name>' +
            '  </Document>' +
            '</kml>';
        expect(format.readName(kml)).toBe('Document name');
      });

    });

    describe('#readNetworkLinks', () => {
      test('returns empty array if no network links found', () => {
        const text =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Document>' +
            '  </Document>' +
            '</kml>';
        const nl = format.readNetworkLinks(text);
        expect(nl).toHaveLength(0);
      });

      test('returns an array of network links', () => {
        const text =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Document>' +
            '    <NetworkLink>' +
            '      <name>bar</name>' +
            '      <Link>' +
            '        <href>bar/bar.kml</href>' +
            '      </Link>' +
            '    </NetworkLink>' +
            '  </Document>' +
            '  <Folder>' +
            '    <NetworkLink>' +
            '      <Link>' +
            '        <href>http://foo.com/foo.kml</href>' +
            '      </Link>' +
            '    </NetworkLink>' +
            '  </Folder>' +
            '</kml>';
        const nl = format.readNetworkLinks(text);
        expect(nl).toHaveLength(2);
        expect(nl[0].name).toBe('bar');
        expect(nl[0].href.replace(window.location.origin, '')).toBe('/bar/bar.kml');
        expect(nl[1].href).toBe('http://foo.com/foo.kml');
      });

    });

    describe('#readNetworkLinksFile', () => {

      let nl;
      beforeAll(function(done) {
        afterLoadText('spec/ol/format/kml/networklinks.kml', function(xml) {
          try {
            nl = format.readNetworkLinks(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      test('returns an array of network links', () => {
        expect(nl).toHaveLength(2);
        expect(nl[0].name).toBe('bar');
        expect(/\/bar\/bar\.kml$/.test(nl[0].href)).toBeTruthy();
        expect(nl[1].href).toBe('http://foo.com/foo.kml');
      });
    });

    describe('#readRegion', () => {

      test('returns an array of regions', () => {
        const text =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <Region>' +
          '      <LatLonAltBox>' +
          '        <north>0</north>' +
          '        <south>-90</south>' +
          '        <east>0</east>' +
          '        <west>-180</west>' +
          '        <minAltitude>0</minAltitude>' +
          '        <maxAltitude>4000</maxAltitude>' +
          '        <altitudeMode>clampToGround</altitudeMode>' +
          '      </LatLonAltBox>' +
          '      <Lod>' +
          '        <minLodPixels>0</minLodPixels>' +
          '        <maxLodPixels>-1</maxLodPixels>' +
          '        <minFadeExtent>0</minFadeExtent>' +
          '        <maxFadeExtent>0</maxFadeExtent>' +
          '      </Lod>' +
          '    </Region>' +
          '  </Document>' +
          '  <Folder>' +
          '    <Region>' +
          '      <LatLonAltBox>' +
          '        <north>90</north>' +
          '        <south>0</south>' +
          '        <east>180</east>' +
          '        <west>0</west>' +
          '        <minAltitude>0</minAltitude>' +
          '        <maxAltitude>0</maxAltitude>' +
          '        <altitudeMode>clampToGround</altitudeMode>' +
          '      </LatLonAltBox>' +
          '      <Lod>' +
          '        <minLodPixels>0</minLodPixels>' +
          '        <maxLodPixels>-1</maxLodPixels>' +
          '        <minFadeExtent>0</minFadeExtent>' +
          '        <maxFadeExtent>0</maxFadeExtent>' +
          '      </Lod>' +
          '    </Region>' +
          '  </Folder>' +
          '</kml>';
        const nl = format.readRegion(text);
        expect(nl).toHaveLength(2);
        expect(nl[0].extent).toEqual([-180, -90, 0, 0]);
        expect(nl[0].minAltitude).toBe(0);
        expect(nl[0].maxAltitude).toBe(4000);
        expect(nl[0].altitudeMode).toBe('clampToGround');
        expect(nl[0].minLodPixels).toBe(0);
        expect(nl[0].maxLodPixels).toBe(-1);
        expect(nl[0].minFadeExtent).toBe(0);
        expect(nl[0].maxFadeExtent).toBe(0);
        expect(nl[1].extent).toEqual([0, 0, 180, 90]);
      });
    });
  });
});
