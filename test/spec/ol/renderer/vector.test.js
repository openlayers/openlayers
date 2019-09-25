import {VOID} from '../../../../src/ol/functions.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import CanvasBuilderGroup from '../../../../src/ol/render/canvas/BuilderGroup.js';
import {renderFeature} from '../../../../src/ol/renderer/vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Feature from '../../../../src/ol/Feature.js';


describe('ol.renderer.vector', () => {
  describe('#renderFeature', () => {
    let builderGroup;
    let feature, iconStyle, style, squaredTolerance, listener, listenerThis;
    let iconStyleLoadSpy;

    beforeEach(() => {
      builderGroup = new CanvasBuilderGroup(1);
      feature = new Feature();
      iconStyle = new Icon({
        src: 'http://example.com/icon.png'
      });
      style = new Style({
        image: iconStyle,
        fill: new Fill({}),
        stroke: new Stroke({})
      });
      squaredTolerance = 1;
      listener = function() {};
      listenerThis = {};
      iconStyleLoadSpy = sinon.stub(iconStyle, 'load').callsFake(function() {
        iconStyle.iconImage_.imageState_ = 1; // LOADING
      });
    });

    afterEach(() => {
      iconStyleLoadSpy.restore();
    });

    describe('call multiple times', () => {

      test('does not set multiple listeners', () => {
        let listeners;

        // call #1
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).toBeTruthy();
        listeners = iconStyle.iconImage_.listeners_['change'];
        expect(listeners.length).toEqual(1);

        // call #2
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).toBeTruthy();
        listeners = iconStyle.iconImage_.listeners_['change'];
        expect(listeners.length).toEqual(1);
      });

    });

    describe('call renderFeature with a loading icon', () => {

      test('does not render the point', () => {
        feature.setGeometry(new Point([0, 0]));
        const imageReplay = builderGroup.getBuilder(
          style.getZIndex(), 'Image');
        const setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        const drawPointSpy = sinon.stub(imageReplay, 'drawPoint').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).toBe(false);
        setImageStyleSpy.restore();
        drawPointSpy.restore();
      });

      test('does not render the multipoint', () => {
        feature.setGeometry(new MultiPoint([[0, 0], [1, 1]]));
        const imageReplay = builderGroup.getBuilder(
          style.getZIndex(), 'Image');
        const setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        const drawMultiPointSpy = sinon.stub(imageReplay, 'drawMultiPoint').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).toBe(false);
        setImageStyleSpy.restore();
        drawMultiPointSpy.restore();
      });

      test('does render the linestring', () => {
        feature.setGeometry(new LineString([[0, 0], [1, 1]]));
        const lineStringReplay = builderGroup.getBuilder(
          style.getZIndex(), 'LineString');
        const setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
          'setFillStrokeStyle');
        const drawLineStringSpy = sinon.stub(lineStringReplay, 'drawLineString').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).toBe(true);
        expect(drawLineStringSpy.called).toBe(true);
        setFillStrokeStyleSpy.restore();
        drawLineStringSpy.restore();
      });

      test('does render the multilinestring', () => {
        feature.setGeometry(new MultiLineString([[[0, 0], [1, 1]]]));
        const lineStringReplay = builderGroup.getBuilder(
          style.getZIndex(), 'LineString');
        const setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
          'setFillStrokeStyle');
        const drawMultiLineStringSpy = sinon.stub(lineStringReplay, 'drawMultiLineString').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).toBe(true);
        expect(drawMultiLineStringSpy.called).toBe(true);
        setFillStrokeStyleSpy.restore();
        drawMultiLineStringSpy.restore();
      });

      test('does render the polygon', () => {
        feature.setGeometry(new Polygon(
          [[[0, 0], [1, 1], [1, 0], [0, 0]]]));
        const polygonReplay = builderGroup.getBuilder(
          style.getZIndex(), 'Polygon');
        const setFillStrokeStyleSpy = sinon.spy(polygonReplay,
          'setFillStrokeStyle');
        const drawPolygonSpy = sinon.stub(polygonReplay, 'drawPolygon').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).toBe(true);
        expect(drawPolygonSpy.called).toBe(true);
        setFillStrokeStyleSpy.restore();
        drawPolygonSpy.restore();
      });

      test('does render the multipolygon', () => {
        feature.setGeometry(new MultiPolygon(
          [[[[0, 0], [1, 1], [1, 0], [0, 0]]]]));
        const polygonReplay = builderGroup.getBuilder(
          style.getZIndex(), 'Polygon');
        const setFillStrokeStyleSpy = sinon.spy(polygonReplay,
          'setFillStrokeStyle');
        const drawMultiPolygonSpy = sinon.stub(polygonReplay, 'drawMultiPolygon').callsFake(VOID);
        renderFeature(builderGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).toBe(true);
        expect(drawMultiPolygonSpy.called).toBe(true);
        setFillStrokeStyleSpy.restore();
        drawMultiPolygonSpy.restore();
      });
    });

  });
});
