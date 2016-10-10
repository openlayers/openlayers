goog.provide('ol.test.render.webgl.Replay');

goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.webgl.ImageReplay');
goog.require('ol.render.webgl.LineStringReplay');
goog.require('ol.render.webgl.PolygonReplay');
goog.require('ol.structs.LinkedList');
goog.require('ol.structs.RBush');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Stroke');


describe('ol.render.webgl.ImageReplay', function() {
  var replay;

  var createImageStyle = function(image) {
    var imageStyle = new ol.style.Image({
      opacity: 0.1,
      rotateWithView: true,
      rotation: 1.5,
      scale: 2.0
    });
    imageStyle.getAnchor = function() {
      return [0.5, 1];
    };
    imageStyle.getImage = function() {
      return image;
    };
    imageStyle.getHitDetectionImage = function() {
      return image;
    };
    imageStyle.getImageSize = function() {
      return [512, 512];
    };
    imageStyle.getHitDetectionImageSize = function() {
      return [512, 512];
    };
    imageStyle.getOrigin = function() {
      return [200, 200];
    };
    imageStyle.getSize = function() {
      return [256, 256];
    };
    return imageStyle;
  };

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.ImageReplay(tolerance, maxExtent);
  });

  describe('#setImageStyle', function() {

    var imageStyle1, imageStyle2;

    beforeEach(function() {
      imageStyle1 = createImageStyle(new Image());
      imageStyle2 = createImageStyle(new Image());
    });

    it('set expected states', function() {
      replay.setImageStyle(imageStyle1);
      expect(replay.anchorX_).to.be(0.5);
      expect(replay.anchorY_).to.be(1);
      expect(replay.height_).to.be(256);
      expect(replay.imageHeight_).to.be(512);
      expect(replay.imageWidth_).to.be(512);
      expect(replay.opacity_).to.be(0.1);
      expect(replay.originX_).to.be(200);
      expect(replay.originY_).to.be(200);
      expect(replay.rotation_).to.be(1.5);
      expect(replay.rotateWithView_).to.be(true);
      expect(replay.scale_).to.be(2.0);
      expect(replay.width_).to.be(256);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices_).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices_).to.have.length(0);

      replay.setImageStyle(imageStyle1);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices_).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices_).to.have.length(0);

      replay.setImageStyle(imageStyle2);
      expect(replay.images_).to.have.length(2);
      expect(replay.groupIndices_).to.have.length(1);
      expect(replay.hitDetectionImages_).to.have.length(2);
      expect(replay.hitDetectionGroupIndices_).to.have.length(1);
    });
  });

  describe('#drawPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var point;

      point = new ol.geom.Point([1000, 2000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(32);
      expect(replay.indices).to.have.length(6);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);

      point = new ol.geom.Point([2000, 3000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);
    });
  });

  describe('#drawMultiPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var multiPoint;

      multiPoint = new ol.geom.MultiPoint(
          [[1000, 2000], [2000, 3000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);

      multiPoint = new ol.geom.MultiPoint(
          [[3000, 4000], [4000, 5000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(128);
      expect(replay.indices).to.have.length(24);
      expect(replay.indices[12]).to.be(8);
      expect(replay.indices[13]).to.be(9);
      expect(replay.indices[14]).to.be(10);
      expect(replay.indices[15]).to.be(8);
      expect(replay.indices[16]).to.be(10);
      expect(replay.indices[17]).to.be(11);
      expect(replay.indices[18]).to.be(12);
      expect(replay.indices[19]).to.be(13);
      expect(replay.indices[20]).to.be(14);
      expect(replay.indices[21]).to.be(12);
      expect(replay.indices[22]).to.be(14);
      expect(replay.indices[23]).to.be(15);
    });
  });
});

