

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.render.webgl.LineStringReplay');
goog.require('ol.render.webgl.linestringreplay.defaultshader');
goog.require('ol.render.webgl.linestringreplay.defaultshader.Locations');
goog.require('ol.style.Stroke');

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
          ol.render.webgl.linestringreplay.defaultshader.Locations);
    });

    it('gets and compiles the shaders', function() {
      sinon.spy(context, 'getProgram');
      sinon.spy(context, 'useProgram');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(context.getProgram.calledWithExactly(
          ol.render.webgl.linestringreplay.defaultshader.fragment,
          ol.render.webgl.linestringreplay.defaultshader.vertex)).to.be(true);
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
      geometry: new ol.geom.LineString([[0, 0], [500, 500]])
    });
    var feature2 = new ol.Feature({
      geometry: new ol.geom.LineString([[0, 0], [500, 500]])
    });
    var feature3 = new ol.Feature({
      geometry: new ol.geom.LineString([[0, 0], [500, 500]])
    });
    beforeEach(function() {
      gl = {
        enable: function() {},
        disable: function() {},
        depthMask: function() {},
        depthFunc: function() {},
        clear: function() {},
        getParameter: function() {}
      };
      context = {};
      replay.setStrokeStyle_ = function() {};
      replay.drawElements = function() {};
      sinon.spy(replay, 'setStrokeStyle_');
      sinon.spy(replay, 'drawElements');
      sinon.spy(gl, 'clear');
    });

    it('draws the elements in a single call if they have the same style', function() {
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setStrokeStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledOnce).to.be(true);
      expect(gl.clear.called).to.be(true);
    });

    it('draws the elements in batches if there are multiple styles', function() {
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(null, strokeStyle2);
      replay.drawLineString(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);

      replay.drawReplay(gl, context, {}, false);
      expect(replay.setStrokeStyle_.calledThrice).to.be(true);
      expect(replay.drawElements.calledThrice).to.be(true);
      expect(gl.clear.called).to.be(true);
    });

    it('can skip elements if needed', function() {
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature1.getGeometry(), feature1);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature2.getGeometry(), feature2);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(feature3.getGeometry(), feature3);
      replay.startIndices.push(replay.indices.length);
      var skippedFeatHash = {};
      skippedFeatHash[ol.getUid(feature2).toString()] = true;

      replay.drawReplay(gl, context, skippedFeatHash, false);
      expect(replay.setStrokeStyle_.calledOnce).to.be(true);
      expect(replay.drawElements.calledTwice).to.be(true);
      expect(gl.clear.called).to.be(true);
    });
  });
});
