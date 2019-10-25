import WebGLHelper, {DefaultUniform} from '../../../../src/ol/webgl/Helper.js';
import {
  create as createTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform
} from '../../../../src/ol/transform.js';
import {FLOAT} from '../../../../src/ol/webgl.js';


const VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  uniform float u_time;
  uniform float u_zoom;
  uniform float u_resolution;
  
  attribute float a_test;
  uniform float u_test;
  
  void main(void) {
    gl_Position = vec4(u_test, a_test, 0.0, 1.0);
  }`;

const INVALID_VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  uniform float u_time;
  uniform float u_zoom;
  uniform float u_resolution;
  
  bla
  uniform float u_test;
  
  void main(void) {
    gl_Position = vec4(u_test, a_test, 0.0, 1.0);
  }`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }`;

describe('ol.webgl.WebGLHelper', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper();
      });

      it('initialized WebGL context & canvas', function() {
        expect(h.getGL() instanceof WebGLRenderingContext).to.eql(true);
        expect(h.getCanvas() instanceof HTMLCanvasElement).to.eql(true);
      });

      it('has a default rendering pass', function() {
        expect(h.postProcessPasses_.length).to.eql(1);
      });
    });

    describe('with post process passes', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper({
          postProcesses: [{
            scaleRatio: 0.5
          }, {
            uniforms: {
              u_test: 4
            }
          }]
        });
      });

      it('has instantiated post-processing passes', function() {
        expect(h.postProcessPasses_.length).to.eql(2);
        expect(h.postProcessPasses_[0].scaleRatio_).to.eql(0.5);
        expect(h.postProcessPasses_[0].uniforms_.length).to.eql(0);
        expect(h.postProcessPasses_[1].scaleRatio_).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_.length).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_[0].value).to.eql(4);
      });

    });

  });

  describe('operations', function() {

    describe('prepare draw', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper({
          uniforms: {
            u_test1: 42,
            u_test2: [1, 3],
            u_test3: document.createElement('canvas'),
            u_test4: createTransform()
          }
        });
        h.useProgram(h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER));
        h.prepareDraw({
          pixelRatio: 2,
          size: [50, 80],
          viewState: {
            rotation: 10,
            resolution: 10,
            center: [0, 0]
          }
        });
      });

      it('has resized the canvas', function() {
        expect(h.getCanvas().width).to.eql(100);
        expect(h.getCanvas().height).to.eql(160);
      });

      it('has processed default uniforms', function() {
        expect(h.uniformLocations_[DefaultUniform.OFFSET_ROTATION_MATRIX]).not.to.eql(undefined);
        expect(h.uniformLocations_[DefaultUniform.OFFSET_SCALE_MATRIX]).not.to.eql(undefined);
        expect(h.uniformLocations_[DefaultUniform.TIME]).not.to.eql(undefined);
      });

      it('has processed uniforms', function() {
        expect(h.uniforms_.length).to.eql(4);
        expect(h.uniforms_[0].name).to.eql('u_test1');
        expect(h.uniforms_[1].name).to.eql('u_test2');
        expect(h.uniforms_[2].name).to.eql('u_test3');
        expect(h.uniforms_[3].name).to.eql('u_test4');
        expect(h.uniforms_[0].location).to.not.eql(-1);
        expect(h.uniforms_[1].location).to.not.eql(-1);
        expect(h.uniforms_[2].location).to.not.eql(-1);
        expect(h.uniforms_[3].location).to.not.eql(-1);
        expect(h.uniforms_[2].texture).to.not.eql(undefined);
      });
    });

    describe('valid shader compiling', function() {
      let h;
      let p;
      beforeEach(function() {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        h.useProgram(p);
      });

      it('has saved the program', function() {
        expect(h.currentProgram_).to.eql(p);
      });

      it('has no shader compilation error', function() {
        expect(h.shaderCompileErrors_).to.eql(null);
      });

      it('can find the uniform location', function() {
        expect(h.getUniformLocation('u_test')).to.not.eql(null);
      });

      it('can find the attribute location', function() {
        expect(h.getAttributeLocation('a_test')).to.not.eql(-1);
      });

      it('cannot find an unknown attribute location', function() {
        expect(h.getAttributeLocation('a_test_missing')).to.eql(-1);
      });
    });

    describe('invalid shader compiling', function() {
      let h;
      let p;
      beforeEach(function() {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, INVALID_VERTEX_SHADER);
        h.useProgram(p);
      });

      it('has saved the program', function() {
        expect(h.currentProgram_).to.eql(p);
      });

      it('has shader compilation errors', function() {
        expect(h.shaderCompileErrors_).to.not.eql(null);
      });

      it('cannot find the uniform location', function() {
        expect(h.getUniformLocation('u_test')).to.eql(null);
      });
    });

    describe('#makeProjectionTransform', function() {
      let h;
      let frameState;
      beforeEach(function() {
        h = new WebGLHelper();

        frameState = {
          size: [100, 150],
          viewState: {
            rotation: 0.4,
            resolution: 2,
            center: [10, 20]
          }
        };
      });

      it('gives out the correct transform', function() {
        const scaleX = 2 / frameState.size[0] / frameState.viewState.resolution;
        const scaleY = 2 / frameState.size[1] / frameState.viewState.resolution;
        const given = createTransform();
        const expected = createTransform();
        scaleTransform(expected, scaleX, scaleY);
        rotateTransform(expected, -frameState.viewState.rotation);
        translateTransform(expected, -frameState.viewState.center[0], -frameState.viewState.center[1]);

        h.makeProjectionTransform(frameState, given);

        expect(given.map(val => val.toFixed(15))).to.eql(expected.map(val => val.toFixed(15)));
      });
    });

    describe('#createTexture', function() {
      let h;
      beforeEach(function() {
        h = new WebGLHelper();
      });

      it('creates an empty texture from scratch', function() {
        const width = 4;
        const height = 4;
        const t = h.createTexture([width, height]);
        const gl = h.getGL();

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        const data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.deleteFramebuffer(fb);

        expect(data[0]).to.eql(0);
        expect(data[1]).to.eql(0);
        expect(data[2]).to.eql(0);
        expect(data[3]).to.eql(0);
        expect(data[4]).to.eql(0);
        expect(data[5]).to.eql(0);
        expect(data[6]).to.eql(0);
        expect(data[7]).to.eql(0);
      });

      it('creates a texture from image data', function() {
        const width = 4;
        const height = 4;
        const canvas = document.createElement('canvas');
        const image = canvas.getContext('2d').createImageData(width, height);
        for (let i = 0; i < image.data.length; i += 4) {
          image.data[i] = 100;
          image.data[i + 1] = 150;
          image.data[i + 2] = 200;
          image.data[i + 3] = 250;
        }
        const t = h.createTexture([width, height], image);
        const gl = h.getGL();

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        const data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.deleteFramebuffer(fb);

        expect(data[0]).to.eql(100);
        expect(data[1]).to.eql(150);
        expect(data[2]).to.eql(200);
        expect(data[3]).to.eql(250);
        expect(data[4]).to.eql(100);
        expect(data[5]).to.eql(150);
        expect(data[6]).to.eql(200);
        expect(data[7]).to.eql(250);
      });

      it('reuses a given texture', function() {
        const width = 4;
        const height = 4;
        const gl = h.getGL();
        const t1 = gl.createTexture();
        const t2 = h.createTexture([width, height], undefined, t1);
        expect(t1).to.be(t2);
      });
    });
  });

  describe('#enableAttributes', function() {
    let baseAttrs, h;

    beforeEach(function() {
      h = new WebGLHelper();
      baseAttrs = [
        {
          name: 'attr1',
          size: 3
        },
        {
          name: 'attr2',
          size: 2
        },
        {
          name: 'attr3',
          size: 1
        }
      ];
      h.useProgram(h.getProgram(FRAGMENT_SHADER, `
        precision mediump float;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_offsetScaleMatrix;
        uniform mat4 u_offsetRotateMatrix;

        attribute vec3 attr1;
        attribute vec2 attr2;
        attribute float attr3;
        uniform float u_test;

        void main(void) {
          gl_Position = vec4(u_test, a_test, 0.0, 1.0);
        }`));
    });

    it('enables attributes based on the given array (FLOAT)', function() {
      const spy = sinon.spy(h, 'enableAttributeArray_');
      h.enableAttributes(baseAttrs);
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;

      expect(spy.callCount).to.eql(3);
      expect(spy.getCall(0).args[0]).to.eql('attr1');
      expect(spy.getCall(0).args[1]).to.eql(3);
      expect(spy.getCall(0).args[2]).to.eql(FLOAT);
      expect(spy.getCall(0).args[3]).to.eql(6 * bytesPerFloat);
      expect(spy.getCall(0).args[4]).to.eql(0);
      expect(spy.getCall(1).args[0]).to.eql('attr2');
      expect(spy.getCall(1).args[1]).to.eql(2);
      expect(spy.getCall(1).args[2]).to.eql(FLOAT);
      expect(spy.getCall(1).args[3]).to.eql(6 * bytesPerFloat);
      expect(spy.getCall(1).args[4]).to.eql(3 * bytesPerFloat);
      expect(spy.getCall(2).args[0]).to.eql('attr3');
      expect(spy.getCall(2).args[1]).to.eql(1);
      expect(spy.getCall(2).args[2]).to.eql(FLOAT);
      expect(spy.getCall(2).args[3]).to.eql(6 * bytesPerFloat);
      expect(spy.getCall(2).args[4]).to.eql(5 * bytesPerFloat);
    });
  });
});
