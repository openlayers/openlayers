import {assert} from 'chai';
import {
  create as createTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../../../../src/ol/transform.js';
import {getUid} from '../../../../../src/ol/util.js';
import {ARRAY_BUFFER, FLOAT, STATIC_DRAW} from '../../../../../src/ol/webgl.js';
import WebGLArrayBuffer from '../../../../../src/ol/webgl/Buffer.js';
import WebGLHelper, {
  DefaultUniform,
} from '../../../../../src/ol/webgl/Helper.js';

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
        assert.deepEqual(h.getGL() instanceof WebGLRenderingContext, true);
        assert.deepEqual(h.getCanvas() instanceof HTMLCanvasElement, true);
      });

      it('has a default rendering pass', function () {
        assert.deepEqual(h.postProcessPasses_.length, 1);
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
        assert.deepEqual(h.postProcessPasses_.length, 2);
        assert.deepEqual(h.postProcessPasses_[0].scaleRatio_, 0.5);
        assert.deepEqual(h.postProcessPasses_[0].uniforms_.length, 0);
        assert.deepEqual(h.postProcessPasses_[1].scaleRatio_, 1);
        assert.deepEqual(h.postProcessPasses_[1].uniforms_.length, 1);
        assert.deepEqual(h.postProcessPasses_[1].uniforms_[0].value, 4);
      });
    });

    describe('with empty post process array', function () {
      beforeEach(function () {
        h = new WebGLHelper({
          postProcesses: [],
        });
      });

      it('has a default rendering pass as well', function () {
        assert.strictEqual(h.postProcessPasses_.length, 1);
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
        assert.deepEqual(h.getCanvas().width, 100);
        assert.deepEqual(h.getCanvas().height, 160);
      });

      it('has processed default uniforms', function () {
        const uniformLocations = h.uniformLocationsByProgram_[getUid(program)];
        assert.notDeepEqual(uniformLocations[DefaultUniform.TIME], undefined);
        assert.notDeepEqual(uniformLocations[DefaultUniform.ZOOM], undefined);
        assert.notDeepEqual(
          uniformLocations[DefaultUniform.RESOLUTION],
          undefined,
        );
        assert.notDeepEqual(
          uniformLocations[DefaultUniform.VIEWPORT_SIZE_PX],
          undefined,
        );
        assert.notDeepEqual(
          uniformLocations[DefaultUniform.PIXEL_RATIO],
          undefined,
        );
        assert.notDeepEqual(
          uniformLocations[DefaultUniform.ROTATION],
          undefined,
        );
      });

      it('has processed uniforms', function () {
        assert.deepEqual(h.uniforms_.length, 5);
        assert.deepEqual(h.uniforms_[0].name, 'u_test1');
        assert.deepEqual(h.uniforms_[1].name, 'u_test2');
        assert.deepEqual(h.uniforms_[2].name, 'u_test3');
        assert.deepEqual(h.uniforms_[3].name, 'u_test4');
        assert.deepEqual(h.uniforms_[4].name, 'u_test5');
        assert.notDeepEqual(h.uniforms_[0].location, -1);
        assert.notDeepEqual(h.uniforms_[1].location, -1);
        assert.notDeepEqual(h.uniforms_[2].location, -1);
        assert.notDeepEqual(h.uniforms_[3].location, -1);
        assert.notDeepEqual(h.uniforms_[4].location, -1);
        assert.notDeepEqual(h.uniforms_[2].texture, undefined);
        assert.deepEqual(h.uniforms_[4].texture, uniformTexture);
      });

      describe('avoid resizing the canvas if not required', () => {
        let widthSpy, heightSpy;
        beforeEach(function () {
          widthSpy = vi.spyOn(h.getCanvas(), 'width', 'set');
          heightSpy = vi.spyOn(h.getCanvas(), 'height', 'set');
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
          assert.strictEqual(widthSpy.mock.calls.length, 0);
          assert.strictEqual(heightSpy.mock.calls.length, 0);
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
        assert.deepEqual(h.currentProgram_, p);
      });

      it('has no shader compilation error', function () {
        assert.deepEqual(h.shaderCompileErrors_, null);
      });

      it('can find the uniform location', function () {
        assert.notDeepEqual(h.getUniformLocation('u_test'), null);
      });

      it('can find the attribute location', function () {
        assert.notDeepEqual(h.getAttributeLocation('a_test'), -1);
      });

      it('cannot find an unknown attribute location', function () {
        assert.deepEqual(h.getAttributeLocation('a_test_missing'), -1);
      });
    });

    describe('invalid shader compiling', function () {
      it('throws for an invalid vertex shader', function () {
        h = new WebGLHelper();
        assert.throws(
          () => h.getProgram(FRAGMENT_SHADER, INVALID_VERTEX_SHADER),
          /Vertex shader compilation failed: ERROR: 0:10: 'bla' : syntax error/,
        );
      });

      it('throws for an invalid fragment shader', function () {
        h = new WebGLHelper();
        assert.throws(
          () => h.getProgram(INVALID_FRAGMENT_SHADER, VERTEX_SHADER),
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

        assert.deepEqual(
          given.map((val) => val.toFixed(15)),
          expected.map((val) => val.toFixed(15)),
        );
      });

      it('gives out the correct transform (rotation ignored)', function () {
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
        translateTransform(
          expected,
          -SAMPLE_FRAMESTATE.viewState.center[0],
          -SAMPLE_FRAMESTATE.viewState.center[1],
        );

        h.makeProjectionTransform(SAMPLE_FRAMESTATE, given, true);

        assert.deepEqual(
          given.map((val) => val.toFixed(15)),
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
        assert.property(h.bufferCache_, bufferKey);

        h.deleteBuffer(buffer);
        assert.notProperty(h.bufferCache_, bufferKey);
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

        assert.deepEqual(data[0], 0);
        assert.deepEqual(data[1], 0);
        assert.deepEqual(data[2], 0);
        assert.deepEqual(data[3], 0);
        assert.deepEqual(data[4], 0);
        assert.deepEqual(data[5], 0);
        assert.deepEqual(data[6], 0);
        assert.deepEqual(data[7], 0);
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

        assert.deepEqual(data[0], 100);
        assert.deepEqual(data[1], 150);
        assert.deepEqual(data[2], 200);
        assert.deepEqual(data[3], 250);
        assert.deepEqual(data[4], 100);
        assert.deepEqual(data[5], 150);
        assert.deepEqual(data[6], 200);
        assert.deepEqual(data[7], 250);
      });

      it('reuses a given texture', function () {
        const width = 4;
        const height = 4;
        const gl = h.getGL();
        const t1 = gl.createTexture();
        const t2 = h.createTexture([width, height], undefined, t1);
        assert.strictEqual(t1, t2);
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
      const spy = vi.spyOn(h, 'enableAttributeArray_');
      h.enableAttributes(baseAttrs);
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;

      assert.deepEqual(spy.mock.calls.length, 3);
      assert.deepEqual(spy.mock.calls[0][0], 'attr1');
      assert.deepEqual(spy.mock.calls[0][1], 3);
      assert.deepEqual(spy.mock.calls[0][2], FLOAT);
      assert.deepEqual(spy.mock.calls[0][3], 6 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[0][4], 0);
      assert.deepEqual(spy.mock.calls[1][0], 'attr2');
      assert.deepEqual(spy.mock.calls[1][1], 2);
      assert.deepEqual(spy.mock.calls[1][2], FLOAT);
      assert.deepEqual(spy.mock.calls[1][3], 6 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[1][4], 3 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[2][0], 'attr3');
      assert.deepEqual(spy.mock.calls[2][1], 1);
      assert.deepEqual(spy.mock.calls[2][2], FLOAT);
      assert.deepEqual(spy.mock.calls[2][3], 6 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[2][4], 5 * bytesPerFloat);
    });

    it('enables attributes including padding (empty slots)', function () {
      const spy = vi.spyOn(h, 'enableAttributeArray_');
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

      assert.deepEqual(spy.mock.calls.length, 2);
      assert.deepEqual(spy.mock.calls[0][0], 'attr1');
      assert.deepEqual(spy.mock.calls[0][1], 3);
      assert.deepEqual(spy.mock.calls[0][2], FLOAT);
      assert.deepEqual(spy.mock.calls[0][3], 6 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[0][4], 0);
      assert.deepEqual(spy.mock.calls[1][0], 'attr3');
      assert.deepEqual(spy.mock.calls[1][1], 1);
      assert.deepEqual(spy.mock.calls[1][2], FLOAT);
      assert.deepEqual(spy.mock.calls[1][3], 6 * bytesPerFloat);
      assert.deepEqual(spy.mock.calls[1][4], 5 * bytesPerFloat);
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
      const spy = vi.spyOn(h, 'enableAttributeArray_');
      const extSpy = vi.spyOn(
        h.getInstancedRenderingExtension_(),
        'vertexAttribDivisorANGLE',
      );
      h.enableAttributesInstanced(baseAttrs);
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;

      assert.deepEqual(spy.mock.calls.length, 1);
      assert.deepEqual(spy.mock.calls[0], [
        'attr1',
        3,
        FLOAT,
        3 * bytesPerFloat,
        0,
        true,
      ]);

      assert.deepEqual(extSpy.mock.calls.length, 1);
      assert.deepEqual(extSpy.mock.calls[0], [
        h.getAttributeLocation('attr1'),
        1,
      ]);
    });
  });

  describe('#applyFrameState', function () {
    let stubFloat, stubVec2, stubTime;
    beforeEach(function () {
      stubTime = vi.spyOn(Date, 'now');
      stubTime.mockReturnValue(1000);
      h = new WebGLHelper();
      stubFloat = vi
        .spyOn(h, 'setUniformFloatValue')
        .mockImplementation(() => {});
      stubVec2 = vi
        .spyOn(h, 'setUniformFloatVec2')
        .mockImplementation(() => {});

      stubTime.mockReturnValue(2000);
      h.applyFrameState({...SAMPLE_FRAMESTATE, pixelRatio: 2});
    });

    afterEach(function () {
      stubTime.mockRestore();
    });

    it('sets the default uniforms according the frame state', function () {
      assert.deepEqual(stubFloat.mock.calls[0], [DefaultUniform.TIME, 1]);
      assert.deepEqual(stubFloat.mock.calls[1], [DefaultUniform.ZOOM, 3]);
      assert.deepEqual(stubFloat.mock.calls[2], [DefaultUniform.RESOLUTION, 2]);
      assert.deepEqual(stubFloat.mock.calls[3], [
        DefaultUniform.PIXEL_RATIO,
        2,
      ]);
      assert.deepEqual(stubFloat.mock.calls[4], [DefaultUniform.ROTATION, 0.4]);
      assert.deepEqual(stubVec2.mock.calls[0], [
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
      drawSpy = vi.spyOn(
        h.getInstancedRenderingExtension_(),
        'drawElementsInstancedANGLE',
      );
      divisorSpy = vi.spyOn(
        h.getInstancedRenderingExtension_(),
        'vertexAttribDivisorANGLE',
      );
      h.drawElementsInstanced(0, 8, 20);
    });
    it('calls drawElementsInstancedANGLE', () => {
      const gl = h.getGL();
      assert.deepEqual(drawSpy.mock.calls.length, 1);
      assert.deepEqual(drawSpy.mock.calls[0], [
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
      assert.deepEqual(divisorSpy.mock.calls.length, max);
      for (let i = 0; i < max; i++) {
        assert.deepEqual(divisorSpy.mock.calls[i], [i, 0]);
      }
    });
  });

  describe('attributes disabling', () => {
    let disableAttribSpy;
    beforeEach(() => {
      h = new WebGLHelper();
      disableAttribSpy = vi.spyOn(h.getGL(), 'disableVertexAttribArray');
      const program = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
      h.useProgram(program, SAMPLE_FRAMESTATE);
    });
    it('all active attributes are disabled when enabling programs, disregarding of previous state', () => {
      const gl = h.getGL();
      const max = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      assert.deepEqual(disableAttribSpy.mock.calls.length, max);
      for (let i = 0; i < max; i++) {
        assert.deepEqual(disableAttribSpy.mock.calls[i][0], i);
      }
    });
  });
});
