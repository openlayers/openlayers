

import _ol_Feature_ from '../../../../../src/ol/feature';
import _ol_geom_Circle_ from '../../../../../src/ol/geom/circle';
import _ol_geom_GeometryCollection_ from '../../../../../src/ol/geom/geometrycollection';
import _ol_geom_LineString_ from '../../../../../src/ol/geom/linestring';
import _ol_geom_MultiLineString_ from '../../../../../src/ol/geom/multilinestring';
import _ol_geom_MultiPoint_ from '../../../../../src/ol/geom/multipoint';
import _ol_geom_MultiPolygon_ from '../../../../../src/ol/geom/multipolygon';
import _ol_geom_Point_ from '../../../../../src/ol/geom/point';
import _ol_geom_Polygon_ from '../../../../../src/ol/geom/polygon';
import _ol_render_webgl_CircleReplay_ from '../../../../../src/ol/render/webgl/circlereplay';
import _ol_render_webgl_ImageReplay_ from '../../../../../src/ol/render/webgl/imagereplay';
import _ol_render_webgl_Immediate_ from '../../../../../src/ol/render/webgl/immediate';
import _ol_render_webgl_LineStringReplay_ from '../../../../../src/ol/render/webgl/linestringreplay';
import _ol_render_webgl_PolygonReplay_ from '../../../../../src/ol/render/webgl/polygonreplay';
import _ol_style_Circle_ from '../../../../../src/ol/style/circle';
import _ol_style_Fill_ from '../../../../../src/ol/style/fill';
import _ol_style_Stroke_ from '../../../../../src/ol/style/stroke';
import _ol_style_Style_ from '../../../../../src/ol/style/style';

describe('ol.render.webgl.Immediate', function() {
  var context, style, circle, line, multiLine, point, multiPoint, polygon, multiPolygon;
  beforeEach(function() {
    context = new _ol_render_webgl_Immediate_({}, [0, 0], 0, 0, [0, 0], [-180, -90, 180, 90], 1);
    style = new _ol_style_Style_({
      image: new _ol_style_Circle_(),
      fill: new _ol_style_Fill_(),
      stroke: new _ol_style_Stroke_()
    });
    circle = new _ol_geom_Circle_([0, 0], 5);
    line = new _ol_geom_LineString_([[0, 0], [5, 5]]);
    multiLine = new _ol_geom_MultiLineString_([[[0, 0], [5, 5]]]);
    point = new _ol_geom_Point_([0, 0]);
    multiPoint = new _ol_geom_MultiPoint_([[0, 0]]);
    polygon = new _ol_geom_Polygon_([[[0, 0], [5, 5], [5, 0], [0, 0]]]);
    multiPolygon = new _ol_geom_MultiPolygon_([[[[0, 0], [5, 5], [5, 0], [0, 0]]]]);
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
    var feat;
    beforeEach(function() {
      feat = new _ol_Feature_({
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
      feat = new _ol_Feature_();
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });

    it('does nothing if geometry is out of bounds', function() {
      feat = new _ol_Feature_({
        geometry: new _ol_geom_Circle_([540, 540], 1)
      });
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });
  });

  describe('#drawGeometryCollection', function() {
    var geomColl;
    beforeEach(function() {
      geomColl = new _ol_geom_GeometryCollection_([circle, point, multiPoint,
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
      var tmpObj = {};
      tmpObj.replay = ctor.prototype.replay;
      ctor.prototype.replay = sinon.spy();
      tmpObj.finish = ctor.prototype.finish;
      ctor.prototype.finish = sinon.spy();
      tmpObj.getDeleteResourcesFunction = ctor.prototype.getDeleteResourcesFunction;
      ctor.prototype.getDeleteResourcesFunction = sinon.spy(function() {
        return function() {};
      });
      sinon.spy(ctor.prototype.getDeleteResourcesFunction);
      if (ctor === _ol_render_webgl_ImageReplay_) {
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
      for (var i in tmpObj) {
        ctor.prototype[i] = tmpObj[i];
      }
    }

    describe('#drawPoint', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_ImageReplay_, 'drawPoint');
      });

      it('draws a point', function() {
        context.drawGeometry(point);
        expect(_ol_render_webgl_ImageReplay_.prototype.setImageStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.drawPoint.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_ImageReplay_, tmpObj);
      });
    });

    describe('#drawMultiPoint', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_ImageReplay_, 'drawMultiPoint');
      });

      it('draws a multi point', function() {
        context.drawGeometry(multiPoint);
        expect(_ol_render_webgl_ImageReplay_.prototype.setImageStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.drawMultiPoint.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_ImageReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_ImageReplay_, tmpObj);
      });
    });

    describe('#drawLineString', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_LineStringReplay_, 'drawLineString');
      });

      it('draws a line string', function() {
        context.drawGeometry(line);
        expect(_ol_render_webgl_LineStringReplay_.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.drawLineString.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_LineStringReplay_, tmpObj);
      });
    });

    describe('#drawMultiLineString', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_LineStringReplay_, 'drawMultiLineString');
      });

      it('draws a multi line string', function() {
        context.drawGeometry(multiLine);
        expect(_ol_render_webgl_LineStringReplay_.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.drawMultiLineString.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_LineStringReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_LineStringReplay_, tmpObj);
      });
    });

    describe('#drawPolygon', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_PolygonReplay_, 'drawPolygon');
      });

      it('draws a polygon', function() {
        context.drawGeometry(polygon);
        expect(_ol_render_webgl_PolygonReplay_.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.drawPolygon.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_PolygonReplay_, tmpObj);
      });
    });

    describe('#drawMultiPolygon', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_PolygonReplay_, 'drawMultiPolygon');
      });

      it('draws a multi polygon', function() {
        context.drawGeometry(multiPolygon);
        expect(_ol_render_webgl_PolygonReplay_.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.drawMultiPolygon.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_PolygonReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_PolygonReplay_, tmpObj);
      });
    });

    describe('#drawCircle', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(_ol_render_webgl_CircleReplay_, 'drawCircle');
      });

      it('draws a circle', function() {
        context.drawGeometry(circle);
        expect(_ol_render_webgl_CircleReplay_.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(_ol_render_webgl_CircleReplay_.prototype.drawCircle.calledOnce).to.be(true);
        expect(_ol_render_webgl_CircleReplay_.prototype.finish.calledOnce).to.be(true);
        expect(_ol_render_webgl_CircleReplay_.prototype.replay.calledOnce).to.be(true);
        expect(_ol_render_webgl_CircleReplay_.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(_ol_render_webgl_CircleReplay_, tmpObj);
      });
    });
  });
});
