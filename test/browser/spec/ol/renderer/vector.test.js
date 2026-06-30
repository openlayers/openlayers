import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import {VOID} from '../../../../../src/ol/functions.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import CanvasBuilderGroup from '../../../../../src/ol/render/canvas/BuilderGroup.js';
import {renderFeature} from '../../../../../src/ol/renderer/vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol/renderer/vector', function () {
  describe('#renderFeature', function () {
    let builderGroup;
    let feature, iconStyle, style, squaredTolerance, listener;
    let iconStyleLoadSpy;

    beforeEach(function () {
      builderGroup = new CanvasBuilderGroup(1);
      feature = new Feature();
      iconStyle = new Icon({
        src: 'http://example.com/icon.png',
      });
      style = new Style({
        image: iconStyle,
        fill: new Fill({}),
        stroke: new Stroke({}),
      });
      squaredTolerance = 1;
      listener = function () {};
      iconStyleLoadSpy = vi
        .spyOn(iconStyle, 'load')
        .mockImplementation(function () {
          iconStyle.iconImage_.imageState_ = 1; // LOADING
        });
    });

    afterEach(function () {
      iconStyleLoadSpy.mockRestore();
    });

    describe('call multiple times', function () {
      it('does not set multiple listeners', function () {
        let listeners;

        // call #1
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);

        assert.strictEqual(iconStyleLoadSpy.mock.calls.length, 1);
        listeners = iconStyle.iconImage_.listeners_['change'];
        assert.deepEqual(listeners.length, 1);

        // call #2
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);

        assert.strictEqual(iconStyleLoadSpy.mock.calls.length, 1);
        listeners = iconStyle.iconImage_.listeners_['change'];
        assert.deepEqual(listeners.length, 1);
      });
    });

    describe('call renderFeature with a loading icon', function () {
      it('does not render the point', function () {
        feature.setGeometry(new Point([0, 0]));
        const imageReplay = builderGroup.getBuilder(style.getZIndex(), 'Image');
        const setImageStyleSpy = vi.spyOn(imageReplay, 'setImageStyle');
        const drawPointSpy = vi
          .spyOn(imageReplay, 'drawPoint')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.strictEqual(setImageStyleSpy.mock.calls.length, 0);
        setImageStyleSpy.mockRestore();
        drawPointSpy.mockRestore();
      });

      it('does not render the multipoint', function () {
        feature.setGeometry(
          new MultiPoint([
            [0, 0],
            [1, 1],
          ]),
        );
        const imageReplay = builderGroup.getBuilder(style.getZIndex(), 'Image');
        const setImageStyleSpy = vi.spyOn(imageReplay, 'setImageStyle');
        const drawMultiPointSpy = vi
          .spyOn(imageReplay, 'drawMultiPoint')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.strictEqual(setImageStyleSpy.mock.calls.length, 0);
        setImageStyleSpy.mockRestore();
        drawMultiPointSpy.mockRestore();
      });

      it('does render the linestring', function () {
        feature.setGeometry(
          new LineString([
            [0, 0],
            [1, 1],
          ]),
        );
        const lineStringReplay = builderGroup.getBuilder(
          style.getZIndex(),
          'LineString',
        );
        const setFillStrokeStyleSpy = vi.spyOn(
          lineStringReplay,
          'setFillStrokeStyle',
        );
        const drawLineStringSpy = vi
          .spyOn(lineStringReplay, 'drawLineString')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.isAbove(setFillStrokeStyleSpy.mock.calls.length, 0);
        assert.isAbove(drawLineStringSpy.mock.calls.length, 0);
        setFillStrokeStyleSpy.mockRestore();
        drawLineStringSpy.mockRestore();
      });

      it('does render the multilinestring', function () {
        feature.setGeometry(
          new MultiLineString([
            [
              [0, 0],
              [1, 1],
            ],
          ]),
        );
        const lineStringReplay = builderGroup.getBuilder(
          style.getZIndex(),
          'LineString',
        );
        const setFillStrokeStyleSpy = vi.spyOn(
          lineStringReplay,
          'setFillStrokeStyle',
        );
        const drawMultiLineStringSpy = vi
          .spyOn(lineStringReplay, 'drawMultiLineString')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.isAbove(setFillStrokeStyleSpy.mock.calls.length, 0);
        assert.isAbove(drawMultiLineStringSpy.mock.calls.length, 0);
        setFillStrokeStyleSpy.mockRestore();
        drawMultiLineStringSpy.mockRestore();
      });

      it('does render the polygon', function () {
        feature.setGeometry(
          new Polygon([
            [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ]),
        );
        const polygonReplay = builderGroup.getBuilder(
          style.getZIndex(),
          'Polygon',
        );
        const setFillStrokeStyleSpy = vi.spyOn(
          polygonReplay,
          'setFillStrokeStyle',
        );
        const drawPolygonSpy = vi
          .spyOn(polygonReplay, 'drawPolygon')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.isAbove(setFillStrokeStyleSpy.mock.calls.length, 0);
        assert.isAbove(drawPolygonSpy.mock.calls.length, 0);
        setFillStrokeStyleSpy.mockRestore();
        drawPolygonSpy.mockRestore();
      });

      it('does render the multipolygon', function () {
        feature.setGeometry(
          new MultiPolygon([
            [
              [
                [0, 0],
                [1, 1],
                [1, 0],
                [0, 0],
              ],
            ],
          ]),
        );
        const polygonReplay = builderGroup.getBuilder(
          style.getZIndex(),
          'Polygon',
        );
        const setFillStrokeStyleSpy = vi.spyOn(
          polygonReplay,
          'setFillStrokeStyle',
        );
        const drawMultiPolygonSpy = vi
          .spyOn(polygonReplay, 'drawMultiPolygon')
          .mockImplementation(VOID);
        renderFeature(builderGroup, feature, style, squaredTolerance, listener);
        assert.isAbove(setFillStrokeStyleSpy.mock.calls.length, 0);
        assert.isAbove(drawMultiPolygonSpy.mock.calls.length, 0);
        setFillStrokeStyleSpy.mockRestore();
        drawMultiPolygonSpy.mockRestore();
      });
    });
  });
});
