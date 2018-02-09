import WebGLTextureReplay from '../../../../../src/ol/render/webgl/TextureReplay.js';
import {fragment, vertex} from '../../../../../src/ol/render/webgl/texturereplay/defaultshader.js';
import Locations from '../../../../../src/ol/render/webgl/texturereplay/defaultshader/Locations.js';

describe('ol.render.webgl.TextureReplay', function() {
  let replay;

  beforeEach(function() {
    const tolerance = 0.1;
    const maxExtent = [-10000, -20000, 10000, 20000];
    replay = new WebGLTextureReplay(tolerance, maxExtent);
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
});
