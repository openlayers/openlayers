import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import ImageState from '../../../../../src/ol/ImageState.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import KML, {
  getDefaultFillStyle,
  getDefaultImageStyle,
  getDefaultStrokeStyle,
  getDefaultStyle,
  getDefaultStyleArray,
  getDefaultTextStyle,
  readFlatCoordinates,
} from '../../../../../src/ol/format/KML.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../../src/ol/geom/LinearRing.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {
  addCoordinateTransforms,
  addProjection,
  get as getProjection,
  transform,
} from '../../../../../src/ol/proj.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import {remove as removeTransform} from '../../../../../src/ol/proj/transforms.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import {shared} from '../../../../../src/ol/style/IconImageCache.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';
import {parse} from '../../../../../src/ol/xml.js';
import {assertXmlEqual} from '../../../../util/xml.js';

describe('ol.format.KML', function () {
  let format;

  describe('using defaultStyle', function () {
    const dfltStyle = new Style();

    beforeEach(function () {
      format = new KML({
        defaultStyle: [dfltStyle],
      });
    });

    it('set constant variables', function () {
      assert.instanceOf(getDefaultStyleArray(), Array);
    });

    describe('#readFeatures', function () {
      it('can apply a default style to a feature', function () {
        const text =
          '<kml xmlns="http://earth.google.com/kml/2.2">' +
          '  <Document>' +
          '    <Placemark/>' +
          '  </Document>' +
          '</kml>';
        const fs = format.readFeatures(text);
        assert.lengthOf(fs, 1);
        const f = fs[0];
        assert.instanceOf(f, Feature);
        const styleFunction = f.getStyleFunction();
        assert.notEqual(styleFunction, undefined);
        const styleArray = styleFunction(f, 0);
        assert.instanceOf(styleArray, Array);
        assert.lengthOf(styleArray, 1);
        const style = styleArray[0];
        assert.instanceOf(style, Style);
        assert.strictEqual(style, dfltStyle);
      });
    });
  });

  describe('without parameters', function () {
    beforeEach(function () {
      format = new KML();
    });

    it('set constant variables', function () {
      assert.instanceOf(getDefaultStyleArray(), Array);
    });

    describe('#readProjection', function () {
      it('returns the default projection from document', function () {
        const projection = format.readProjectionFromDocument();
        assert.deepEqual(projection, getProjection('EPSG:4326'));
      });

      it('returns the default projection from node', function () {
        const projection = format.readProjectionFromNode();
        assert.deepEqual(projection, getProjection('EPSG:4326'));
      });
    });

    describe('#readFeatures', function () {
      describe('id', function () {
        it("can read a Feature's id", function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="foo"/>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getId(), 'foo');
        });

        it('treats a missing id as undefined', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getId(), undefined);
        });

        it('can write a Feature', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write a Feature as string', function () {
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
          assertXmlEqual(parse(node), parse(text));
        });

        it("can write a Feature's id", function () {
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
          assertXmlEqual(node, parse(text));
        });
      });

      describe('geometry', function () {
        it('treats a missing geometry as null', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.strictEqual(g, null);
        });

        it('can write feature with null geometries', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write properties', function () {
          const lineString = new LineString([
            [1, 2],
            [3, 4],
          ]);
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
          assertXmlEqual(node, parse(text));
        });

        it('can read Point geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Point);
          assert.deepEqual(g.getCoordinates(), [1, 2, 3]);
          assert.strictEqual(g.get('extrude'), false);
          assert.strictEqual(g.get('altitudeMode'), 'absolute');
        });

        it('can transform and read Point geometries', function () {
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
            featureProjection: 'EPSG:3857',
          });
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          assert.deepEqual(g.getCoordinates(), expectedPoint);
        });

        it('can read a single Point geometry', function () {
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
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Point);
          assert.deepEqual(g.getCoordinates(), [1, 2, 3]);
        });

        it('can transform and read a single Point geometry', function () {
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
            featureProjection: 'EPSG:3857',
          });
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          assert.deepEqual(g.getCoordinates(), expectedPoint);
        });

        it('can write XY Point geometries', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZ Point geometries', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can transform and write XYZ Point geometries', function () {
          addProjection(new Projection({code: 'double'}));
          addCoordinateTransforms(
            'EPSG:4326',
            'double',
            function (coordinate) {
              return [2 * coordinate[0], 2 * coordinate[1]];
            },
            function (coordinate) {
              return [coordinate[0] / 2, coordinate[1] / 2];
            },
          );

          const layout = 'XYZ';
          const point = new Point([1, 2, 3], layout).transform(
            'EPSG:4326',
            'double',
          );
          const features = [new Feature(point)];
          const node = format.writeFeaturesNode(features, {
            featureProjection: 'double',
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
          assertXmlEqual(node, parse(text));

          removeTransform(getProjection('EPSG:4326'), getProjection('double'));
          removeTransform(getProjection('double'), getProjection('EPSG:4326'));
        });

        it('can write XYM Point geometries', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZM Point geometries', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can read LineString geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, LineString);
          assert.deepEqual(g.getCoordinates(), [
            [1, 2, 3],
            [4, 5, 6],
          ]);
          assert.strictEqual(g.get('extrude'), false);
          assert.strictEqual(g.get('tessellate'), true);
          assert.strictEqual(g.get('altitudeMode'), 'absolute');
        });

        it('can read XY coordinates', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <LineString>' +
            '      <coordinates>1,2 3,4</coordinates>' +
            '      <extrude>0</extrude>' +
            '      <tessellate>1</tessellate>' +
            '      <altitudeMode>absolute</altitudeMode>' +
            '    </LineString>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, LineString);
          assert.deepEqual(g.getCoordinates(), [
            [1, 2, 0],
            [3, 4, 0],
          ]);
        });

        it('can read empty Z coordinates', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <LineString>' +
            '      <coordinates>1,2, 3,4,</coordinates>' +
            '      <extrude>0</extrude>' +
            '      <tessellate>1</tessellate>' +
            '      <altitudeMode>absolute</altitudeMode>' +
            '    </LineString>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, LineString);
          assert.deepEqual(g.getCoordinates(), [
            [1, 2, 0],
            [3, 4, 0],
          ]);
        });

        it('can write XY LineString geometries', function () {
          const layout = 'XY';
          const lineString = new LineString(
            [
              [1, 2],
              [3, 4],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZ LineString geometries', function () {
          const layout = 'XYZ';
          const lineString = new LineString(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYM LineString geometries', function () {
          const layout = 'XYM';
          const lineString = new LineString(
            [
              [1, 2, 100],
              [3, 4, 200],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZM LineString geometries', function () {
          const layout = 'XYZM';
          const lineString = new LineString(
            [
              [1, 2, 3, 100],
              [4, 5, 6, 200],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read LinearRing geometries', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <LinearRing>' +
            '      <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
            '    </LinearRing>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Polygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
            ],
          ]);
        });

        it('can write XY LinearRing geometries', function () {
          const layout = 'XY';
          const linearRing = new LinearRing(
            [
              [1, 2],
              [3, 4],
              [1, 2],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZ LinearRing geometries', function () {
          const layout = 'XYZ';
          const linearRing = new LinearRing(
            [
              [1, 2, 3],
              [4, 5, 6],
              [1, 2, 3],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYM LinearRing geometries', function () {
          const layout = 'XYM';
          const linearRing = new LinearRing(
            [
              [1, 2, 100],
              [3, 4, 200],
              [1, 2, 100],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZM LinearRing geometries', function () {
          const layout = 'XYZM';
          const linearRing = new LinearRing(
            [
              [1, 2, 3, 100],
              [4, 5, 6, 200],
              [1, 2, 3, 100],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read Polygon geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Polygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [0, 0, 1],
              [0, 5, 1],
              [5, 5, 2],
              [5, 0, 3],
            ],
          ]);
          assert.strictEqual(g.get('extrude'), false);
          assert.strictEqual(g.get('altitudeMode'), 'absolute');
        });

        it('can write XY Polygon geometries', function () {
          const layout = 'XY';
          const polygon = new Polygon(
            [
              [
                [0, 0],
                [0, 2],
                [2, 2],
                [2, 0],
                [0, 0],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZ Polygon geometries', function () {
          const layout = 'XYZ';
          const polygon = new Polygon(
            [
              [
                [0, 0, 1],
                [0, 2, 2],
                [2, 2, 3],
                [2, 0, 4],
                [0, 0, 5],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYM Polygon geometries', function () {
          const layout = 'XYM';
          const polygon = new Polygon(
            [
              [
                [0, 0, 1],
                [0, 2, 1],
                [2, 2, 1],
                [2, 0, 1],
                [0, 0, 1],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can write XYZM Polygon geometries', function () {
          const layout = 'XYZM';
          const polygon = new Polygon(
            [
              [
                [0, 0, 1, 1],
                [0, 2, 2, 1],
                [2, 2, 3, 1],
                [2, 0, 4, 1],
                [0, 0, 5, 1],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read complex Polygon geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Polygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [0, 0, 1],
              [0, 5, 1],
              [5, 5, 2],
              [5, 0, 3],
            ],
            [
              [1, 1, 0],
              [1, 2, 0],
              [2, 2, 0],
              [2, 1, 0],
            ],
            [
              [3, 3, 0],
              [3, 4, 0],
              [4, 4, 0],
              [4, 3, 0],
            ],
          ]);
        });

        it('can read multiple LinearRings from one innerBoundaryIs', function () {
          const text = `
            <kml xmlns="http://earth.google.com/kml/2.2">
              <Placemark>
                <Polygon>
                  <innerBoundaryIs>
                    <LinearRing>
                      <coordinates>1,1,0 1,2,0 2,2,0 2,1,0</coordinates>
                    </LinearRing>
                    <LinearRing>
                      <coordinates>3,3,0 3,4,0 4,4,0 4,3,0</coordinates>
                    </LinearRing>
                  </innerBoundaryIs>
                  <outerBoundaryIs>
                    <LinearRing>
                      <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>
                    </LinearRing>
                  </outerBoundaryIs>
                </Polygon>
              </Placemark>
            </kml>`;
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Polygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [0, 0, 1],
              [0, 5, 1],
              [5, 5, 2],
              [5, 0, 3],
            ],
            [
              [1, 1, 0],
              [1, 2, 0],
              [2, 2, 0],
              [2, 1, 0],
            ],
            [
              [3, 3, 0],
              [3, 4, 0],
              [4, 4, 0],
              [4, 3, 0],
            ],
          ]);
        });

        it('can write complex Polygon geometries', function () {
          const layout = 'XYZ';
          const polygon = new Polygon(
            [
              [
                [0, 0, 1],
                [0, 5, 1],
                [5, 5, 2],
                [5, 0, 3],
              ],
              [
                [1, 1, 0],
                [1, 2, 0],
                [2, 2, 0],
                [2, 1, 0],
              ],
              [
                [3, 3, 0],
                [3, 4, 0],
                [4, 4, 0],
                [4, 3, 0],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read MultiPolygon geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, MultiPolygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [
                [0, 0, 0],
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0],
              ],
            ],
            [
              [
                [3, 0, 0],
                [3, 1, 0],
                [4, 1, 0],
                [4, 0, 0],
              ],
            ],
          ]);
          assert.isArray(g.get('extrude'));
          assert.lengthOf(g.get('extrude'), 2);
          assert.strictEqual(g.get('extrude')[0], false);
          assert.strictEqual(g.get('extrude')[1], undefined);
          assert.isArray(g.get('altitudeMode'));
          assert.lengthOf(g.get('altitudeMode'), 2);
          assert.strictEqual(g.get('altitudeMode')[0], 'absolute');
          assert.strictEqual(g.get('altitudeMode')[1], undefined);
        });

        it('can write MultiPolygon geometries', function () {
          const layout = 'XYZ';
          const multiPolygon = new MultiPolygon(
            [
              [
                [
                  [0, 0, 0],
                  [0, 1, 0],
                  [1, 1, 0],
                  [1, 0, 0],
                ],
              ],
              [
                [
                  [3, 0, 0],
                  [3, 1, 0],
                  [4, 1, 0],
                  [4, 0, 0],
                ],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read MultiPoint geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, MultiPoint);
          assert.deepEqual(g.getCoordinates(), [
            [1, 2, 3],
            [4, 5, 6],
          ]);
          assert.isArray(g.get('extrude'));
          assert.lengthOf(g.get('extrude'), 2);
          assert.strictEqual(g.get('extrude')[0], false);
          assert.strictEqual(g.get('extrude')[1], true);
          assert.isArray(g.get('altitudeMode'));
          assert.lengthOf(g.get('altitudeMode'), 2);
          assert.strictEqual(g.get('altitudeMode')[0], 'absolute');
          assert.strictEqual(g.get('altitudeMode')[1], 'clampToGround');
        });

        it('can write MultiPoint geometries', function () {
          const layout = 'XYZ';
          const multiPoint = new MultiPoint(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read MultiLineString geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, MultiLineString);
          assert.deepEqual(g.getCoordinates(), [
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            [
              [7, 8, 9],
              [10, 11, 12],
            ],
          ]);
          assert.isArray(g.get('extrude'));
          assert.lengthOf(g.get('extrude'), 2);
          assert.strictEqual(g.get('extrude')[0], false);
          assert.strictEqual(g.get('extrude')[1], undefined);
          assert.isArray(g.get('tessellate'));
          assert.lengthOf(g.get('tessellate'), 2);
          assert.strictEqual(g.get('tessellate')[0], false);
          assert.strictEqual(g.get('tessellate')[1], undefined);
          assert.isArray(g.get('altitudeMode'));
          assert.lengthOf(g.get('altitudeMode'), 2);
          assert.strictEqual(g.get('altitudeMode')[0], 'absolute');
          assert.strictEqual(g.get('altitudeMode')[1], undefined);
        });

        it('can write MultiLineString geometries', function () {
          const layout = 'XYZ';
          const multiLineString = new MultiLineString(
            [
              [
                [1, 2, 3],
                [4, 5, 6],
              ],
              [
                [7, 8, 9],
                [10, 11, 12],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read MultiPolygon geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, MultiPolygon);
          assert.deepEqual(g.getCoordinates(), [
            [
              [
                [0, 0, 0],
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0],
              ],
            ],
            [
              [
                [3, 0, 0],
                [3, 1, 0],
                [4, 1, 0],
                [4, 0, 0],
              ],
            ],
          ]);
          assert.isArray(g.get('extrude'));
          assert.lengthOf(g.get('extrude'), 2);
          assert.strictEqual(g.get('extrude')[0], false);
          assert.strictEqual(g.get('extrude')[1], undefined);
          assert.isArray(g.get('altitudeMode'));
          assert.lengthOf(g.get('altitudeMode'), 2);
          assert.strictEqual(g.get('altitudeMode')[0], 'absolute');
          assert.strictEqual(g.get('altitudeMode')[1], undefined);
        });

        it('can write MultiPolygon geometries', function () {
          const layout = 'XYZ';
          const multiPolygon = new MultiPolygon(
            [
              [
                [
                  [0, 0, 0],
                  [0, 1, 0],
                  [1, 1, 0],
                  [1, 0, 0],
                ],
              ],
              [
                [
                  [3, 0, 0],
                  [3, 1, 0],
                  [4, 1, 0],
                  [4, 0, 0],
                ],
              ],
            ],
            layout,
          );
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
          assertXmlEqual(node, parse(text));
        });

        it('can read empty GeometryCollection geometries', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, GeometryCollection);
          assert.isEmpty(g.getGeometries());
        });

        it('can read heterogeneous GeometryCollection geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, GeometryCollection);
          const gs = g.getGeometries();
          assert.lengthOf(gs, 4);
          assert.instanceOf(gs[0], Point);
          assert.instanceOf(gs[1], LineString);
          assert.instanceOf(gs[2], Polygon);
          assert.instanceOf(gs[3], Polygon);
        });

        it('can read nested GeometryCollection geometries', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, GeometryCollection);
          const gs = g.getGeometries();
          assert.lengthOf(gs, 1);
          assert.instanceOf(gs[0], GeometryCollection);
        });

        it('can read nested MultiPolygon geometries', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <MultiGeometry>' +
            '        <Polygon>' +
            '          <extrude>0</extrude>' +
            '          <altitudeMode>absolute</altitudeMode>' +
            '          <outerBoundaryIs>' +
            '            <LinearRing>' +
            '              <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
            '            </LinearRing>' +
            '          </outerBoundaryIs>' +
            '        </Polygon>' +
            '        <Polygon>' +
            '          <outerBoundaryIs>' +
            '            <LinearRing>' +
            '              <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
            '            </LinearRing>' +
            '          </outerBoundaryIs>' +
            '        </Polygon>' +
            '      </MultiGeometry>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, GeometryCollection);
          const gs = g.getGeometries();
          assert.lengthOf(gs, 1);
          const m = gs[0];
          assert.instanceOf(m, MultiPolygon);
          assert.deepEqual(m.getCoordinates(), [
            [
              [
                [0, 0, 0],
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0],
              ],
            ],
            [
              [
                [3, 0, 0],
                [3, 1, 0],
                [4, 1, 0],
                [4, 0, 0],
              ],
            ],
          ]);
          assert.isArray(m.get('extrude'));
          assert.lengthOf(m.get('extrude'), 2);
          assert.strictEqual(m.get('extrude')[0], false);
          assert.strictEqual(m.get('extrude')[1], undefined);
          assert.isArray(m.get('altitudeMode'));
          assert.lengthOf(m.get('altitudeMode'), 2);
          assert.strictEqual(m.get('altitudeMode')[0], 'absolute');
          assert.strictEqual(m.get('altitudeMode')[1], undefined);
        });

        it('can write GeometryCollection geometries', function () {
          const collection = new GeometryCollection([
            new GeometryCollection([
              new Point([1, 2]),
              new LineString([
                [1, 2],
                [3, 4],
              ]),
              new Polygon([
                [
                  [1, 2],
                  [3, 4],
                  [3, 2],
                  [1, 2],
                ],
              ]),
            ]),
            new GeometryCollection([
              new MultiPoint([
                [5, 6],
                [9, 10],
              ]),
              new MultiLineString([
                [
                  [5, 6],
                  [7, 8],
                ],
                [
                  [9, 10],
                  [11, 12],
                ],
              ]),
              new MultiPolygon([
                [
                  [
                    [5, 6],
                    [7, 8],
                    [7, 6],
                    [5, 6],
                  ],
                ],
                [
                  [
                    [9, 10],
                    [11, 12],
                    [11, 10],
                    [9, 10],
                  ],
                ],
              ]),
            ]),
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
            '      <Point>' +
            '        <coordinates>5,6</coordinates>' +
            '      </Point>' +
            '      <Point>' +
            '        <coordinates>9,10</coordinates>' +
            '      </Point>' +
            '      <LineString>' +
            '        <coordinates>5,6 7,8</coordinates>' +
            '      </LineString>' +
            '      <LineString>' +
            '        <coordinates>9,10 11,12</coordinates>' +
            '      </LineString>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>5,6 7,8 7,6 5,6</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>9,10 11,12 11,10 9,10</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it('can read gx:Track', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2"' +
            '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
            '  <Placemark>' +
            '    <gx:Track>' +
            '      <when>2014-01-06T19:38:55Z</when>' +
            '      <when>2014-01-06T19:39:03Z</when>' +
            '      <when>2014-01-06T19:39:10Z</when>' +
            '      <when>2014-01-06T19:39:17Z</when>' +
            '      <gx:coord>8.1 46.1 1909.9</gx:coord>' +
            '      <gx:coord>8.2 46.2 1925.2</gx:coord>' +
            '      <gx:coord>8.3 46.3 1926.2</gx:coord>' +
            '      <gx:coord/>' +
            '    </gx:Track>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, LineString);
        });

        it('can read gx:MultiTrack', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, MultiLineString);
          const gs = g.getLineStrings();
          assert.lengthOf(gs, 2);
          assert.instanceOf(gs[0], LineString);
        });

        it('can read dateTime', function () {
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
          assert.deepEqual(flatCoordinates[3], Date.UTC(2014, 0, 1, 0, 0, 0));
          assert.deepEqual(flatCoordinates[7], Date.UTC(2014, 1, 1, 0, 0, 0));
          assert.deepEqual(flatCoordinates[11], Date.UTC(2014, 1, 6, 0, 0, 0));
          assert.deepEqual(
            flatCoordinates[15],
            Date.UTC(2014, 1, 6, 19, 39, 3),
          );
          assert.deepEqual(
            flatCoordinates[19],
            Date.UTC(2014, 1, 6, 16, 39, 10),
          );
        });
      });

      describe('attributes', function () {
        it('can read boolean attributes', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <open>1</open>' +
            '    <visibility>0</visibility>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('open'), true);
          assert.strictEqual(f.get('visibility'), false);
        });

        it('can read string attributes', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('address'), 'My address');
          assert.strictEqual(f.get('description'), 'My description');
          assert.strictEqual(f.get('name'), 'My name');
          assert.strictEqual(f.get('phoneNumber'), 'My phone number');
        });

        it('strips leading and trailing whitespace in strings', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <description>\n\nMy  description\n\n</description>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('description'), 'My  description');
        });

        it('can read CDATA sections in strings', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <name><![CDATA[My name in CDATA]]></name>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('name'), 'My name in CDATA');
        });

        it('strips leading and trailing whitespace around CDATA', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <name>\n\n<![CDATA[My name in CDATA]]>\n\n</name>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('name'), 'My name in CDATA');
        });

        it("can write Feature's string attributes", function () {
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
          assertXmlEqual(node, parse(text));
        });

        it("can write Feature's boolean attributes", function () {
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
          assertXmlEqual(node, parse(text));
        });
      });

      describe('region', function () {
        it('can read Region', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const extent = f.get('extent');
          assert.instanceOf(extent, Array);
          assert.lengthOf(extent, 4);
          assert.strictEqual(extent[0], 1.384133);
          assert.strictEqual(extent[1], 43.540908);
          assert.strictEqual(extent[2], 1.514582);
          assert.strictEqual(extent[3], 43.651015);
          assert.strictEqual(f.get('altitudeMode'), 'relativeToGround');
          assert.strictEqual(f.get('minAltitude'), 133.57);
          assert.strictEqual(f.get('maxAltitude'), 146.16);
        });

        it('can read Lod', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('minLodPixels'), 128);
          assert.strictEqual(f.get('maxLodPixels'), 2048);
          assert.strictEqual(f.get('minFadeExtent'), 0.2);
          assert.strictEqual(f.get('maxFadeExtent'), 10.5);
        });
      });

      describe('extended data', function () {
        it('can write ExtendedData with no values', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write ExtendedData with values', function () {
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
          assertXmlEqual(node, parse(text));
        });

        it('can write ExtendedData pair with displayName and value', function () {
          const pair = {
            value: 'bar',
            displayName: 'display name',
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
            '        <displayName>display name</displayName>' +
            '        <value>bar</value>' +
            '      </Data>' +
            '    </ExtendedData>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it('can write ExtendedData after Style tag', function () {
          const style = new Style({
            stroke: new Stroke({
              color: '#112233',
              width: 2,
            }),
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
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <ExtendedData>' +
            '      <Data name="foo"/>' +
            '    </ExtendedData>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it('can read ExtendedData', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.hasAllKeys(f.getProperties(), ['foo', 'geometry']);
          assert.strictEqual(f.get('foo'), 'bar');
        });

        it('can read ExtendedData with no values', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.hasAllKeys(f.getProperties(), ['foo', 'bar', 'geometry']);
          assert.strictEqual(f.get('foo'), '200');
          assert.strictEqual(f.get('bar'), undefined);
        });

        it('can read ExtendedData with displayName instead of name', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('foo'), 'bar');
        });

        it('can read SchemaData', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('capital'), 'London');
          assert.strictEqual(f.get('population'), '60000000');
        });

        it('can read ExtendedData with displayName', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('capital'), 'London');
          assert.strictEqual(f.get('country').value, 'United-Kingdom');
          assert.strictEqual(f.get('country').displayName, 'Country');
        });
      });

      describe('styles', function () {
        beforeEach(() => {
          shared.clear(); // clear shared cache as different `crossOrigin`-attributes are not part of the generated cache key
        });

        it('applies the default style if no style is defined', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.deepEqual(style.getFill().getColor(), [255, 255, 255, 1]);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          assert.deepEqual(style.getStroke().getColor(), [255, 255, 255, 1]);
          assert.strictEqual(style.getStroke().getWidth(), 1);
        });

        it("can read a feature's IconStyle using default crossOrigin", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://foo.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.deepEqual(imageStyle.getImage().crossOrigin, 'anonymous');
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's IconStyle (and set the crossOrigin option)", function () {
          format = new KML({crossOrigin: null});
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://foo.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.strictEqual(imageStyle.getImage().crossOrigin, null);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's IconStyle and apply an iconUrlFunction", function () {
          format = new KML({
            iconUrlFunction: function (href) {
              return href.replace(/^http:/, 'https:');
            },
          });
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('https://foo.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.deepEqual(imageStyle.getImage().crossOrigin, 'anonymous');
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's IconStyle, load the image and reset the scale", function (done) {
          format = new KML({
            iconUrlFunction: function (href) {
              return href.replace('http://foo/', 'spec/ol/data/');
            },
          });
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo/dot.png</href>' +
            '        </Icon>' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = /** @type {Array<Style>} */ (styleFunction(f, 0));
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(imageStyle.getSrc(), 'spec/ol/data/dot.png');
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.deepEqual(imageStyle.getImage().crossOrigin, 'anonymous');
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);

          imageStyle.listenImageChange(function (evt) {
            if (imageStyle.getImageState() === ImageState.LOADED) {
              assert.deepEqual(imageStyle.getSize(), [20, 20]);
              assert.strictEqual(imageStyle.getScale(), 1.6);
              done();
            }
          });
        });

        it("can read a IconStyle's hotspot", function () {
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
          assert.lengthOf(fs, 5);
          fs.forEach(function (f) {
            assert.instanceOf(f, Feature);
            assert.isAtLeast(Number(f.getId()), 1);
            assert.isAtMost(Number(f.getId()), 5);
            const styleFunction = f.getStyleFunction();
            assert.notEqual(styleFunction, undefined);
            const styleArray = styleFunction(f, 0);
            assert.instanceOf(styleArray, Array);
            assert.lengthOf(styleArray, 1);
            const style = styleArray[0];
            assert.instanceOf(style, Style);
            assert.strictEqual(style.getFill(), getDefaultFillStyle());
            assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
            const imageStyle = style.getImage();
            assert.instanceOf(imageStyle, Icon);
            assert.deepEqual(
              new URL(imageStyle.getSrc()).href,
              new URL('http://foo.png').href,
            );
            assert.instanceOf(imageStyle.anchor_, Array);
            assert.lengthOf(imageStyle.anchor_, 2);
            if (f.getId() == 1) {
              assert.strictEqual(imageStyle.anchor_[0], 0.5);
              assert.strictEqual(imageStyle.anchor_[1], 0.5);
              assert.strictEqual(imageStyle.anchorOrigin_, 'bottom-left');
              assert.strictEqual(imageStyle.anchorXUnits_, 'fraction');
              assert.strictEqual(imageStyle.anchorYUnits_, 'fraction');
            } else {
              assert.strictEqual(imageStyle.anchor_[0], 5);
              assert.strictEqual(imageStyle.anchor_[1], 5);
              assert.strictEqual(imageStyle.anchorXUnits_, 'pixels');
              assert.strictEqual(imageStyle.anchorYUnits_, 'pixels');
              if (f.getId() == 2) {
                assert.strictEqual(imageStyle.anchorOrigin_, 'bottom-left');
              }
              if (f.getId() == 3) {
                assert.strictEqual(imageStyle.anchorOrigin_, 'bottom-right');
              }
              if (f.getId() == 4) {
                assert.strictEqual(imageStyle.anchorOrigin_, 'top-left');
              }
              if (f.getId() == 5) {
                assert.strictEqual(imageStyle.anchorOrigin_, 'top-right');
              }
            }
            assert.deepEqual(imageStyle.getRotation(), 0);
            assert.strictEqual(imageStyle.getSize(), null);
            assert.strictEqual(imageStyle.getScale(), 1);
            assert.strictEqual(style.getText(), getDefaultTextStyle());
            assert.strictEqual(style.getZIndex(), undefined);
          });
        });

        it("can read a complex feature's IconStyle", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          imageStyle.iconImage_.size_ = [144, 192];
          assert.deepEqual(imageStyle.getSize(), [48, 48]);
          assert.deepEqual(imageStyle.getAnchor(), [24, 36]);
          assert.deepEqual(imageStyle.getOrigin(), [24, 108]);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.deepEqual(imageStyle.getScale(), 2.0);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's IconStyle and set color of image", () => {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2"' +
            '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <color>FF0000FF</color>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.deepEqual(imageStyle.getColor(), [0xff, 0, 0, 0xff / 255]);
        });

        it("can read a feature's LabelStyle", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const textStyle = style.getText();
          assert.instanceOf(textStyle, Text);
          assert.strictEqual(textStyle.getScale(), 0.25);
          const textFillStyle = textStyle.getFill();
          assert.instanceOf(textFillStyle, Fill);
          assert.deepEqual(textFillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's LineStyle", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          assert.instanceOf(strokeStyle, Stroke);
          assert.deepEqual(strokeStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(strokeStyle.getWidth(), 9);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's PolyStyle", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          const fillStyle = style.getFill();
          assert.instanceOf(fillStyle, Fill);
          assert.deepEqual(fillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("can read a feature's LineStyle and PolyStyle", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          const fillStyle = style.getFill();
          assert.instanceOf(fillStyle, Fill);
          assert.deepEqual(fillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          assert.instanceOf(strokeStyle, Stroke);
          assert.deepEqual(strokeStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(strokeStyle.getWidth(), 9);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it("disables the fill when fill is '0'", function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), null);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          assert.instanceOf(strokeStyle, Stroke);
          assert.deepEqual(strokeStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(strokeStyle.getWidth(), 9);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);

          const lineString = new LineString([
            [1, 2],
            [3, 4],
          ]);
          const polygon = new Polygon([
            [
              [0, 0],
              [0, 2],
              [2, 2],
              [2, 0],
              [0, 0],
            ],
          ]);
          const collection = new GeometryCollection([lineString, polygon]);
          f.setGeometry(collection);
          const node = format.writeFeaturesNode(fs);
          const text1 =
            '<kml xmlns="http://www.opengis.net/kml/2.2"' +
            ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
            ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <MultiGeometry>' +
            '      <LineString>' +
            '        <coordinates>1,2 3,4</coordinates>' +
            '      </LineString>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>0,0 0,2 2,2 2,0 0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text1));
        });

        it("disables the stroke when outline is '0'", function () {
          const lineString = new LineString([
            [1, 2],
            [3, 4],
          ]);
          const polygon = new Polygon([
            [
              [0, 0],
              [0, 2],
              [2, 2],
              [2, 0],
              [0, 0],
            ],
          ]);
          const lineStringFeature = new Feature(lineString);
          const polygonFeature = new Feature(polygon);
          const collectionFeature = new Feature(
            new GeometryCollection([lineString, polygon]),
          );
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 2);

          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(
            style.getGeometryFunction()(lineStringFeature),
            lineString,
          );
          assert.strictEqual(
            style.getGeometryFunction()(polygonFeature),
            undefined,
          );
          const gc = style.getGeometryFunction()(collectionFeature);
          assert.instanceOf(gc, GeometryCollection);
          const gs = gc.getGeometries();
          assert.instanceOf(gs, Array);
          assert.lengthOf(gs, 1);
          assert.instanceOf(gs[0], LineString);
          assert.deepEqual(gs[0].getCoordinates(), lineString.getCoordinates());
          const fillStyle = style.getFill();
          assert.instanceOf(fillStyle, Fill);
          assert.deepEqual(fillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          assert.instanceOf(strokeStyle, Stroke);
          assert.deepEqual(strokeStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(strokeStyle.getWidth(), 9);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);

          const style1 = styleArray[1];
          assert.instanceOf(style1, Style);
          assert.strictEqual(
            style1.getGeometryFunction()(lineStringFeature),
            undefined,
          );
          assert.strictEqual(
            style1.getGeometryFunction()(polygonFeature),
            polygon,
          );
          const gc1 = style1.getGeometryFunction()(collectionFeature);
          assert.instanceOf(gc1, GeometryCollection);
          const gs1 = gc1.getGeometries();
          assert.instanceOf(gs1, Array);
          assert.lengthOf(gs1, 1);
          assert.instanceOf(gs1[0], Polygon);
          assert.deepEqual(gs1[0].getCoordinates(), polygon.getCoordinates());
          assert.strictEqual(style1.getFill(), fillStyle);
          assert.strictEqual(style1.getStroke(), null);
          assert.strictEqual(style1.getZIndex(), undefined);

          f.setGeometry(collectionFeature.getGeometry());
          const node = format.writeFeaturesNode(fs);
          const text1 =
            '<kml xmlns="http://www.opengis.net/kml/2.2"' +
            ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
            ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
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
            '    <MultiGeometry>' +
            '      <LineString>' +
            '        <coordinates>1,2 3,4</coordinates>' +
            '      </LineString>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>0,0 0,2 2,2 2,0 0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text1));
        });

        it("disables both fill and stroke when fill and outline are '0'", function () {
          const lineString = new LineString([
            [1, 2],
            [3, 4],
          ]);
          const polygon = new Polygon([
            [
              [0, 0],
              [0, 2],
              [2, 2],
              [2, 0],
              [0, 0],
            ],
          ]);
          const lineStringFeature = new Feature(lineString);
          const polygonFeature = new Feature(polygon);
          const collectionFeature = new Feature(
            new GeometryCollection([lineString, polygon]),
          );
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 2);

          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(
            style.getGeometryFunction()(lineStringFeature),
            lineString,
          );
          assert.strictEqual(
            style.getGeometryFunction()(polygonFeature),
            undefined,
          );
          const gc = style.getGeometryFunction()(collectionFeature);
          assert.instanceOf(gc, GeometryCollection);
          const gs = gc.getGeometries();
          assert.instanceOf(gs, Array);
          assert.lengthOf(gs, 1);
          assert.instanceOf(gs[0], LineString);
          assert.deepEqual(gs[0].getCoordinates(), lineString.getCoordinates());
          assert.strictEqual(style.getFill(), null);
          assert.strictEqual(style.getImage(), getDefaultImageStyle());
          const strokeStyle = style.getStroke();
          assert.instanceOf(strokeStyle, Stroke);
          assert.deepEqual(strokeStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
          assert.strictEqual(strokeStyle.getWidth(), 9);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);

          const style1 = styleArray[1];
          assert.instanceOf(style1, Style);
          assert.strictEqual(
            style1.getGeometryFunction()(lineStringFeature),
            undefined,
          );
          assert.strictEqual(
            style1.getGeometryFunction()(polygonFeature),
            polygon,
          );
          const gc1 = style1.getGeometryFunction()(collectionFeature);
          assert.instanceOf(gc1, GeometryCollection);
          const gs1 = gc1.getGeometries();
          assert.instanceOf(gs1, Array);
          assert.lengthOf(gs1, 1);
          assert.instanceOf(gs1[0], Polygon);
          assert.deepEqual(gs1[0].getCoordinates(), polygon.getCoordinates());
          assert.strictEqual(style1.getFill(), null);
          assert.strictEqual(style1.getStroke(), null);
          assert.strictEqual(style1.getZIndex(), undefined);

          f.setGeometry(collectionFeature.getGeometry());
          const node = format.writeFeaturesNode(fs);
          const text1 =
            '<kml xmlns="http://www.opengis.net/kml/2.2"' +
            ' xmlns:gx="http://www.google.com/kml/ext/2.2"' +
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            ' xsi:schemaLocation="http://www.opengis.net/kml/2.2' +
            ' https://developers.google.com/kml/schema/kml22gx.xsd">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <MultiGeometry>' +
            '      <LineString>' +
            '        <coordinates>1,2 3,4</coordinates>' +
            '      </LineString>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>0,0 0,2 2,2 2,0 0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text1));
        });

        it('can create text style for named point placemarks (including html character codes)', function () {
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
            '    <name>Joe&apos;s Test</name>' +
            '    <styleUrl>#msn_ylw-pushpin0</styleUrl>' +
            '    <Point>' +
            '      <coordinates>1,2</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const style = styleFunction(f, 0);
          assert.instanceOf(style, Style);
          assert.deepEqual(style.getText().getText(), "Joe's Test");
        });

        it("can write an feature's icon style", function () {
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
              src: 'http://foo.png',
              color: 'rgba(255,0,0,1)',
            }),
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
            '        <scale>0.75</scale>' + // 0.5 * 48 / 32
            '        <heading>45</heading>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '          <gx:x>96</gx:x>' +
            '          <gx:y>0</gx:y>' +
            '          <gx:w>48</gx:w>' +
            '          <gx:h>48</gx:h>' +
            '        </Icon>' +
            '        <color>ff0000ff</color>' +
            '        <hotSpot x="12" y="12" xunits="pixels" ' +
            '                 yunits="pixels"/>' +
            '      </IconStyle>' +
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it('does not write styles when writeStyles option is false', function () {
          format = new KML({writeStyles: false});
          const style = new Style({
            image: new Icon({
              src: 'http://foo.png',
            }),
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
          assertXmlEqual(node, parse(text));
        });

        it('skips image styles that are not icon styles', function () {
          const style = new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({
                color: 'rgb(12, 34, 223)',
              }),
            }),
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
            '        <fill>0</fill>' +
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it("can write an feature's text style", function () {
          const style = new Style({
            text: new Text({
              scale: 0.5,
              text: 'foo',
              fill: new Fill({
                color: 'rgb(12, 34, 223)',
              }),
            }),
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
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it("can write an feature's stroke style without fill", function () {
          const style = new Style({
            stroke: new Stroke({
              color: '#112233',
              width: 2,
            }),
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
            '      <PolyStyle>' +
            '        <fill>0</fill>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it("can write an feature's fill style without outline", function () {
          const style = new Style({
            fill: new Fill({
              color: 'rgba(12, 34, 223, 0.7)',
            }),
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
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it("can write an feature's fill style and outline", function () {
          const style = new Style({
            fill: new Fill({
              color: 'rgba(12, 34, 223, 0.7)',
            }),
            stroke: new Stroke({
              color: '#112233',
              width: 2,
            }),
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
            '      <PolyStyle>' +
            '        <color>b2df220c</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });

        it('can write multiple features with Style', function () {
          const style = new Style({
            fill: new Fill({
              color: 'rgba(12, 34, 223, 0.7)',
            }),
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
            '          <outline>0</outline>' +
            '        </PolyStyle>' +
            '      </Style>' +
            '    </Placemark>' +
            '    <Placemark>' +
            '      <Style>' +
            '        <PolyStyle>' +
            '          <color>b2df220c</color>' +
            '          <outline>0</outline>' +
            '        </PolyStyle>' +
            '      </Style>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          assertXmlEqual(node, parse(text));
        });
      });

      describe('style maps', function () {
        it('can read a normal style', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.notEqual(s.getFill(), null);
          assert.deepEqual(s.getFill().getColor(), [0, 0, 0, 0]);
        });

        it('can read a normal IconStyle (and set the crossOrigin option)', function () {
          format = new KML({crossOrigin: null});
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark id="a">' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>normal</key>' +
            '          <Style>' +
            '            <IconStyle>' +
            '              <Icon>' +
            '                <href>http://bar.png</href>' +
            '              </Icon>' +
            '            </IconStyle>' +
            '          </Style>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://bar.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.strictEqual(imageStyle.getImage().crossOrigin, null);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it('ignores highlight styles', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.strictEqual(s, getDefaultStyle());
        });

        it('uses normal styles instead of highlight styles', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.notEqual(s.getFill(), null);
          assert.deepEqual(s.getFill().getColor(), [0, 0, 0, 0]);
        });

        it('can read normal styleUrls', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.notEqual(s.getFill(), null);
          assert.deepEqual(s.getFill().getColor(), [0, 0, 0, 0]);
        });

        it('ignores highlight styleUrls', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.strictEqual(s, getDefaultStyle());
        });

        it('can use Styles in StyleMaps before they are defined', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <StyleMap id="fooMap">' +
            '      <Pair>' +
            '        <key>normal</key>' +
            '        <styleUrl>#foo</styleUrl>' +
            '      </Pair>' +
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.notEqual(s.getFill(), null);
          assert.deepEqual(s.getFill().getColor(), [120, 86, 52, 18 / 255]);
        });

        it('can use Styles in StyleMaps if # is missing', function () {
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <StyleMap id="fooMap">' +
            '      <Pair>' +
            '        <key>normal</key>' +
            '        <styleUrl>foo</styleUrl>' +
            '      </Pair>' +
            '    </StyleMap>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <styleUrl>fooMap</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const s = styleArray[0];
          assert.instanceOf(s, Style);
          assert.notEqual(s.getFill(), null);
          assert.deepEqual(s.getFill().getColor(), [120, 86, 52, 18 / 255]);
        });

        it('can use IconStyles in StyleMaps before they are defined (and set the crossOrigin option)', function () {
          format = new KML({crossOrigin: null});
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <StyleMap id="fooMap">' +
            '      <Pair>' +
            '        <key>normal</key>' +
            '        <styleUrl>#foo</styleUrl>' +
            '      </Pair>' +
            '    </StyleMap>' +
            '    <Style id="foo">' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://bar.png</href>' +
            '        </Icon>' +
            '      </IconStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <styleUrl>#fooMap</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://bar.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.strictEqual(imageStyle.getImage().crossOrigin, null);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });
      });

      describe('shared styles', function () {
        it('can apply a shared style to a feature', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          const fillStyle = style.getFill();
          assert.instanceOf(fillStyle, Fill);
          assert.deepEqual(fillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
        });

        it('can apply a shared IconStyle to a feature (and set the crossOrigin option)', function () {
          format = new KML({crossOrigin: null});
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Style id="foo">' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://bar.png</href>' +
            '        </Icon>' +
            '      </IconStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://bar.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.strictEqual(imageStyle.getImage().crossOrigin, null);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it('can read a shared style from a Folder', function () {
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
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          const fillStyle = style.getFill();
          assert.instanceOf(fillStyle, Fill);
          assert.deepEqual(fillStyle.getColor(), [
            0x78,
            0x56,
            0x34,
            0x12 / 255,
          ]);
        });

        it('can read a shared IconStyle from a Folder (and set the crossOrigin option)', function () {
          format = new KML({crossOrigin: null});
          const text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Folder>' +
            '      <Style id="foo">' +
            '        <IconStyle>' +
            '          <Icon>' +
            '            <href>http://bar.png</href>' +
            '          </Icon>' +
            '        </IconStyle>' +
            '      </Style>' +
            '    </Folder>' +
            '    <Placemark>' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const styleFunction = f.getStyleFunction();
          assert.notEqual(styleFunction, undefined);
          const styleArray = styleFunction(f, 0);
          assert.instanceOf(styleArray, Array);
          assert.lengthOf(styleArray, 1);
          const style = styleArray[0];
          assert.instanceOf(style, Style);
          assert.strictEqual(style.getFill(), getDefaultFillStyle());
          assert.strictEqual(style.getStroke(), getDefaultStrokeStyle());
          const imageStyle = style.getImage();
          assert.instanceOf(imageStyle, Icon);
          assert.deepEqual(
            new URL(imageStyle.getSrc()).href,
            new URL('http://bar.png').href,
          );
          assert.strictEqual(imageStyle.getAnchor(), null);
          assert.strictEqual(imageStyle.getOrigin(), null);
          assert.deepEqual(imageStyle.getRotation(), 0);
          assert.strictEqual(imageStyle.getSize(), null);
          assert.strictEqual(imageStyle.getScale(), 1);
          assert.strictEqual(imageStyle.getImage().crossOrigin, null);
          assert.strictEqual(style.getText(), getDefaultTextStyle());
          assert.strictEqual(style.getZIndex(), undefined);
        });

        it('can apply a shared style to multiple features', function () {
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
          assert.lengthOf(fs, 2);
          const f1 = fs[0];
          assert.instanceOf(f1, Feature);
          const styleFunction1 = f1.getStyleFunction();
          assert.notEqual(styleFunction1, undefined);
          const styleArray1 = styleFunction1(f1, 0);
          assert.instanceOf(styleArray1, Array);
          const f2 = fs[1];
          assert.instanceOf(f2, Feature);
          const styleFunction2 = f2.getStyleFunction();
          assert.notEqual(styleFunction2, undefined);
          const styleArray2 = styleFunction2(f2, 0);
          assert.instanceOf(styleArray2, Array);
          assert.strictEqual(styleArray1, styleArray2);
        });
      });

      describe('multiple features', function () {
        it('returns no features from an empty Document', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '</Document>';
          const fs = format.readFeatures(text);
          assert.isEmpty(fs);
        });

        it('can read a single feature from a Document', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</Document>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can read a single feature from nested Document', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark>' +
            '    </Placemark>' +
            '  </Document>' +
            '</Document>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can transform and read a single feature from a Document', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>1,2,3</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</Document>';
          const fs = format.readFeatures(text, {
            featureProjection: 'EPSG:3857',
          });
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, Point);
          const expectedPoint = transform([1, 2], 'EPSG:4326', 'EPSG:3857');
          expectedPoint.push(3);
          assert.deepEqual(g.getCoordinates(), expectedPoint);
        });

        it('can read a multiple features from a Document', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="1">' +
            '  </Placemark>' +
            '  <Placemark id="2">' +
            '  </Placemark>' +
            '</Document>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 2);
          assert.instanceOf(fs[0], Feature);
          assert.strictEqual(fs[0].getId(), '1');
          assert.instanceOf(fs[1], Feature);
          assert.strictEqual(fs[1].getId(), '2');
        });

        it('returns no features from an empty Folder', function () {
          const text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' + '</Folder>';
          const fs = format.readFeatures(text);
          assert.isEmpty(fs);
        });

        it('can read a single feature from a Folder', function () {
          const text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</Folder>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can read a multiple features from a Folder', function () {
          const text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="1">' +
            '  </Placemark>' +
            '  <Placemark id="2">' +
            '  </Placemark>' +
            '</Folder>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 2);
          assert.instanceOf(fs[0], Feature);
          assert.strictEqual(fs[0].getId(), '1');
          assert.instanceOf(fs[1], Feature);
          assert.strictEqual(fs[1].getId(), '2');
        });

        it('can read features from Folders nested in Documents', function () {
          const text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Folder>' +
            '    <Placemark>' +
            '    </Placemark>' +
            '  </Folder>' +
            '</Document>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can read features from Folders nested in Folders', function () {
          const text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Folder>' +
            '    <Placemark>' +
            '    </Placemark>' +
            '  </Folder>' +
            '</Folder>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can read a single feature', function () {
          const text =
            '<Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '</Placemark>';
          const fs = format.readFeatures(text);
          assert.lengthOf(fs, 1);
          assert.instanceOf(fs[0], Feature);
        });

        it('can read features at multiple levels', function () {
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
          assert.lengthOf(fs, 5);
          assert.instanceOf(fs[0], Feature);
          assert.strictEqual(fs[0].getId(), 'a');
          assert.instanceOf(fs[1], Feature);
          assert.strictEqual(fs[1].getId(), 'b');
          assert.instanceOf(fs[2], Feature);
          assert.strictEqual(fs[2].getId(), 'c');
          assert.instanceOf(fs[3], Feature);
          assert.strictEqual(fs[3].getId(), 'd');
          assert.instanceOf(fs[4], Feature);
          assert.strictEqual(fs[4].getId(), 'e');
        });

        it('supports common namespaces', function () {
          assert.lengthOf(
            format.readFeatures(
              '<kml xmlns="http://earth.google.com/kml/2.0">' +
                '  <Placemark/>' +
                '</kml>',
            ),
            1,
          );
          assert.lengthOf(
            format.readFeatures(
              '<kml xmlns="http://earth.google.com/kml/2.2">' +
                '  <Placemark/>' +
                '</kml>',
            ),
            1,
          );
          assert.lengthOf(
            format.readFeatures(
              '<kml xmlns="http://www.opengis.net/kml/2.2">' +
                '  <Placemark/>' +
                '</kml>',
            ),
            1,
          );
        });

        it('ignores unknown namespaces', function () {
          assert.isEmpty(
            format.readFeatures(
              '<kml xmlns="http://example.com/notkml/1.0">' +
                '  <Placemark/>' +
                '</kml>',
            ),
          );
        });

        it('can write multiple features', function () {
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
          assertXmlEqual(node, parse(text));
        });
      });

      describe('error handling', function () {
        it('should ignore invalid coordinates', function () {
          const doc = new DOMParser().parseFromString(
            '<coordinates>INVALID</coordinates>',
            'application/xml',
          );
          const node = doc.firstChild;
          assert.strictEqual(readFlatCoordinates(node), undefined);
        });

        it('should ignore Points with invalid coordinates', function () {
          const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(kml);
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getGeometry(), null);
        });

        it('should ignore LineStrings with invalid coordinates', function () {
          const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(kml);
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getGeometry(), null);
        });

        it('should ignore Polygons with no rings', function () {
          const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Polygon>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Polygon>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(kml);
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getGeometry(), null);
        });

        it('should ignore Polygons with no outer ring', function () {
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
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.getGeometry(), null);
        });

        it('should ignore geometries with invalid coordinates', function () {
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
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          const g = f.getGeometry();
          assert.instanceOf(g, GeometryCollection);
          assert.isEmpty(g.getGeometries());
        });

        it('should ignore invalid booleans', function () {
          const kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <visibility>foo</visibility>' +
            '  </Placemark>' +
            '</kml>';
          const fs = format.readFeatures(kml);
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 1);
          const f = fs[0];
          assert.instanceOf(f, Feature);
          assert.strictEqual(f.get('visibility'), undefined);
        });

        it('parse all valid features in a Folder, without error', function () {
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
          assert.instanceOf(fs, Array);
          assert.lengthOf(fs, 5);
          assert.instanceOf(fs[0], Feature);
          assert.strictEqual(fs[0].getId(), 'a');
          assert.instanceOf(fs[1], Feature);
          assert.strictEqual(fs[1].getId(), 'b');
          assert.instanceOf(fs[2], Feature);
          assert.strictEqual(fs[2].getId(), 'c');
          assert.instanceOf(fs[3], Feature);
          assert.strictEqual(fs[3].getId(), 'd');
          assert.instanceOf(fs[4], Feature);
          assert.strictEqual(fs[4].getId(), 'e');
        });
      });
    });

    describe('when parsing states.kml', function () {
      let features;
      before(function (done) {
        afterLoadText('spec/ol/format/kml/states.kml', function (xml) {
          try {
            features = format.readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      it('creates 50 features', function () {
        assert.lengthOf(features, 50);
      });

      it('creates features with heterogeneous geometry collections', function () {
        // FIXME decide if we should instead create features with multiple geoms
        const feature = features[0];
        assert.instanceOf(feature, Feature);
        const geometry = feature.getGeometry();
        assert.instanceOf(geometry, GeometryCollection);
      });

      it('creates a Point and a MultiPolygon for Alaska', function () {
        const alaska = features.find(function (feature) {
          return feature.get('name') === 'Alaska';
        });
        assert.instanceOf(alaska, Feature);
        const geometry = alaska.getGeometry();
        assert.instanceOf(geometry, GeometryCollection);
        const components = geometry.getGeometries();
        assert.lengthOf(components, 2);
        assert.instanceOf(components[0], Point);
        assert.instanceOf(components[1], MultiPolygon);
      });

      it('reads style and icon', function () {
        const f = features[0];
        const styleFunction = f.getStyleFunction();
        assert.notEqual(styleFunction, undefined);
        const styleArray = styleFunction(f, 0);
        assert.instanceOf(styleArray, Array);
        assert.lengthOf(styleArray, 2);

        const style = styleArray[0];
        assert.instanceOf(style, Style);
        const gc = style.getGeometryFunction()(f);
        assert.instanceOf(gc, GeometryCollection);
        const gs = gc.getGeometries();
        assert.instanceOf(gs, Array);
        assert.lengthOf(gs, 1);
        assert.instanceOf(gs[0], Point);
        assert.deepEqual(
          gs[0].getCoordinates(),
          f.getGeometry().getGeometries()[0].getCoordinates(),
        );
        const imageStyle = style.getImage();
        assert.instanceOf(imageStyle, Icon);
        assert.deepEqual(imageStyle.getScale(), 0.4);
        assert.deepEqual(
          imageStyle.getSrc(),
          'http://maps.google.com/mapfiles/kml/shapes/star.png',
        );
        const textStyle = style.getText();
        assert.instanceOf(textStyle, Text);
        const textFillStyle = textStyle.getFill();
        assert.instanceOf(textFillStyle, Fill);
        assert.deepEqual(textFillStyle.getColor(), [
          0xff,
          0xff,
          0x00,
          0x99 / 255,
        ]);
        assert.deepEqual(textStyle.getText(), f.get('name'));

        const style1 = styleArray[1];
        assert.instanceOf(style1, Style);
        assert.strictEqual(style1.getGeometryFunction()(f), f.getGeometry());
        assert.strictEqual(style1.getFill(), null);
        assert.strictEqual(style1.getImage(), null);
        const strokeStyle = style1.getStroke();
        assert.instanceOf(strokeStyle, Stroke);
        assert.deepEqual(strokeStyle.getColor(), [
          0xff,
          0x00,
          0xff,
          0xff / 255,
        ]);
        assert.strictEqual(strokeStyle.getWidth(), 2);
        assert.strictEqual(style1.getText(), null);
      });
    });

    describe('#JSONExport', function () {
      let features;
      before(function (done) {
        afterLoadText('spec/ol/format/kml/style.kml', function (xml) {
          try {
            features = format.readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      it('feature must not have a properties property', function () {
        const geojsonFormat = new GeoJSON();
        features.forEach(function (feature) {
          const geojsonFeature = geojsonFormat.writeFeatureObject(feature);
          assert.strictEqual(geojsonFeature.properties, null);
          JSON.stringify(geojsonFeature);
        });
      });
    });

    describe('#readName', function () {
      it('returns undefined if there is no name', function () {
        const kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <Folder>' +
          '     <Placemark/>' +
          '    </Folder>' +
          '  </Document>' +
          '</kml>';
        assert.strictEqual(format.readName(kml), undefined);
      });

      it('returns the name of the first Document', function () {
        const kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <name>Document name</name>' +
          '  </Document>' +
          '</kml>';
        assert.strictEqual(format.readName(kml), 'Document name');
      });

      it('returns the name of the first Folder', function () {
        const kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Folder>' +
          '    <name>Folder name</name>' +
          '  </Folder>' +
          '</kml>';
        assert.strictEqual(format.readName(kml), 'Folder name');
      });

      it('returns the name of the first Placemark', function () {
        const kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Placemark>' +
          '    <name>Placemark name</name>' +
          '  </Placemark>' +
          '</kml>';
        assert.strictEqual(format.readName(kml), 'Placemark name');
      });

      it('searches breadth-first', function () {
        const kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <Placemark>' +
          '      <name>Placemark name</name>' +
          '    </Placemark>' +
          '    <name>Document name</name>' +
          '  </Document>' +
          '</kml>';
        assert.strictEqual(format.readName(kml), 'Document name');
      });
    });

    describe('#readNetworkLinks', function () {
      it('returns empty array if no network links found', function () {
        const text =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '  </Document>' +
          '</kml>';
        const nl = format.readNetworkLinks(text);
        assert.lengthOf(nl, 0);
      });

      it('returns an array of network links', function () {
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
        assert.lengthOf(nl, 2);
        assert.strictEqual(nl[0].name, 'bar');
        assert.strictEqual(
          nl[0].href.replace(window.location.origin, ''),
          '/bar/bar.kml',
        );
        assert.strictEqual(nl[1].href, 'http://foo.com/foo.kml');
      });
    });

    describe('#readNetworkLinksFile', function () {
      let nl;
      before(function (done) {
        afterLoadText('spec/ol/format/kml/networklinks.kml', function (xml) {
          try {
            nl = format.readNetworkLinks(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      it('returns an array of network links', function () {
        assert.lengthOf(nl, 2);
        assert.strictEqual(nl[0].name, 'bar');
        assert.isOk(/\/bar\/bar\.kml$/.test(nl[0].href));
        assert.strictEqual(nl[1].href, 'http://foo.com/foo.kml');
      });
    });

    describe('#readRegion', function () {
      it('returns an array of regions', function () {
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
        assert.lengthOf(nl, 2);
        assert.deepEqual(nl[0].extent, [-180, -90, 0, 0]);
        assert.strictEqual(nl[0].minAltitude, 0);
        assert.strictEqual(nl[0].maxAltitude, 4000);
        assert.strictEqual(nl[0].altitudeMode, 'clampToGround');
        assert.strictEqual(nl[0].minLodPixels, 0);
        assert.strictEqual(nl[0].maxLodPixels, -1);
        assert.strictEqual(nl[0].minFadeExtent, 0);
        assert.strictEqual(nl[0].maxFadeExtent, 0);
        assert.deepEqual(nl[1].extent, [0, 0, 180, 90]);
      });
    });
  });

  describe('#readCamera', function () {
    it('returns an array of cameras', function () {
      const text =
        '<kml xmlns="http://www.opengis.net/kml/2.2">' +
        '  <Document>' +
        '    <Camera>' +
        '      <Latitude>11</Latitude>' +
        '      <Longitude>46</Longitude>' +
        '      <Altitude>4000</Altitude>' +
        '      <AltitudeMode>clampToGround</AltitudeMode>' +
        '      <Heading>18.0</Heading>' +
        '      <Tilt>85</Tilt>' +
        '      <Roll>0</Roll>' +
        '    </Camera>' +
        '  </Document>' +
        '  <Placemark>' +
        '    <Point>' +
        '      <coordinates>' +
        '        8.167492844000884,46.88946232784758' +
        '      </coordinates>' +
        '    </Point>' +
        '    <Camera>' +
        '      <Latitude>22</Latitude>' +
        '      <Longitude>10</Longitude>' +
        '      <Altitude>40</Altitude>' +
        '      <AltitudeMode>clampToGround</AltitudeMode>' +
        '      <Heading>75</Heading>' +
        '      <Tilt>30</Tilt>' +
        '      <Roll>80</Roll>' +
        '    </Camera>' +
        '  </Placemark>' +
        '</kml>';

      const nl = format.readCamera(text);
      assert.lengthOf(nl, 2);
      assert.strictEqual(nl[0].Latitude, 11);
      assert.strictEqual(nl[0].Longitude, 46);
      assert.strictEqual(nl[0].Altitude, 4000);
      assert.strictEqual(nl[0].Heading, 18.0);
      assert.strictEqual(nl[0].Tilt, 85);
      assert.strictEqual(nl[0].Roll, 0);
      assert.strictEqual(nl[0].AltitudeMode, 'clampToGround');
      assert.strictEqual(nl[1].Latitude, 22);
      assert.strictEqual(nl[1].Longitude, 10);
      assert.strictEqual(nl[1].Altitude, 40);
      assert.strictEqual(nl[1].Heading, 75);
      assert.strictEqual(nl[1].Tilt, 30);
      assert.strictEqual(nl[1].Roll, 80);
      assert.strictEqual(nl[1].AltitudeMode, 'clampToGround');
    });
  });
});
