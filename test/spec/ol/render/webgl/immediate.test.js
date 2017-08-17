

goog.require('ol.Feature');
goog.require('ol.geom.Circle');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.webgl.CircleReplay');
goog.require('ol.render.webgl.ImageReplay');
goog.require('ol.render.webgl.Immediate');
goog.require('ol.render.webgl.LineStringReplay');
goog.require('ol.render.webgl.PolygonReplay');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

describe('ol.render.webgl.Immediate', function() {
  var context, style, circle, line, multiLine, point, multiPoint, polygon, multiPolygon;
  beforeEach(function() {
    context = new ol.render.webgl.Immediate({}, [0, 0], 0, 0, [0, 0], [-180, -90, 180, 90], 1);
    style = new ol.style.Style({
      image: new ol.style.Circle(),
      fill: new ol.style.Fill(),
      stroke: new ol.style.Stroke()
    });
    circle = new ol.geom.Circle([0, 0], 5);
    line = new ol.geom.LineString([[0, 0], [5, 5]]);
    multiLine = new ol.geom.MultiLineString([[[0, 0], [5, 5]]]);
    point = new ol.geom.Point([0, 0]);
    multiPoint = new ol.geom.MultiPoint([[0, 0]]);
    polygon = new ol.geom.Polygon([[[0, 0], [5, 5], [5, 0], [0, 0]]]);
    multiPolygon = new ol.geom.MultiPolygon([[[[0, 0], [5, 5], [5, 0], [0, 0]]]]);
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
      feat = new ol.Feature({
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
      feat = new ol.Feature();
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });

    it('does nothing if geometry is out of bounds', function() {
      feat = new ol.Feature({
        geometry: new ol.geom.Circle([540, 540], 1)
      });
      context.drawFeature(feat, style);
      expect(context.setStyle.called).to.be(false);
      expect(context.drawGeometry.called).to.be(false);
    });
  });

  describe('#drawGeometryCollection', function() {
    var geomColl;
    beforeEach(function() {
      geomColl = new ol.geom.GeometryCollection([circle, point, multiPoint,
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
      if (ctor === ol.render.webgl.ImageReplay) {
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
        tmpObj = mock(ol.render.webgl.ImageReplay, 'drawPoint');
      });

      it('draws a point', function() {
        context.drawGeometry(point);
        expect(ol.render.webgl.ImageReplay.prototype.setImageStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.drawPoint.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.ImageReplay, tmpObj);
      });
    });

    describe('#drawMultiPoint', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.ImageReplay, 'drawMultiPoint');
      });

      it('draws a multi point', function() {
        context.drawGeometry(multiPoint);
        expect(ol.render.webgl.ImageReplay.prototype.setImageStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.drawMultiPoint.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.ImageReplay, tmpObj);
      });
    });

    describe('#drawLineString', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.LineStringReplay, 'drawLineString');
      });

      it('draws a line string', function() {
        context.drawGeometry(line);
        expect(ol.render.webgl.LineStringReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.drawLineString.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.LineStringReplay, tmpObj);
      });
    });

    describe('#drawMultiLineString', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.LineStringReplay, 'drawMultiLineString');
      });

      it('draws a multi line string', function() {
        context.drawGeometry(multiLine);
        expect(ol.render.webgl.LineStringReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.drawMultiLineString.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.LineStringReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.LineStringReplay, tmpObj);
      });
    });

    describe('#drawPolygon', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.PolygonReplay, 'drawPolygon');
      });

      it('draws a polygon', function() {
        context.drawGeometry(polygon);
        expect(ol.render.webgl.PolygonReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.drawPolygon.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.PolygonReplay, tmpObj);
      });
    });

    describe('#drawMultiPolygon', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.PolygonReplay, 'drawMultiPolygon');
      });

      it('draws a multi polygon', function() {
        context.drawGeometry(multiPolygon);
        expect(ol.render.webgl.PolygonReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.drawMultiPolygon.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.PolygonReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.PolygonReplay, tmpObj);
      });
    });

    describe('#drawCircle', function() {
      var tmpObj;
      beforeEach(function() {
        tmpObj = mock(ol.render.webgl.CircleReplay, 'drawCircle');
      });

      it('draws a circle', function() {
        context.drawGeometry(circle);
        expect(ol.render.webgl.CircleReplay.prototype.setFillStrokeStyle.calledOnce).to.be(true);
        expect(ol.render.webgl.CircleReplay.prototype.drawCircle.calledOnce).to.be(true);
        expect(ol.render.webgl.CircleReplay.prototype.finish.calledOnce).to.be(true);
        expect(ol.render.webgl.CircleReplay.prototype.replay.calledOnce).to.be(true);
        expect(ol.render.webgl.CircleReplay.prototype.getDeleteResourcesFunction.calledOnce).to.be(true);
      });

      after(function() {
        restore(ol.render.webgl.CircleReplay, tmpObj);
      });
    });
  });
});