describe('ol.render.webgl.LineStringReplay', function() {
  var replay;

  var strokeStyle1 = new ol.style.Stroke({
    color: [0, 255, 0, 0.4]
  });

  var strokeStyle2 = new ol.style.Stroke({
    color: [255, 0, 0, 1],
    lineCap: 'square',
    lineJoin: 'miter'
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.LineStringReplay(tolerance, maxExtent);
  });

  describe('#setFillStrokeStyle', function() {

    it('set expected states', function() {
      replay.setFillStrokeStyle(null, strokeStyle1);
      expect(replay.state_).not.be(null);
      expect(replay.state_.lineCap).to.be('round');
      expect(replay.state_.lineJoin).to.be('round');
      expect(replay.state_.strokeColor).to.eql([0, 1, 0, 0.4]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.miterLimit).to.be(10);
      expect(replay.state_.changed).to.be(true);
      expect(replay.styles_).to.have.length(1);

      replay.setFillStrokeStyle(null, strokeStyle2);
      expect(replay.state_.lineCap).to.be('square');
      expect(replay.state_.lineJoin).to.be('miter');
      expect(replay.state_.strokeColor).to.eql([1, 0, 0, 1]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.miterLimit).to.be(10);
      expect(replay.state_.changed).to.be(true);
      expect(replay.styles_).to.have.length(2);

    });
  });

  describe('#drawLineString', function() {

    it('sets the buffer data', function() {
      var linestring;

      linestring = new ol.geom.LineString(
          [[1000, 2000], [2000, 3000]]);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(linestring, null);
      expect(replay.vertices).to.have.length(56);
      expect(replay.indices).to.have.length(18);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      replay.drawLineString(linestring, null);
      expect(replay.vertices).to.have.length(140);
      expect(replay.indices).to.have.length(48);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(2);
      expect(replay.startIndicesFeature).to.have.length(2);
    });
  });

  describe('#drawMultiLineString', function() {

    it('sets the buffer data', function() {
      var multilinestring;

      multilinestring = new ol.geom.MultiLineString(
          [[[1000, 2000], [2000, 3000]],
          [[1000, 3000], [2000, 4000], [3000, 3000]]]);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawMultiLineString(multilinestring, null);
      expect(replay.vertices).to.have.length(140);
      expect(replay.indices).to.have.length(48);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);
    });
  });

  describe('#drawCoordinates_', function() {

    it('triangulates linestrings', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 1,
          2, 4, 3,
          5, 3, 4, 4, 6, 5]);
    });

    it('optionally creates miters', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 1,
          2, 4, 3, 3, 5, 2,
          6, 3, 4, 4, 7, 6]);
    });

    it('optionally creates caps', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1]
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 1, 3, 2,
          4, 2, 3, 6, 4, 3,
          4, 6, 5, 5, 7, 4,
          8, 5, 6, 6, 9, 8,
          10, 8, 9, 9, 11, 10]);
    });

    it('respects segment orientation', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 2000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 0,
          2, 4, 3,
          5, 3, 4, 4, 6, 5]);
    });

    it('closes boundaries', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000], [1000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [0, 2, 1, 3, 1, 2,
          5, 3, 2,
          3, 5, 4, 6, 4, 5,
          8, 6, 5,
          6, 8, 7, 9, 7, 8,
          10, 9, 8]);
      expect(replay.vertices.slice(0, 7)).to.eql(
          replay.vertices.slice(-14, -7));
      expect(replay.vertices.slice(14, 21)).to.eql(
          replay.vertices.slice(-7));
    });
  });
});


