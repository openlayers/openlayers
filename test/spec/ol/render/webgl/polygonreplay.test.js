

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.render.webgl.PolygonReplay');
goog.require('ol.render.webgl.polygonreplay.defaultshader');
goog.require('ol.render.webgl.polygonreplay.defaultshader.Locations');
goog.require('ol.structs.LinkedList');
goog.require('ol.structs.RBush');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');

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
      expect(replay.vertices).to.have.length(8);
      expect(replay.indices).to.have.length(3);

      expect(replay.vertices).to.eql([
        1000, 2000, 1200, 3000, 1200, 2000, 1000, 2000]);
      expect(replay.indices).to.eql([2, 0, 1]);

      var polygon2 = new ol.geom.Polygon(
          [[[4000, 2000], [4200, 2000], [4200, 3000]]]
      );
      replay.drawPolygon(polygon2, null);
      expect(replay.vertices).to.have.length(16);
      expect(replay.indices).to.have.length(6);

      expect(replay.vertices).to.eql([
        1000, 2000, 1200, 3000, 1200, 2000, 1000, 2000,
        4000, 2000, 4200, 3000, 4200, 2000, 4000, 2000
      ]);
      expect(replay.indices).to.eql([2, 0, 1, 6, 4, 5]);
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
      expect(replay.vertices).to.have.length(16);
      expect(replay.indices).to.have.length(6);

      expect(replay.vertices).to.eql([
        1000, 2000, 1200, 3000, 1200, 2000, 1000, 2000,
        4000, 2000, 4200, 3000, 4200, 2000, 4000, 2000
      ]);
      expect(replay.indices).to.eql([2, 0, 1, 6, 4, 5]);
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

  describe('#setUpProgram', function() {
    var context, gl;
    beforeEach(function() {
      context = {
        getProgram: function() {},
        useProgram: function() {}
      };
      gl = {
        enableVertexAttribArray: function() {},
        vertexAttribPointer: function() {},
        uniform1f: function() {},
        uniform2fv: function() {},
        getUniformLocation: function() {},
        getAttribLocation: function() {}
      };
    });

    it('returns the locations used by the shaders', function() {
      var locations = replay.setUpProgram(gl, context, [2, 2], 1);
      expect(locations).to.be.a(
          ol.render.webgl.polygonreplay.defaultshader.Locations);
    });

    it('gets and compiles the shaders', function() {
      sinon.spy(context, 'getProgram');
      sinon.spy(context, 'useProgram');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(context.getProgram.calledWithExactly(
          ol.render.webgl.polygonreplay.defaultshader.fragment,
          ol.render.webgl.polygonreplay.defaultshader.vertex)).to.be(true);
      expect(context.useProgram.calledOnce).to.be(true);
    });

    it('initializes the attrib pointers', function() {
      sinon.spy(gl, 'getAttribLocation');
      sinon.spy(gl, 'vertexAttribPointer');
      sinon.spy(gl, 'enableVertexAttribArray');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(gl.vertexAttribPointer.callCount).to.be(gl.getAttribLocation.callCount);
      expect(gl.enableVertexAttribArray.callCount).to.be(
          gl.getAttribLocation.callCount);
    });
  });

  describe('#shutDownProgram', function() {
    var context, gl;
    beforeEach(function() {
      context = {
        getProgram: function() {},
        useProgram: function() {}
      };
      gl = {
        enableVertexAttribArray: function() {},
        disableVertexAttribArray: function() {},
        vertexAttribPointer: function() {},
        uniform1f: function() {},
        uniform2fv: function() {},
        getUniformLocation: function() {},
        getAttribLocation: function() {}
      };
    });

    it('disables the attrib pointers', function() {
      sinon.spy(gl, 'getAttribLocation');
      sinon.spy(gl, 'disableVertexAttribArray');

      var locations = replay.setUpProgram(gl, context, [2, 2], 1);
      replay.shutDownProgram(gl, locations);
      expect(gl.disableVertexAttribArray.callCount).to.be(
          gl.getAttribLocation.callCount);
    });
  });

  describe('#drawReplay', function() {
    var gl, context;
    var feature1 = new ol.Feature({
      geometry: new ol.geom.Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
    });
    var feature2 = new ol.Feature({
      geometry: new ol.geom.Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
    });
    var feature3 = new ol.Feature({
      geometry: new ol.geom.Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
    });
    beforeEach(function() {
      gl = {
        getParameter: function() {},
        enable: function() {},
        disable: function() {},
        depthMask: function() {},
        depthFunc: function() {},
        clear: function() {}
      };
      context = {};
      replay.setFillStyle_ = function() {};
      replay.drawElements = function() {};
      sinon.spy(replay, 'setFillStyle_');
      sinon.spy(replay, 'drawElements');
    });

    it('draws the elements in a single call if they have the same style', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setFillStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledOnce).to.be(true);
    });

    it('draws the elements in batches if there are multiple fill styles', function() {
      var fillStyle2 = new ol.style.Fill({
        color: [0, 255, 0, 1]
      });
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle2, strokeStyle);
      replay.drawPolygon(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setFillStyle_.calledThrice).to.be(true);
      expect(replay.drawElements.calledThrice).to.be(true);
    });

    it('can skip elements if needed', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawPolygon(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);
      var skippedFeatHash = {};
      skippedFeatHash[ol.getUid(feature2).toString()] = true;

      replay.drawReplay(gl, context, skippedFeatHash, false);
      expect(replay.setFillStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledTwice).to.be(true);
    });
  });
});
