goog.provide('ol.test.renderer.canvas.Replay');

describe('ol.render.canvas.ReplayGroup', function() {

  describe('#replay', function() {

    var context, replay, fillCount, strokeCount, beginPathCount;
    var feature1, feature2, feature3, style1, style2, style3, transform;

    beforeEach(function() {
      transform = goog.vec.Mat4.createNumber();
      replay = new ol.render.canvas.ReplayGroup(1, [-180, -90, 180, 90], 1);
      feature1 = new ol.Feature(new ol.geom.Polygon(
          [[[-90, -45], [-90, 0], [0, 0], [0, -45], [-90, -45]]]));
      feature2 = new ol.Feature(new ol.geom.Polygon(
          [[[90, 45], [90, 0], [0, 0], [0, 45], [90, 45]]]));
      feature3 = new ol.Feature(new ol.geom.Polygon(
          [[[-90, -45], [-90, 45], [90, 45], [90, -45], [-90, -45]]]));
      style1 = new ol.style.Style({
        fill: new ol.style.Fill({color: 'black'}),
        stroke: new ol.style.Stroke({color: 'white', width: 1})
      });
      style2 = new ol.style.Style({
        fill: new ol.style.Fill({color: 'white'}),
        stroke: new ol.style.Stroke({color: 'black', width: 1})
      });
      style3 = new ol.style.Style({
        fill: new ol.style.Fill({color: 'rgba(255,255,255,0.8)'}),
        stroke: new ol.style.Stroke({color: 'rgba(0,0,0,0.8)', width: 1})
      });
      fillCount = 0;
      strokeCount = 0;
      beginPathCount = 0;
      context = {
        fill: function() {
          fillCount++;
        },
        stroke: function() {
          strokeCount++;
        },
        beginPath: function() {
          beginPathCount++;
        },
        clip: function() {
          beginPathCount--;
        },
        save: function() {},
        moveTo: function() {},
        lineTo: function() {},
        closePath: function() {},
        setLineDash: function() {},
        restore: function() {}
      }

    })

    it('batches fill and stroke instructions for same style', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style1, 1);
      replay.replay(context, 1, transform, 0, {});
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for different styles', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style2, 1);
      replay.replay(context, 1, transform, 0, {});
      expect(fillCount).to.be(2);
      expect(strokeCount).to.be(2);
      expect(beginPathCount).to.be(2);
    });

    it('batches fill and stroke instructions for changing styles', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style2, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style1, 1);
      replay.replay(context, 1, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    });

    it('batches fill and stroke instructions for skipped feature at the beginning', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style2, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[goog.getUid(feature1)] = true;
      replay.replay(context, 1, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped feature at the end', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[goog.getUid(feature3)] = true;
      replay.replay(context, 1, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped features', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style1, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[goog.getUid(feature1)] = true;
      skippedUids[goog.getUid(feature2)] = true;
      replay.replay(context, 1, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('does not batch when transparent fills/strokes are used', function() {
      ol.renderer.vector.renderFeature(replay, feature1, style3, 1);
      ol.renderer.vector.renderFeature(replay, feature2, style3, 1);
      ol.renderer.vector.renderFeature(replay, feature3, style3, 1);
      replay.replay(context, 1, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    })
  });

});

describe('ol.render.canvas.Replay', function() {

  describe('constructor', function() {

    it('creates a new replay batch', function() {
      var tolerance = 10;
      var extent = [-180, -90, 180, 90];
      var replay = new ol.render.canvas.Replay(tolerance, extent, 1);
      expect(replay).to.be.a(ol.render.canvas.Replay);
    });

  });

  describe('#appendFlatCoordinates()', function() {

    var replay;
    beforeEach(function() {
      replay = new ol.render.canvas.Replay(1, [-180, -90, 180, 90], 1);
    });

    it('appends coordinates that are within the max extent', function() {
      var flat = [-110, 45, 110, 45, 110, -45, -110, -45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('works with a single coordinate (inside)', function() {
      var flat = [-110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends first point (even if outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      var flat = [-110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends points when segments cross (top to bottom)', function() {
      // this means we get a few extra points when coordinates are not
      // part of a linestring or ring, but only a few extra
      var flat = [0, 200, 0, -200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends points when segments cross (top to inside)', function() {
      var flat = [0, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends the first segment (even when outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      var flat = [-10, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('eliminates segments outside (and not changing rel)', function() {
      var flat = [0, 0, 0, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200]);
    });

    it('includes outside segments that change relationship', function() {
      var flat = [0, 0, 0, 200, 200, 200, 250, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200, 200, 200]);
    });

  });

});

describe('ol.render.canvas.LineStringReplay', function() {

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      var tolerance = 1;
      var extent = [-180, -90, 180, 90];
      var resolution = 10;
      var replay = new ol.render.canvas.LineStringReplay(tolerance, extent,
          resolution);
      var stroke = new ol.style.Stroke({
        width: 2
      });
      replay.setFillStrokeStyle(null, stroke);
      var buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-195, -105, 195, 105]);
    });

  });

});

describe('ol.render.canvas.PolygonReplay', function() {

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      var tolerance = 1;
      var extent = [-180, -90, 180, 90];
      var resolution = 10;
      var replay = new ol.render.canvas.PolygonReplay(tolerance, extent,
          resolution);
      var stroke = new ol.style.Stroke({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      var buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-210, -120, 210, 120]);
    });

  });

});

goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.render.canvas.LineStringReplay');
goog.require('ol.render.canvas.PolygonReplay');
goog.require('ol.render.canvas.Replay');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
