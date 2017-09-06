

import _ol_ from '../../../../../src/ol';
import _ol_Feature_ from '../../../../../src/ol/feature';
import _ol_geom_Circle_ from '../../../../../src/ol/geom/circle';
import _ol_render_webgl_CircleReplay_ from '../../../../../src/ol/render/webgl/circlereplay';
import _ol_render_webgl_circlereplay_defaultshader_ from '../../../../../src/ol/render/webgl/circlereplay/defaultshader';
import _ol_render_webgl_circlereplay_defaultshader_Locations_ from '../../../../../src/ol/render/webgl/circlereplay/defaultshader/locations';
import _ol_style_Fill_ from '../../../../../src/ol/style/fill';
import _ol_style_Stroke_ from '../../../../../src/ol/style/stroke';

describe('ol.render.webgl.CircleReplay', function() {
  var replay;

  var strokeStyle = new _ol_style_Stroke_({
    color: [0, 255, 0, 0.4]
  });

  var fillStyle = new _ol_style_Fill_({
    color: [255, 0, 0, 1]
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new _ol_render_webgl_CircleReplay_(tolerance, maxExtent);
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
      var circle = new _ol_geom_Circle_([0, 0], 5000);

      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(circle, null);
      expect(replay.vertices).to.have.length(16);
      expect(replay.indices).to.have.length(6);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);
      expect(replay.radius_).to.be(5000);
    });

    it('does not draw if radius is zero', function() {
      var circle = new _ol_geom_Circle_([0, 0], 0);

      replay.drawCircle(circle, null);
      expect(replay.vertices).to.have.length(0);
      expect(replay.indices).to.have.length(0);
      expect(replay.startIndices).to.have.length(0);
      expect(replay.startIndicesFeature).to.have.length(0);
    });

    it('resets state and removes style if it belongs to a zero radius circle', function() {
      var circle = new _ol_geom_Circle_([0, 0], 0);

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

      expect(replay.vertices).to.eql([0, 0, 0, 5000, 0, 0, 1, 5000,
        0, 0, 2, 5000, 0, 0, 3, 5000]);
      expect(replay.indices).to.eql([0, 1, 2, 2, 3, 0]);
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
          _ol_render_webgl_circlereplay_defaultshader_Locations_);
    });

    it('gets and compiles the shaders', function() {
      sinon.spy(context, 'getProgram');
      sinon.spy(context, 'useProgram');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(context.getProgram.calledWithExactly(
          _ol_render_webgl_circlereplay_defaultshader_.fragment,
          _ol_render_webgl_circlereplay_defaultshader_.vertex)).to.be(true);
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
    var feature1 = new _ol_Feature_({
      geometry: new _ol_geom_Circle_([0, 0], 5000)
    });
    var feature2 = new _ol_Feature_({
      geometry: new _ol_geom_Circle_([10, 10], 5000)
    });
    var feature3 = new _ol_Feature_({
      geometry: new _ol_geom_Circle_([20, 20], 5000)
    });
    beforeEach(function() {
      gl = {};
      context = {};
      replay.setFillStyle_ = function() {};
      replay.setStrokeStyle_ = function() {};
      replay.drawElements = function() {};
      sinon.spy(replay, 'setFillStyle_');
      sinon.spy(replay, 'setStrokeStyle_');
      sinon.spy(replay, 'drawElements');
    });

    it('draws the elements in a single call if they have the same style', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setFillStyle_.calledOnce).to.be(true);
      expect(replay.setStrokeStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledOnce).to.be(true);
    });

    it('draws the elements in batches if there are multiple styles', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle, null);
      replay.drawCircle(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(strokeStyle, null);
      replay.drawCircle(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setFillStyle_.calledThrice).to.be(true);
      expect(replay.setStrokeStyle_.calledThrice).to.be(true);
      expect(replay.drawElements.calledThrice).to.be(true);
    });

    it('can skip elements if needed', function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
      replay.drawCircle(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);
      var skippedFeatHash = {};
      skippedFeatHash[_ol_.getUid(feature2).toString()] = true;

      replay.drawReplay(gl, context, skippedFeatHash, false);
      expect(replay.setFillStyle_.calledOnce).to.be(true);
      expect(replay.setStrokeStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledTwice).to.be(true);
    });
  });
});
