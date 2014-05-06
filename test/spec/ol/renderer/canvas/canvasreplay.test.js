goog.provide('ol.test.renderer.canvas.Replay');

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

    it('buffers the max extent to accomodate stroke width', function() {
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

    it('buffers the max extent to accomodate stroke width', function() {
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

goog.require('ol.render.canvas.Replay');
goog.require('ol.style.Stroke');
