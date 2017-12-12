import {nullFunction} from '../../../../src/ol/index.js';
import _ol_events_ from '../../../../src/ol/events.js';
import _ol_geom_LineString_ from '../../../../src/ol/geom/LineString.js';
import _ol_geom_Point_ from '../../../../src/ol/geom/Point.js';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/Polygon.js';
import _ol_geom_MultiLineString_ from '../../../../src/ol/geom/MultiLineString.js';
import _ol_geom_MultiPoint_ from '../../../../src/ol/geom/MultiPoint.js';
import _ol_geom_MultiPolygon_ from '../../../../src/ol/geom/MultiPolygon.js';
import _ol_render_canvas_ReplayGroup_ from '../../../../src/ol/render/canvas/ReplayGroup.js';
import _ol_renderer_vector_ from '../../../../src/ol/renderer/vector.js';
import _ol_style_Fill_ from '../../../../src/ol/style/Fill.js';
import _ol_style_Icon_ from '../../../../src/ol/style/Icon.js';
import _ol_style_Stroke_ from '../../../../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../../../../src/ol/style/Style.js';
import _ol_Feature_ from '../../../../src/ol/Feature.js';


describe('ol.renderer.vector', function() {
  describe('#renderFeature', function() {
    var replayGroup;
    var feature, iconStyle, style, squaredTolerance, listener, listenerThis;
    var iconStyleLoadSpy;

    beforeEach(function() {
      replayGroup = new _ol_render_canvas_ReplayGroup_(1);
      feature = new _ol_Feature_();
      iconStyle = new _ol_style_Icon_({
        src: 'http://example.com/icon.png'
      });
      style = new _ol_style_Style_({
        image: iconStyle,
        fill: new _ol_style_Fill_({}),
        stroke: new _ol_style_Stroke_({})
      });
      squaredTolerance = 1;
      listener = function() {};
      listenerThis = {};
      iconStyleLoadSpy = sinon.stub(iconStyle, 'load').callsFake(function() {
        iconStyle.iconImage_.imageState_ = 1; // LOADING
      });
    });

    afterEach(function() {
      iconStyleLoadSpy.restore();
    });

    describe('call multiple times', function() {

      it('does not set multiple listeners', function() {
        var listeners;

        // call #1
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = _ol_events_.getListeners(
            iconStyle.iconImage_, 'change');
        expect(listeners.length).to.eql(1);

        // call #2
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = _ol_events_.getListeners(
            iconStyle.iconImage_, 'change');
        expect(listeners.length).to.eql(1);
      });

    });

    describe('call renderFeature with a loading icon', function() {

      it('does not render the point', function() {
        feature.setGeometry(new _ol_geom_Point_([0, 0]));
        var imageReplay = replayGroup.getReplay(
            style.getZIndex(), 'Image');
        var setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        var drawPointSpy = sinon.stub(imageReplay, 'drawPoint').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawPointSpy.restore();
      });

      it('does not render the multipoint', function() {
        feature.setGeometry(new _ol_geom_MultiPoint_([[0, 0], [1, 1]]));
        var imageReplay = replayGroup.getReplay(
            style.getZIndex(), 'Image');
        var setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        var drawMultiPointSpy = sinon.stub(imageReplay, 'drawMultiPoint').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawMultiPointSpy.restore();
      });

      it('does render the linestring', function() {
        feature.setGeometry(new _ol_geom_LineString_([[0, 0], [1, 1]]));
        var lineStringReplay = replayGroup.getReplay(
            style.getZIndex(), 'LineString');
        var setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
            'setFillStrokeStyle');
        var drawLineStringSpy = sinon.stub(lineStringReplay, 'drawLineString').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawLineStringSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawLineStringSpy.restore();
      });

      it('does render the multilinestring', function() {
        feature.setGeometry(new _ol_geom_MultiLineString_([[[0, 0], [1, 1]]]));
        var lineStringReplay = replayGroup.getReplay(
            style.getZIndex(), 'LineString');
        var setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
            'setFillStrokeStyle');
        var drawMultiLineStringSpy = sinon.stub(lineStringReplay, 'drawMultiLineString').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiLineStringSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiLineStringSpy.restore();
      });

      it('does render the polygon', function() {
        feature.setGeometry(new _ol_geom_Polygon_(
            [[[0, 0], [1, 1], [1, 0], [0, 0]]]));
        var polygonReplay = replayGroup.getReplay(
            style.getZIndex(), 'Polygon');
        var setFillStrokeStyleSpy = sinon.spy(polygonReplay,
            'setFillStrokeStyle');
        var drawPolygonSpy = sinon.stub(polygonReplay, 'drawPolygon').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawPolygonSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawPolygonSpy.restore();
      });

      it('does render the multipolygon', function() {
        feature.setGeometry(new _ol_geom_MultiPolygon_(
            [[[[0, 0], [1, 1], [1, 0], [0, 0]]]]));
        var polygonReplay = replayGroup.getReplay(
            style.getZIndex(), 'Polygon');
        var setFillStrokeStyleSpy = sinon.spy(polygonReplay,
            'setFillStrokeStyle');
        var drawMultiPolygonSpy = sinon.stub(polygonReplay, 'drawMultiPolygon').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiPolygonSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiPolygonSpy.restore();
      });
    });

  });
});
