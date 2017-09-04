

goog.require('ol.render.webgl.TextureReplay');
goog.require('ol.render.webgl.texturereplay.defaultshader');
goog.require('ol.render.webgl.texturereplay.defaultshader.Locations');

describe('ol.render.webgl.TextureReplay', function() {
  var replay;

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.TextureReplay(tolerance, maxExtent);
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
          ol.render.webgl.texturereplay.defaultshader.Locations);
    });

    it('gets and compiles the shaders', function() {
      sinon.spy(context, 'getProgram');
      sinon.spy(context, 'useProgram');

      replay.setUpProgram(gl, context, [2, 2], 1);
      expect(context.getProgram.calledWithExactly(
          ol.render.webgl.texturereplay.defaultshader.fragment,
          ol.render.webgl.texturereplay.defaultshader.vertex)).to.be(true);
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
});