describe('ol.render.webgl.PolygonReplay', function() {
  var replay;

  var fillStyle = new ol.style.Fill({
    color: [0, 0, 255, 0.5]
  });
  var strokeStyle = new ol.style.Stroke({
    color: [0, 255, 0, 0.4]
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.PolygonReplay(tolerance, maxExtent);
  });

  describe('#drawPolygon', function() {
    beforeEach(function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
    });

    it('sets the buffer data', function() {
      var polygon1 = new ol.geom.Polygon(
          [[[1000, 2000], [1200, 2000], [1200, 3000]]]
          );
      replay.drawPolygon(polygon1, null);
      expect(replay.vertices).to.have.length(6);
      expect(replay.indices).to.have.length(3);

      expect(replay.vertices).to.eql([
        1200, 3000, 1200, 2000, 1000, 2000]);
      expect(replay.indices).to.eql([2, 0, 1]);

      var polygon2 = new ol.geom.Polygon(
          [[[4000, 2000], [4200, 2000], [4200, 3000]]]
          );
      replay.drawPolygon(polygon2, null);
      expect(replay.vertices).to.have.length(12);
      expect(replay.indices).to.have.length(6);

      expect(replay.vertices).to.eql([
        1200, 3000, 1200, 2000, 1000, 2000,
        4200, 3000, 4200, 2000, 4000, 2000
      ]);
      expect(replay.indices).to.eql([2, 0, 1, 5, 3, 4]);
    });
  });

  describe('#drawMultiPolygon', function() {
    beforeEach(function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
    });

    it('sets the buffer data', function() {
      var multiPolygon = new ol.geom.MultiPolygon([
        [[[1000, 2000], [1200, 2000], [1200, 3000]]],
        [[[4000, 2000], [4200, 2000], [4200, 3000]]]
      ]);
      replay.drawMultiPolygon(multiPolygon, null);
      expect(replay.vertices).to.have.length(12);
      expect(replay.indices).to.have.length(6);

      expect(replay.vertices).to.eql([
        1200, 3000, 1200, 2000, 1000, 2000,
        4200, 3000, 4200, 2000, 4000, 2000
      ]);
      expect(replay.indices).to.eql([2, 0, 1, 5, 3, 4]);
    });
  });

  describe('triangulating functions', function() {
    var list, rtree;
    beforeEach(function() {
      list = new ol.structs.LinkedList();
      rtree = new ol.structs.RBush();
    });

    describe('#createPoint_', function() {
      it('creates a WebGL polygon vertex', function() {
        var p = replay.createPoint_(1, 1, 1);
        expect(p.x).to.be(1);
        expect(p.y).to.be(1);
        expect(p.i).to.be(1);
        expect(p.reflex).to.be(undefined);
      });

      it('adds the point to the vertex array', function() {
        replay.createPoint_(1, 1, 1);
        expect(replay.vertices.length).to.be(2);
        expect(replay.vertices[0]).to.be(1);
        expect(replay.vertices[1]).to.be(1);
      });
    });

    describe('#insertItem_', function() {
      var p0, p1;
      beforeEach(function() {
        p0 = replay.createPoint_(1, 1, 1);
        p1 = replay.createPoint_(2, 2, 2);
      });

      it('creates a WebGL polygon segment', function() {
        var seg = replay.insertItem_(p0, p1, list, rtree);
        expect(seg.p0).to.be(p0);
        expect(seg.p1).to.be(p1);
      });

      it('inserts the segment into the provided linked list', function() {
        var seg = replay.insertItem_(p0, p1, list, rtree);
        expect(list.head_.data).to.be(seg);
      });

      it('inserts the segment into the R-Tree, if provided', function() {
        replay.insertItem_(p0, p1, list);
        expect(rtree.isEmpty()).to.be(true);
        replay.insertItem_(p0, p1, list, rtree);
        expect(rtree.isEmpty()).to.be(false);
      });
    });

    describe('#removeItem_', function() {
      var s0, s1;
      beforeEach(function() {
        var p = replay.createPoint_(2, 2, 2);
        s0 = replay.insertItem_(replay.createPoint_(1, 1, 1),
            p, list, rtree);
        s1 = replay.insertItem_(p,
            replay.createPoint_(5, 2, 3), list, rtree);
      });

      it('removes the current item', function() {
        replay.removeItem_(s0, s1, list, rtree);
        expect(list.head_.data).not.to.be(s1);
        expect(rtree.getAll().length).to.be(1);
      });

      it('updates the preceding segment', function() {
        var dataExtent = rtree.getExtent();
        replay.removeItem_(s0, s1, list, rtree);
        expect(s0.p1).to.be(s1.p1);
        expect(rtree.getExtent()).to.eql(dataExtent);
      });
    });

    describe('#getPointsInTriangle_', function() {
      var p0, p1, p2, p3;
      beforeEach(function() {
        p0 = replay.createPoint_(2, 0, 0);
        p1 = replay.createPoint_(0, 5, 1);
        p2 = replay.createPoint_(2, 3, 2);
        p3 = replay.createPoint_(4, 5, 3);
        replay.insertItem_(p0, p1, list, rtree);
        replay.insertItem_(p1, p2, list, rtree);
        replay.insertItem_(p2, p3, list, rtree);
        replay.insertItem_(p3, p0, list, rtree);
        replay.classifyPoints_(list, rtree, false);
      });

      it('gets every point in a triangle', function() {
        var points = replay.getPointsInTriangle_({x: -3, y: 6}, {x: 7, y: 6},
            {x: 2, y: 2}, rtree);
        expect(points).to.eql([p1, p2, p3]);
      });

      it('gets only reflex points in a triangle', function() {
        var points = replay.getPointsInTriangle_({x: -3, y: 6}, {x: 7, y: 6},
            {x: 2, y: 2}, rtree, true);
        expect(points).to.eql([p2]);
      });
    });

    describe('#getIntersections_', function() {
      var p0, p1, p2, p3, s0, s1, s2, s3;
      beforeEach(function() {
        p0 = replay.createPoint_(2, 0, 0);
        p1 = replay.createPoint_(0, 5, 1);
        p2 = replay.createPoint_(2, 3, 2);
        p3 = replay.createPoint_(4, 5, 3);
        s0 = replay.insertItem_(p0, p1, list, rtree);
        s1 = replay.insertItem_(p1, p2, list, rtree);
        s2 = replay.insertItem_(p2, p3, list, rtree);
        s3 = replay.insertItem_(p3, p0, list, rtree);
      });

      it('gets intersecting, but non touching segments', function() {
        var segments = replay.getIntersections_({p0: {x: 0, y: 3}, p1: {x: 4, y: 5}},
            rtree);
        expect(segments).to.eql([s0, s1]);
      });

      it('gets intersecting and touching segments', function() {
        var segments = replay.getIntersections_({p0: {x: 0, y: 3}, p1: {x: 4, y: 5}},
            rtree, true);
        expect(segments).to.eql([s0, s1, s2, s3]);
      });
    });

    describe('#calculateIntersection_', function() {
      var p0 = {x: 0, y: 0};
      var p1 = {x: 4, y: 4};
      var p2 = {x: 0, y: 4};
      var p3 = {x: 4, y: 0};

      it('calculates the intersection point of two intersecting segments', function() {
        var i = replay.calculateIntersection_(p0, p1, p2, p3);
        var t = replay.calculateIntersection_(p0, p1, p1, p2);
        expect(i).to.eql([2, 2]);
        expect(t).to.be(undefined);
      });

      it('calculates the intersection point of two touching segments', function() {
        var t = replay.calculateIntersection_(p0, p1, p1, p2, true);
        expect(t).to.eql([4, 4]);
      });
    });

    describe('#diagonalIsInside_', function() {
      var p0, p1, p2, p3;
      beforeEach(function() {
        p0 = replay.createPoint_(2, 0, 0);
        p1 = replay.createPoint_(0, 5, 1);
        p2 = replay.createPoint_(2, 3, 2);
        p3 = replay.createPoint_(4, 5, 3);
        replay.insertItem_(p0, p1, list, rtree);
        replay.insertItem_(p1, p2, list, rtree);
        replay.insertItem_(p2, p3, list, rtree);
        replay.insertItem_(p3, p0, list, rtree);
        replay.classifyPoints_(list, rtree, false);
      });

      it('identifies if diagonal is inside the polygon', function() {
        var inside = replay.diagonalIsInside_(p1, p2, p3, p0, p1);
        expect(inside).to.be(true);
      });

      it('identifies if diagonal is outside the polygon', function() {
        var inside = replay.diagonalIsInside_(p0, p1, p2, p3, p0);
        expect(inside).to.be(false);
      });
    });

    describe('#classifyPoints_', function() {
      var p0, p1, p2, p3;
      beforeEach(function() {
        p0 = replay.createPoint_(2, 0, 0);
        p1 = replay.createPoint_(0, 5, 1);
        p2 = replay.createPoint_(2, 3, 2);
        p3 = replay.createPoint_(4, 5, 3);
        replay.insertItem_(p0, p1, list, rtree);
        replay.insertItem_(p1, p2, list, rtree);
        replay.insertItem_(p2, p3, list, rtree);
        replay.insertItem_(p3, p0, list, rtree);
      });

      it('classifies the points of clockwise polygons', function() {
        replay.classifyPoints_(list, rtree, false);
        expect(p0.reflex).to.be(false);
        expect(p1.reflex).to.be(false);
        expect(p2.reflex).to.be(true);
        expect(p3.reflex).to.be(false);
      });

      it('classifies the points of counter-clockwise polygons', function() {
        replay.classifyPoints_(list, rtree, true);
        expect(p0.reflex).to.be(true);
        expect(p1.reflex).to.be(true);
        expect(p2.reflex).to.be(false);
        expect(p3.reflex).to.be(true);
      });

      it('removes collinear points', function() {
        replay.insertItem_(p3, p0, list, rtree);
        replay.classifyPoints_(list, rtree, false);
        expect(list.getLength()).to.be(4);
        expect(rtree.getAll().length).to.be(4);
      });
    });

    describe('#isSimple_', function() {
      var p0, p1, p2, p3;
      beforeEach(function() {
        p0 = replay.createPoint_(2, 0, 0);
        p1 = replay.createPoint_(0, 5, 1);
        p2 = replay.createPoint_(2, 3, 2);
        p3 = replay.createPoint_(4, 5, 3);
        replay.insertItem_(p0, p1, list, rtree);
        replay.insertItem_(p1, p2, list, rtree);
        replay.insertItem_(p2, p3, list, rtree);
        replay.insertItem_(p3, p0, list, rtree);
      });

      it('identifies simple polygons', function() {
        var simple = replay.isSimple_(list, rtree);
        expect(simple).to.be(true);
      });

      it('identifies self-intersecting polygons', function() {
        var p4 = replay.createPoint_(2, 5, 4);
        var p5 = replay.createPoint_(4, 2, 5);
        replay.insertItem_(p0, p4, list, rtree);
        replay.insertItem_(p4, p5, list, rtree);
        replay.insertItem_(p5, p0, list, rtree);
        var simple = replay.isSimple_(list, rtree);
        expect(simple).to.be(false);
      });
    });
  });
});
