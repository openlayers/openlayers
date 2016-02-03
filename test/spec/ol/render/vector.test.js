goog.provide('ol.test.renderer.vector');

describe('ol.renderer.vector', function() {
  describe('#renderFeature', function() {
    var replayGroup;
    var feature, iconStyle, style, squaredTolerance, listener, listenerThis;
    var iconStyleLoadSpy;

    beforeEach(function() {
      replayGroup = new ol.render.canvas.ReplayGroup(1);
      feature = new ol.Feature();
      iconStyle = new ol.style.Icon({
        src: 'http://example.com/icon.png'
      });
      style = new ol.style.Style({
        image: iconStyle,
        fill: new ol.style.Fill({}),
        stroke: new ol.style.Stroke({})
      });
      squaredTolerance = 1;
      listener = function() {};
      listenerThis = {};
      iconStyleLoadSpy = sinon.stub(iconStyle, 'load', function() {
        iconStyle.iconImage_.imageState_ = ol.style.ImageState.LOADING;
      });
    });

    afterEach(function() {
      iconStyleLoadSpy.restore();
    });

    describe('call multiple times', function() {

      it('does not set multiple listeners', function() {
        var listeners;

        // call #1
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = ol.events.getListeners(
            iconStyle.iconImage_, ol.events.EventType.CHANGE);
        expect(listeners.length).to.eql(1);

        // call #2
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = ol.events.getListeners(
            iconStyle.iconImage_, ol.events.EventType.CHANGE);
        expect(listeners.length).to.eql(1);
      });

    });

    describe('call renderFeature with a loading icon', function() {

      it('does not render the point', function() {
        feature.setGeometry(new ol.geom.Point([0, 0]));
        var imageReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.IMAGE);
        var setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        var drawPointGeometrySpy = sinon.stub(imageReplay,
            'drawPointGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawPointGeometrySpy.restore();
      });

      it('does not render the multipoint', function() {
        feature.setGeometry(new ol.geom.MultiPoint([[0, 0], [1, 1]]));
        var imageReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.IMAGE);
        var setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        var drawMultiPointGeometrySpy = sinon.stub(imageReplay,
            'drawMultiPointGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawMultiPointGeometrySpy.restore();
      });

      it('does render the linestring', function() {
        feature.setGeometry(new ol.geom.LineString([[0, 0], [1, 1]]));
        var lineStringReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.LINE_STRING);
        var setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
            'setFillStrokeStyle');
        var drawLineStringGeometrySpy = sinon.stub(lineStringReplay,
            'drawLineStringGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawLineStringGeometrySpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawLineStringGeometrySpy.restore();
      });

      it('does render the multilinestring', function() {
        feature.setGeometry(new ol.geom.MultiLineString([[[0, 0], [1, 1]]]));
        var lineStringReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.LINE_STRING);
        var setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
            'setFillStrokeStyle');
        var drawMultiLineStringGeometrySpy = sinon.stub(lineStringReplay,
            'drawMultiLineStringGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiLineStringGeometrySpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiLineStringGeometrySpy.restore();
      });

      it('does render the polygon', function() {
        feature.setGeometry(new ol.geom.Polygon(
            [[[0, 0], [1, 1], [1, 0], [0, 0]]]));
        var polygonReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.POLYGON);
        var setFillStrokeStyleSpy = sinon.spy(polygonReplay,
            'setFillStrokeStyle');
        var drawPolygonGeometrySpy = sinon.stub(polygonReplay,
            'drawPolygonGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawPolygonGeometrySpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawPolygonGeometrySpy.restore();
      });

      it('does render the multipolygon', function() {
        feature.setGeometry(new ol.geom.MultiPolygon(
            [[[[0, 0], [1, 1], [1, 0], [0, 0]]]]));
        var polygonReplay = replayGroup.getReplay(
            style.getZIndex(), ol.render.ReplayType.POLYGON);
        var setFillStrokeStyleSpy = sinon.spy(polygonReplay,
            'setFillStrokeStyle');
        var drawMultiPolygonGeometrySpy = sinon.stub(polygonReplay,
            'drawMultiPolygonGeometry', ol.nullFunction);
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiPolygonGeometrySpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiPolygonGeometrySpy.restore();
      });
    });

  });
});

goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.Feature');
