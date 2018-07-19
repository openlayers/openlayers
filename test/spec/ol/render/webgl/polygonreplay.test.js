import {getUid} from '../../../../../src/ol/util.js';
import Feature from '../../../../../src/ol/Feature.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import WebGLPolygonReplay from '../../../../../src/ol/render/webgl/PolygonReplay.js';
import {fragment, vertex} from '../../../../../src/ol/render/webgl/polygonreplay/defaultshader.js';
import Locations from '../../../../../src/ol/render/webgl/polygonreplay/defaultshader/Locations.js';
import LinkedList from '../../../../../src/ol/structs/LinkedList.js';
import RBush from '../../../../../src/ol/structs/RBush.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol.render.webgl.PolygonReplay', function() {
  let replay;

  const fillStyle = new Fill({
    color: [0, 0, 255, 0.5]
  });
  const strokeStyle = new Stroke({
    color: [0, 255, 0, 0.4]
  });

  beforeEach(function() {
    const tolerance = 0.1;
    const maxExtent = [-10000, -20000, 10000, 20000];
    replay = new WebGLPolygonReplay(tolerance, maxExtent);
  });

  describe('#drawPolygon', function() {
    beforeEach(function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
    });

    it('sets the buffer data', function() {
      const polygon1 = new Polygon(
        [[[1000, 2000], [1200, 2000], [1200, 3000]]]
      );
      replay.drawPolygon(polygon1, null);
      expect(replay.vertices).to.have.length(8);
      expect(replay.indices).to.have.length(3);

      expect(replay.vertices).to.eql([
        1000, 2000, 1200, 3000, 1200, 2000, 1000, 2000]);
      expect(replay.indices).to.eql([2, 0, 1]);

      const polygon2 = new Polygon(
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
      const multiPolygon = new MultiPolygon([
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
    let list, rtree;
    beforeEach(function() {
      list = new LinkedList();
      rtree = new RBush();
    });

    describe('#createPoint_', function() {
      it('creates a WebGL polygon vertex', function() {
        const p = replay.createPoint_(1, 1, 1);
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
      let p0, p1;
      beforeEach(function() {
        p0 = replay.createPoint_(1, 1, 1);
        p1 = replay.createPoint_(2, 2, 2);
      });

      it('creates a WebGL polygon segment', function() {
        const seg = replay.insertItem_(p0, p1, list, rtree);
        expect(seg.p0).to.be(p0);
        expect(seg.p1).to.be(p1);
      });

      it('inserts the segment into the provided linked list', function() {
        const seg = replay.insertItem_(p0, p1, list, rtree);
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
      let s0, s1;
      beforeEach(function() {
        const p = replay.createPoint_(2, 2, 2);
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
        const dataExtent = rtree.getExtent();
        replay.removeItem_(s0, s1, list, rtree);
        expect(s0.p1).to.be(s1.p1);
        expect(rtree.getExtent()).to.eql(dataExtent);
      });
    });

    describe('#getPointsInTriangle_', function() {
      let p0, p1, p2, p3;
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
        const points = replay.getPointsInTriangle_({x: -3, y: 6}, {x: 7, y: 6},
          {x: 2, y: 2}, rtree);
        expect(points).to.eql([p1, p2, p3]);
      });

      it('gets only reflex points in a triangle', function() {
        const points = replay.getPointsInTriangle_({x: -3, y: 6}, {x: 7, y: 6},
          {x: 2, y: 2}, rtree, true);
        expect(points).to.eql([p2]);
      });
    });

    describe('#getIntersections_', function() {
      let p0, p1, p2, p3, s0, s1, s2, s3;
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
        const segments = replay.getIntersections_({p0: {x: 0, y: 3}, p1: {x: 4, y: 5}},
          rtree);
        expect(segments).to.eql([s0, s1]);
      });

      it('gets intersecting and touching segments', function() {
        const segments = replay.getIntersections_({p0: {x: 0, y: 3}, p1: {x: 4, y: 5}},
          rtree, true);
        expect(segments).to.eql([s0, s1, s2, s3]);
      });
    });

    describe('#calculateIntersection_', function() {
      const p0 = {x: 0, y: 0};
      const p1 = {x: 4, y: 4};
      const p2 = {x: 0, y: 4};
      const p3 = {x: 4, y: 0};

      it('calculates the intersection point of two intersecting segments', function() {
        const i = replay.calculateIntersection_(p0, p1, p2, p3);
        const t = replay.calculateIntersection_(p0, p1, p1, p2);
        expect(i).to.eql([2, 2]);
        expect(t).to.be(undefined);
      });

      it('calculates the intersection point of two touching segments', function() {
        const t = replay.calculateIntersection_(p0, p1, p1, p2, true);
        expect(t).to.eql([4, 4]);
      });
    });

    describe('#diagonalIsInside_', function() {
      let p0, p1, p2, p3;
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
        const inside = replay.diagonalIsInside_(p1, p2, p3, p0, p1);
        expect(inside).to.be(true);
      });

      it('identifies if diagonal is outside the polygon', function() {
        const inside = replay.diagonalIsInside_(p0, p1, p2, p3, p0);
        expect(inside).to.be(false);
      });
    });

    describe('#classifyPoints_', function() {
      let p0, p1, p2, p3;
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
      let p0, p1, p2, p3;
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
        const simple = replay.isSimple_(list, rtree);
        expect(simple).to.be(true);
      });

      it('identifies self-intersecting polygons', function() {
        const p4 = replay.createPoint_(2, 5, 4);
        const p5 = replay.createPoint_(4, 2, 5);
        replay.insertItem_(p0, p4, list, rtree);
        replay.insertItem_(p4, p5, list, rtree);
        replay.insertItem_(p5, p0, list, rtree);
        const simple = replay.isSimple_(list, rtree);
        expect(simple).to.be(false);
      });
    });
  });

  describe('#setUpProgram', function() {
    let context, gl;
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
      const locations = replay.setUpProgram(gl, context, [2, 2], 1);
      expect(locations).to.be.a(Locations);
    });

    it('gets and compiles the shaders', function() {
      sinon.spy(context, 'getProgram');
      sinon.spy(context, 'useProgram');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(context.getProgram.calledWithExactly(fragment, vertex)).to.be(true);
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
    let context, gl;
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

      const locations = replay.setUpProgram(gl, context, [2, 2], 1);
      replay.shutDownProgram(gl, locations);
      expect(gl.disableVertexAttribArray.callCount).to.be(
        gl.getAttribLocation.callCount);
    });
  });

  describe('#drawReplay', function() {
    let gl, context;
    const feature1 = new Feature({
      geometry: new Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
    });
    const feature2 = new Feature({
      geometry: new Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
    });
    const feature3 = new Feature({
      geometry: new Polygon([[[0, 0], [500, 500], [500, 0], [0, 0]]])
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
      const fillStyle2 = new Fill({
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
      const skippedFeatHash = {};
      skippedFeatHash[getUid(feature2).toString()] = true;

      replay.drawReplay(gl, context, skippedFeatHash, false);
      expect(replay.setFillStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledTwice).to.be(true);
    });
  });
});
