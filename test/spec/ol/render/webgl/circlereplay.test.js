goog.provide('ol.test.render.webgl.CircleReplay');

goog.require('ol.geom.Circle');
goog.require('ol.render.webgl.CircleReplay');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');

describe('ol.render.webgl.CircleReplay', function() {
  var replay;

  var strokeStyle = new ol.style.Stroke({
    color: [0, 255, 0, 0.4]
  });

  var fillStyle = new ol.style.Fill({
    color: [255, 0, 0, 1]
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.CircleReplay(tolerance, maxExtent);
  });

  describe('#setFillStrokeStyle', function() {
    it('set expected states', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      expect(replay.state_).not.be(null);
      expect(replay.state_.strokeColor).to.eql([0, 1, 0, 0.4]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.fillColor).to.eql([1, 0, 0, 1]);
      expect(replay.state_.changed).to.be(true);
      expect(replay.styles_).to.have.length(1);
    });

    it('sets a transparent stroke, if none provided', function() {
      replay.setFillStrokeStyle(fillStyle, null);
      expect(replay.state_.strokeColor).to.eql([0, 0, 0, 0]);
    });

    it('sets a transparent fill, if none provided', function() {
      replay.setFillStrokeStyle(null, strokeStyle);
      expect(replay.state_.fillColor).to.eql([0, 0, 0, 0]);
    });
  });

  describe('#drawCircle', function() {
    it('sets the buffer data', function() {
      var circle = new ol.geom.Circle([0,0], 5000);

      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(circle, null);
      expect(replay.vertices).to.have.length(12);
      expect(replay.indices).to.have.length(3);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);
      expect(replay.radius_).to.be(5000);
    });

    it('does not draw if radius is zero', function() {
      var circle = new ol.geom.Circle([0,0], 0);

      replay.drawCircle(circle, null);
      expect(replay.vertices).to.have.length(0);
      expect(replay.indices).to.have.length(0);
      expect(replay.startIndices).to.have.length(0);
      expect(replay.startIndicesFeature).to.have.length(0);
    });

    it('resets state and removes style if it belongs to a zero radius circle', function() {
      var circle = new ol.geom.Circle([0,0], 0);

      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.setFillStrokeStyle(null, strokeStyle);
      replay.drawCircle(circle, null);
      expect(replay.styles_).to.have.length(1);
      expect(replay.state_).not.be(null);
      expect(replay.state_.strokeColor).to.eql([0, 1, 0, 0.4]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.fillColor).to.eql([1, 0, 0, 1]);
      expect(replay.state_.changed).to.be(false);
    });
  });

  describe('#drawCoordinates_', function() {
    it('envelopes the circle into a right isosceles triangle', function() {
      replay.radius_ = 5000;
      replay.drawCoordinates_([0, 0], 0, 2, 2);

      expect(replay.vertices).to.eql([0, 0, 0, 5000, 0, 0, 1, 5000, 0, 0, 2, 5000]);
      expect(replay.indices).to.eql([0, 1, 2]);
    });
  });
});
