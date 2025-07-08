import {spy as sinonSpy, stub as sinonStub} from 'sinon';
import {
  create as createTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../../../../src/ol/transform.js';
import {getUid} from '../../../../../src/ol/util.js';
import WebGLArrayBuffer from '../../../../../src/ol/webgl/Buffer.js';
import WebGLHelper, {
  DefaultUniform,
} from '../../../../../src/ol/webgl/Helper.js';
import {ARRAY_BUFFER, FLOAT, STATIC_DRAW} from '../../../../../src/ol/webgl.js';

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

const INVALID_FRAGMENT_SHADER = `
  precision mediump float;

  void main(void) {
    gl_FragColor = vec4(oops, 1.0, 1.0, 1.0);
  }`;

const SAMPLE_FRAMESTATE = {
  size: [100, 150],
  viewState: {
    rotation: 0.4,
    resolution: 2,
    center: [10, 20],
    zoom: 3,
  },
};

describe('ol/webgl/WebGLHelper', function () {
  let h;
  afterEach(function () {
    h.dispose();
  });

  describe('constructor', function () {
    describe('without an argument', function () {
      beforeEach(function () {
        h = new WebGLHelper();
      });

      it('initialized WebGL context & canvas', function () {
        expect(h.getGL() instanceof WebGLRenderingContext).to.eql(true);
        expect(h.getCanvas() instanceof HTMLCanvasElement).to.eql(true);
      });

      it('has a default rendering pass', function () {
        expect(h.postProcessPasses_.length).to.eql(1);
      });
    });

    describe('with post process passes', function () {
      beforeEach(function () {
        h = new WebGLHelper({
          postProcesses: [
            {
              scaleRatio: 0.5,
            },
            {
              uniforms: {
                u_test: 4,
              },
            },
          ],
        });
      });

      it('has instantiated post-processing passes', function () {
        expect(h.postProcessPasses_.length).to.eql(2);
        expect(h.postProcessPasses_[0].scaleRatio_).to.eql(0.5);
        expect(h.postProcessPasses_[0].uniforms_.length).to.eql(0);
        expect(h.postProcessPasses_[1].scaleRatio_).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_.length).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_[0].value).to.eql(4);
      });
    });
  });

  describe('operations', function () {
    describe('prepare draw', function () {
      let program, uniformTexture;
      beforeEach(function () {
        uniformTexture = null;
        h = new WebGLHelper({
          uniforms: {
            u_test1: 42,
            u_test2: [1, 3],
            u_test3: document.createElement('canvas'),
            u_test4: createTransform(),
            u_test5: () => uniformTexture,
          },
        });
        uniformTexture = h.getGL().createTexture();
        program = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        h.useProgram(program, SAMPLE_FRAMESTATE);
        h.prepareDraw({
          pixelRatio: 2,
          size: [50, 80],
          viewState: {
            rotation: 10,
            resolution: 10,
            center: [0, 0],
          },
        });
      });

      it('has resized the canvas', function () {
        expect(h.getCanvas().width).to.eql(100);
        expect(h.getCanvas().height).to.eql(160);
      });

      it('has processed default uniforms', function () {
        const uniformLocations = h.uniformLocationsByProgram_[getUid(program)];
        expect(uniformLocations[DefaultUniform.TIME]).not.to.eql(undefined);
        expect(uniformLocations[DefaultUniform.ZOOM]).not.to.eql(undefined);
        expect(uniformLocations[DefaultUniform.RESOLUTION]).not.to.eql(
          undefined,
        );
        expect(uniformLocations[DefaultUniform.VIEWPORT_SIZE_PX]).not.to.eql(
          undefined,
        );
        expect(uniformLocations[DefaultUniform.PIXEL_RATIO]).not.to.eql(
          undefined,
        );
        expect(uniformLocations[DefaultUniform.ROTATION]).not.to.eql(undefined);
      });

      it('has processed uniforms', function () {
        expect(h.uniforms_.length).to.eql(5);
        expect(h.uniforms_[0].name).to.eql('u_test1');
        expect(h.uniforms_[1].name).to.eql('u_test2');
        expect(h.uniforms_[2].name).to.eql('u_test3');
        expect(h.uniforms_[3].name).to.eql('u_test4');
        expect(h.uniforms_[4].name).to.eql('u_test5');
        expect(h.uniforms_[0].location).to.not.eql(-1);
        expect(h.uniforms_[1].location).to.not.eql(-1);
        expect(h.uniforms_[2].location).to.not.eql(-1);
        expect(h.uniforms_[3].location).to.not.eql(-1);
        expect(h.uniforms_[4].location).to.not.eql(-1);
        expect(h.uniforms_[2].texture).to.not.eql(undefined);
        expect(h.uniforms_[4].texture).to.eql(uniformTexture);
      });

      describe('avoid resizing the canvas if not required', () => {
        let widthSpy, heightSpy;
        beforeEach(function () {
          widthSpy = sinonSpy(h.getCanvas(), 'width', ['set']);
          heightSpy = sinonSpy(h.getCanvas(), 'height', ['set']);
          // same size and pixel ratio
          h.prepareDraw({
            pixelRatio: 2,
            size: [50, 80],
            viewState: {
              rotation: 10,
              resolution: 10,
              center: [0, 0],
            },
          });
        });

        it('does not resize the canvas', function () {
          expect(widthSpy.set.callCount).to.be(0);
          expect(heightSpy.set.callCount).to.be(0);
        });
      });
    });

    describe('valid shader compiling', function () {
      let p;
      beforeEach(function () {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        h.useProgram(p, SAMPLE_FRAMESTATE);
      });

      it('has saved the program', function () {
        expect(h.currentProgram_).to.eql(p);
      });

      it('has no shader compilation error', function () {
        expect(h.shaderCompileErrors_).to.eql(null);
      });

      it('can find the uniform location', function () {
        expect(h.getUniformLocation('u_test')).to.not.eql(null);
      });

      it('can find the attribute location', function () {
        expect(h.getAttributeLocation('a_test')).to.not.eql(-1);
      });

      it('cannot find an unknown attribute location', function () {
        expect(h.getAttributeLocation('a_test_missing')).to.eql(-1);
      });
    });

    describe('invalid shader compiling', function () {
      it('throws for an invalid vertex shader', function () {
        h = new WebGLHelper();
        expect(() =>
          h.getProgram(FRAGMENT_SHADER, INVALID_VERTEX_SHADER),
        ).to.throwException(
          /Vertex shader compilation failed: ERROR: 0:10: 'bla' : syntax error/,
        );
      });

      it('throws for an invalid fragment shader', function () {
        h = new WebGLHelper();
        expect(() =>
          h.getProgram(INVALID_FRAGMENT_SHADER, VERTEX_SHADER),
        ).to.throwException(
          /Fragment shader compilation failed: ERROR: 0:5: 'oops' : undeclared identifier/,
        );
      });
    });

    describe('#makeProjectionTransform', function () {
      beforeEach(function () {
        h = new WebGLHelper();
      });

      it('gives out the correct transform', function () {
        const scaleX =
          2 /
          SAMPLE_FRAMESTATE.size[0] /
          SAMPLE_FRAMESTATE.viewState.resolution;
        const scaleY =
          2 /
          SAMPLE_FRAMESTATE.size[1] /
          SAMPLE_FRAMESTATE.viewState.resolution;
        const given = createTransform();
        const expected = createTransform();
        scaleTransform(expected, scaleX, scaleY);
        rotateTransform(expected, -SAMPLE_FRAMESTATE.viewState.rotation);
        translateTransform(
          expected,
          -SAMPLE_FRAMESTATE.viewState.center[0],
          -SAMPLE_FRAMESTATE.viewState.center[1],
        );

        h.makeProjectionTransform(SAMPLE_FRAMESTATE, given);

        expect(given.map((val) => val.toFixed(15))).to.eql(
          expected.map((val) => val.toFixed(15)),
        );
      });
    });

    describe('deleteBuffer()', function () {
      it('can be called to free up buffer resources', function () {
        h = new WebGLHelper();
        const buffer = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);
        buffer.fromArray([0, 1, 2, 3]);
        h.flushBufferData(buffer);
        const bufferKey = getUid(buffer);
        expect(h.bufferCache_).to.have.property(bufferKey);

        h.deleteBuffer(buffer);
        expect(h.bufferCache_).to.not.have.property(bufferKey);
      });
    });

    describe('#createTexture', function () {
      beforeEach(function () {
        h = new WebGLHelper();
      });

      it('creates an empty texture from scratch', function () {
        const width = 4;
        const height = 4;
        const t = h.createTexture([width, height]);
        const gl = h.getGL();

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
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

      it('creates a texture from image data', function () {
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
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
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

      it('reuses a given texture', function () {
        const width = 4;
        const height = 4;
        const gl = h.getGL();
        const t1 = gl.createTexture();
        const t2 = h.createTexture([width, height], undefined, t1);
        expect(t1).to.be(t2);
      });
    });
  });

  describe('#enableAttributes', function () {
    let baseAttrs;

    beforeEach(function () {
      h = new WebGLHelper();
      baseAttrs = [
        {
          name: 'attr1',
          size: 3,
        },
        {
          name: 'attr2',
          size: 2,
        },
        {
          name: 'attr3',
          size: 1,
        },
      ];
      h.useProgram(
        h.getProgram(
          FRAGMENT_SHADER,
          `
        precision mediump float;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_offsetScaleMatrix;
        uniform mat4 u_offsetRotateMatrix;

        attribute vec3 attr1;
        attribute vec2 attr2;
        attribute float attr3;
        uniform float u_test;

        void main(void) {
          gl_Position = vec4(u_test, attr3, 0.0, 1.0);
        }`,
        ),
        SAMPLE_FRAMESTATE,
      );
    });

    it('enables attributes based on the given array (FLOAT)', function () {
      const spy = sinonSpy(h, 'enableAttributeArray_');
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

    it('enables attributes including padding (empty slots)', function () {
      const spy = sinonSpy(h, 'enableAttributeArray_');
      h.enableAttributes([
        {
          name: 'attr1',
          size: 3,
        },
        {
          name: null,
          size: 2,
        },
        {
          name: 'attr3',
          size: 1,
        },
      ]);
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;

      expect(spy.callCount).to.eql(2);
      expect(spy.getCall(0).args[0]).to.eql('attr1');
      expect(spy.getCall(0).args[1]).to.eql(3);
      expect(spy.getCall(0).args[2]).to.eql(FLOAT);
      expect(spy.getCall(0).args[3]).to.eql(6 * bytesPerFloat);
      expect(spy.getCall(0).args[4]).to.eql(0);
      expect(spy.getCall(1).args[0]).to.eql('attr3');
      expect(spy.getCall(1).args[1]).to.eql(1);
      expect(spy.getCall(1).args[2]).to.eql(FLOAT);
      expect(spy.getCall(1).args[3]).to.eql(6 * bytesPerFloat);
      expect(spy.getCall(1).args[4]).to.eql(5 * bytesPerFloat);
    });
  });

  describe('#enableAttributesInstanced', function () {
    let baseAttrs;

    beforeEach(function () {
      h = new WebGLHelper();
      baseAttrs = [
        {
          name: 'attr1',
          size: 3,
        },
      ];
      h.useProgram(
        h.getProgram(
          FRAGMENT_SHADER,
          `
        precision mediump float;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_offsetScaleMatrix;
        uniform mat4 u_offsetRotateMatrix;

        attribute vec3 attr1;

        void main(void) {
          gl_Position = vec4(attr1, 1.0);
        }`,
        ),
        SAMPLE_FRAMESTATE,
      );
    });

    it('enables attributes based on the given array (FLOAT)', function () {
      const spy = sinonSpy(h, 'enableAttributeArray_');
      const extSpy = sinonSpy(
        h.getInstancedRenderingExtension_(),
        'vertexAttribDivisorANGLE',
      );
      h.enableAttributesInstanced(baseAttrs);
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;

      expect(spy.callCount).to.eql(1);
      expect(spy.firstCall.args).to.eql([
        'attr1',
        3,
        FLOAT,
        3 * bytesPerFloat,
        0,
        true,
      ]);

      expect(extSpy.callCount).to.eql(1);
      expect(extSpy.firstCall.args).to.eql([
        h.getAttributeLocation('attr1'),
        1,
      ]);
    });
  });

  describe('#applyFrameState', function () {
    let stubFloat, stubVec2, stubTime;
    beforeEach(function () {
      stubTime = sinonStub(Date, 'now');
      stubTime.returns(1000);
      h = new WebGLHelper();
      stubFloat = sinonStub(h, 'setUniformFloatValue');
      stubVec2 = sinonStub(h, 'setUniformFloatVec2');

      stubTime.returns(2000);
      h.applyFrameState({...SAMPLE_FRAMESTATE, pixelRatio: 2});
    });

    afterEach(function () {
      stubTime.restore();
    });

    it('sets the default uniforms according the frame state', function () {
      expect(stubFloat.getCall(0).args).to.eql([DefaultUniform.TIME, 1]);
      expect(stubFloat.getCall(1).args).to.eql([DefaultUniform.ZOOM, 3]);
      expect(stubFloat.getCall(2).args).to.eql([DefaultUniform.RESOLUTION, 2]);
      expect(stubFloat.getCall(3).args).to.eql([DefaultUniform.PIXEL_RATIO, 2]);
      expect(stubFloat.getCall(4).args).to.eql([DefaultUniform.ROTATION, 0.4]);
      expect(stubVec2.getCall(0).args).to.eql([
        DefaultUniform.VIEWPORT_SIZE_PX,
        [100, 150],
      ]);
    });
  });

  describe('#drawElementsInstanced', () => {
    let drawSpy, divisorSpy;
    beforeEach(() => {
      h = new WebGLHelper();
      h.useProgram(
        h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER),
        SAMPLE_FRAMESTATE,
      );
      drawSpy = sinonSpy(
        h.getInstancedRenderingExtension_(),
        'drawElementsInstancedANGLE',
      );
      divisorSpy = sinonSpy(
        h.getInstancedRenderingExtension_(),
        'vertexAttribDivisorANGLE',
      );
      h.drawElementsInstanced(0, 8, 20);
    });
    it('calls drawElementsInstancedANGLE', () => {
      const gl = h.getGL();
      expect(drawSpy.callCount).to.eql(1);
      expect(drawSpy.firstCall.args).to.eql([
        gl.TRIANGLES,
        8,
        gl.UNSIGNED_INT,
        0,
        20,
      ]);
    });
    it('resets the divisors after rendering', () => {
      const gl = h.getGL();
      const max = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      expect(divisorSpy.getCalls().length).to.eql(max); // each possible attribute is disabled
      for (let i = 0; i < max; i++) {
        expect(divisorSpy.getCall(i).args).to.eql([i, 0]);
      }
    });
  });

  describe('attributes disabling', () => {
    let disableAttribSpy;
    beforeEach(() => {
      h = new WebGLHelper();
      disableAttribSpy = sinonSpy(h.getGL(), 'disableVertexAttribArray');
      const program = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
      h.useProgram(program, SAMPLE_FRAMESTATE);
    });
    it('all active attributes are disabled when enabling programs, disregarding of previous state', () => {
      const gl = h.getGL();
      const max = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      expect(disableAttribSpy.getCalls().length).to.eql(max); // each possible attribute is disabled
      for (let i = 0; i < max; i++) {
        expect(disableAttribSpy.getCall(i).args[0]).to.eql(i);
      }
    });
  });
});
