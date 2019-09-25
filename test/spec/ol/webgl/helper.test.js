import WebGLHelper from '../../../../src/ol/webgl/Helper.js';
import {
  create as createTransform,
  rotate as rotateTransform,
  scale as scaleTransform, translate as translateTransform
} from '../../../../src/ol/transform.js';


const VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  attribute float a_test;
  uniform float u_test;
  
  void main(void) {
    gl_Position = vec4(u_test, a_test, 0.0, 1.0);
  }`;

const INVALID_VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
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

describe('ol.webgl.WebGLHelper', () => {

  describe('constructor', () => {

    describe('without an argument', () => {

      let h;
      beforeEach(() => {
        h = new WebGLHelper();
      });

      test('initialized WebGL context & canvas', () => {
        expect(h.getGL() instanceof WebGLRenderingContext).toEqual(true);
        expect(h.getCanvas() instanceof HTMLCanvasElement).toEqual(true);
      });

      test('has a default rendering pass', () => {
        expect(h.postProcessPasses_.length).toEqual(1);
      });
    });

    describe('with post process passes', () => {

      let h;
      beforeEach(() => {
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

      test('has instantiated post-processing passes', () => {
        expect(h.postProcessPasses_.length).toEqual(2);
        expect(h.postProcessPasses_[0].scaleRatio_).toEqual(0.5);
        expect(h.postProcessPasses_[0].uniforms_.length).toEqual(0);
        expect(h.postProcessPasses_[1].scaleRatio_).toEqual(1);
        expect(h.postProcessPasses_[1].uniforms_.length).toEqual(1);
        expect(h.postProcessPasses_[1].uniforms_[0].value).toEqual(4);
      });

    });

  });

  describe('operations', () => {

    describe('prepare draw', () => {

      let h;
      beforeEach(() => {
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

      test('has resized the canvas', () => {
        expect(h.getCanvas().width).toEqual(100);
        expect(h.getCanvas().height).toEqual(160);
      });

      test('has processed uniforms', () => {
        expect(h.uniforms_.length).toEqual(4);
        expect(h.uniforms_[0].name).toEqual('u_test1');
        expect(h.uniforms_[1].name).toEqual('u_test2');
        expect(h.uniforms_[2].name).toEqual('u_test3');
        expect(h.uniforms_[3].name).toEqual('u_test4');
        expect(h.uniforms_[0].location).not.toEqual(-1);
        expect(h.uniforms_[1].location).not.toEqual(-1);
        expect(h.uniforms_[2].location).not.toEqual(-1);
        expect(h.uniforms_[3].location).not.toEqual(-1);
        expect(h.uniforms_[2].texture).not.toEqual(undefined);
      });
    });

    describe('valid shader compiling', () => {
      let h;
      let p;
      beforeEach(() => {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        h.useProgram(p);
      });

      test('has saved the program', () => {
        expect(h.currentProgram_).toEqual(p);
      });

      test('has no shader compilation error', () => {
        expect(h.shaderCompileErrors_).toEqual(null);
      });

      test('can find the uniform location', () => {
        expect(h.getUniformLocation('u_test')).not.toEqual(null);
      });

      test('can find the attribute location', () => {
        expect(h.getAttributeLocation('a_test')).not.toEqual(-1);
      });

      test('cannot find an unknown attribute location', () => {
        expect(h.getAttributeLocation('a_test_missing')).toEqual(-1);
      });
    });

    describe('invalid shader compiling', () => {
      let h;
      let p;
      beforeEach(() => {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, INVALID_VERTEX_SHADER);
        h.useProgram(p);
      });

      test('has saved the program', () => {
        expect(h.currentProgram_).toEqual(p);
      });

      test('has shader compilation errors', () => {
        expect(h.shaderCompileErrors_).not.toEqual(null);
      });

      test('cannot find the uniform location', () => {
        expect(h.getUniformLocation('u_test')).toEqual(null);
      });
    });

    describe('#makeProjectionTransform', () => {
      let h;
      let frameState;
      beforeEach(() => {
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

      test('gives out the correct transform', () => {
        const scaleX = 2 / frameState.size[0] / frameState.viewState.resolution;
        const scaleY = 2 / frameState.size[1] / frameState.viewState.resolution;
        const given = createTransform();
        const expected = createTransform();
        scaleTransform(expected, scaleX, scaleY);
        rotateTransform(expected, -frameState.viewState.rotation);
        translateTransform(expected, -frameState.viewState.center[0], -frameState.viewState.center[1]);

        h.makeProjectionTransform(frameState, given);

        expect(given.map(val => val.toFixed(15))).toEqual(expected.map(val => val.toFixed(15)));
      });
    });

    describe('#createTexture', () => {
      let h;
      beforeEach(() => {
        h = new WebGLHelper();
      });

      test('creates an empty texture from scratch', () => {
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

        expect(data[0]).toEqual(0);
        expect(data[1]).toEqual(0);
        expect(data[2]).toEqual(0);
        expect(data[3]).toEqual(0);
        expect(data[4]).toEqual(0);
        expect(data[5]).toEqual(0);
        expect(data[6]).toEqual(0);
        expect(data[7]).toEqual(0);
      });

      test('creates a texture from image data', () => {
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

        expect(data[0]).toEqual(100);
        expect(data[1]).toEqual(150);
        expect(data[2]).toEqual(200);
        expect(data[3]).toEqual(250);
        expect(data[4]).toEqual(100);
        expect(data[5]).toEqual(150);
        expect(data[6]).toEqual(200);
        expect(data[7]).toEqual(250);
      });

      test('reuses a given texture', () => {
        const width = 4;
        const height = 4;
        const gl = h.getGL();
        const t1 = gl.createTexture();
        const t2 = h.createTexture([width, height], undefined, t1);
        expect(t1).toBe(t2);
      });
    });
  });
});
