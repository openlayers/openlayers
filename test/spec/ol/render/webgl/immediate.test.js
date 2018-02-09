import Feature from '../../../../../src/ol/Feature.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import WebGLCircleReplay from '../../../../../src/ol/render/webgl/CircleReplay.js';
import WebGLImageReplay from '../../../../../src/ol/render/webgl/ImageReplay.js';
import WebGLImmediateRenderer from '../../../../../src/ol/render/webgl/Immediate.js';
import WebGLLineStringReplay from '../../../../../src/ol/render/webgl/LineStringReplay.js';
import WebGLPolygonReplay from '../../../../../src/ol/render/webgl/PolygonReplay.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol.render.webgl.Immediate', function() {
  let context, style, circle, line, multiLine, point, multiPoint, polygon, multiPolygon;
  beforeEach(function() {
    context = new WebGLImmediateRenderer({}, [0, 0], 0, 0, [0, 0], [-180, -90, 180, 90], 1);
    style = new Style({
      image: new CircleStyle(),
      fill: new Fill(),
      stroke: new Stroke()
    });
    circle = new Circle([0, 0], 5);
    line = new LineString([[0, 0], [5, 5]]);
    multiLine = new MultiLineString([[[0, 0], [5, 5]]]);
    point = new Point([0, 0]);
    multiPoint = new MultiPoint([[0, 0]]);
    polygon = new Polygon([[[0, 0], [5, 5], [5, 0], [0, 0]]]);
    multiPolygon = new MultiPolygon([[[[0, 0], [5, 5], [5, 0], [0, 0]]]]);
  });

  describe('#setStyle', function() {
    it('sets the style of the context', function() {
      context.setStyle(style);
      expect(context.fillStyle_).to.be(style.getFill());
      expect(context.strokeStyle_).to.be(style.getStroke());
      expect(context.imageStyle_).to.be(style.getImage());
    });
  });

  describe('#drawFeature', function() {
    let feat;
    beforeEach(function() {
      feat = new Feature({
        geometry: circle
      });
      context.setStyle = function() {};
      context.drawGeometry = function() {};
      sinon.spy(context, 'setStyle');
      sinon.spy(context, 'drawGeometry');
    });

    it('updates the style of the context', function() {
      context.drawFeature(feat, style);
      expect(context.setStyle.calledOnce).to.be(true);
    });

    it('draws the geometry of the feature', function() {
      context.drawFeature(feat, style);
      expect(context.drawGeometry.calledOnce).to.be(true);
    });

    it('does nothing if no geometry is provided', function() {
      feat = new Feature();
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });

    it('does nothing if geometry is out of bounds', function() {
      feat = new Feature({
        geometry: new Circle([540, 540], 1)
      });
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });
  });

  describe('#drawGeometryCollection', function() {
    let geomColl;
    beforeEach(function() {
      geomColl = new GeometryCollection([circle, point, multiPoint,
        line, multiLine, polygon, multiPolygon]);
    });

    it('draws every geometry in the collection', function() {
      context.drawGeometry = function() {};
      sinon.spy(context, 'drawGeometry');

      context.drawGeometryCollection(geomColl);
      expect(context.drawGeometry.callCount).to.be(7);
    });
  });

  describe('geometry functions', function() {
    function mock(ctor, geomFunc) {
      const tmpObj = {};
      tmpObj.replay = ctor.prototype.replay;
      ctor.prototype.replay = sinon.spy();
      tmpObj.finish = ctor.prototype.finish;
      ctor.prototype.finish = sinon.spy();
      tmpObj.getDeleteResourcesFunction = ctor.prototype.getDeleteResourcesFunction;
      ctor.prototype.getDeleteResourcesFunction = sinon.spy(function() {
        return function() {};
      });
      sinon.spy(ctor.prototype.getDeleteResourcesFunction);
      if (ctor === WebGLImageReplay) {
        tmpObj.setImageStyle = ctor.prototype.setImageStyle;
        ctor.prototype.setImageStyle = sinon.spy();
      } else {
        tmpObj.setFillStrokeStyle = ctor.prototype.setFillStrokeStyle;
        ctor.prototype.setFillStrokeStyle = sinon.spy();
      }
      tmpObj[geomFunc] = ctor.prototype[geomFunc];
      ctor.prototype[geomFunc] = sinon.spy();
      return tmpObj;
    }

    function restore(ctor, tmpObj) {
      for (const i in tmpObj) {
        ctor.prototype[i] = tmpObj[i];
      }
    }

    describe('#drawPoint', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLImageReplay, 'drawPoint');
      });

      it('draws a point', function() {
        context.drawGeometry(point);
        expect(WebGLImageReplay.prototype.setImageStyle.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.drawPoint.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLImageReplay, tmpObj);
      });
    });

    describe('#drawMultiPoint', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLImageReplay, 'drawMultiPoint');
      });

      it('draws a multi point', function() {
        context.drawGeometry(multiPoint);
        expect(WebGLImageReplay.prototype.setImageStyle.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.drawMultiPoint.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLImageReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLImageReplay, tmpObj);
      });
    });

    describe('#drawLineString', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLLineStringReplay, 'drawLineString');
      });

      it('draws a line string', function() {
        context.drawGeometry(line);
        expect(WebGLLineStringReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.drawLineString.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLLineStringReplay, tmpObj);
      });
    });

    describe('#drawMultiLineString', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLLineStringReplay, 'drawMultiLineString');
      });

      it('draws a multi line string', function() {
        context.drawGeometry(multiLine);
        expect(WebGLLineStringReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.drawMultiLineString.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLLineStringReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLLineStringReplay, tmpObj);
      });
    });

    describe('#drawPolygon', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLPolygonReplay, 'drawPolygon');
      });

      it('draws a polygon', function() {
        context.drawGeometry(polygon);
        expect(WebGLPolygonReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.drawPolygon.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLPolygonReplay, tmpObj);
      });
    });

    describe('#drawMultiPolygon', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLPolygonReplay, 'drawMultiPolygon');
      });

      it('draws a multi polygon', function() {
        context.drawGeometry(multiPolygon);
        expect(WebGLPolygonReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.drawMultiPolygon.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLPolygonReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLPolygonReplay, tmpObj);
      });
    });

    describe('#drawCircle', function() {
      let tmpObj;
      beforeEach(function() {
        tmpObj = mock(WebGLCircleReplay, 'drawCircle');
      });

      it('draws a circle', function() {
        context.drawGeometry(circle);
        expect(WebGLCircleReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(WebGLCircleReplay.prototype.drawCircle.calledOnce).to.be(true);
        expect(WebGLCircleReplay.prototype.finish.calledOnce).to.be(true);
        expect(WebGLCircleReplay.prototype.replay.calledOnce).to.be(true);
        expect(WebGLCircleReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(WebGLCircleReplay, tmpObj);
      });
    });
  });
});
