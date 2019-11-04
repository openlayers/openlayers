/**
 * @module ol/webgl/Helper
 */
import {getUid} from '../util.js';
import Disposable from '../Disposable.js';
import {clear} from '../obj.js';
import ContextEventType from '../webgl/ContextEventType.js';
import {
  compose as composeTransform,
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform
} from '../transform.js';
import {create, fromTransform} from '../vec/mat4.js';
import WebGLPostProcessingPass from './PostProcessingPass.js';
import {FLOAT, getContext, getSupportedExtensions, UNSIGNED_BYTE, UNSIGNED_INT, UNSIGNED_SHORT} from '../webgl.js';
import {includes} from '../array.js';
import {assert} from '../asserts.js';


/**
 * @typedef {Object} BufferCacheEntry
 * @property {import("./Buffer.js").default} buffer
 * @property {WebGLBuffer} webGlBuffer
 */

/**
 * Shader types, either `FRAGMENT_SHADER` or `VERTEX_SHADER`.
 * @enum {number}
 */
export const ShaderType = {
  FRAGMENT_SHADER: 0x8B30,
  VERTEX_SHADER: 0x8B31
};

/**
 * Uniform names used in the default shaders: `PROJECTION_MATRIX`, `OFFSET_SCALE_MATRIX`.
 * and `OFFSET_ROTATION_MATRIX`.
 * @enum {string}
 */
export const DefaultUniform = {
  PROJECTION_MATRIX: 'u_projectionMatrix',
  OFFSET_SCALE_MATRIX: 'u_offsetScaleMatrix',
  OFFSET_ROTATION_MATRIX: 'u_offsetRotateMatrix',
  TIME: 'u_time',
  ZOOM: 'u_zoom',
  RESOLUTION: 'u_resolution'
};

/**
 * Attribute types, either `UNSIGNED_BYTE`, `UNSIGNED_SHORT`, `UNSIGNED_INT` or `FLOAT`
 * Note: an attribute stored in a `Float32Array` should be of type `FLOAT`.
 * @enum {number}
 */
export const AttributeType = {
  UNSIGNED_BYTE: UNSIGNED_BYTE,
  UNSIGNED_SHORT: UNSIGNED_SHORT,
  UNSIGNED_INT: UNSIGNED_INT,
  FLOAT: FLOAT
};

/**
 * Description of an attribute in a buffer
 * @typedef {Object} AttributeDescription
 * @property {string} name Attribute name to use in shaders
 * @property {number} size Number of components per attributes
 * @property {AttributeType} [type] Attribute type, i.e. number of bytes used to store the value. This is
 * determined by the class of typed array which the buffer uses (eg. `Float32Array` for a `FLOAT` attribute).
 * Default is `FLOAT`.
 */

/**
 * @typedef {number|Array<number>|HTMLCanvasElement|HTMLImageElement|ImageData|import("../transform").Transform} UniformLiteralValue
 */

/**
 * Uniform value can be a number, array of numbers (2 to 4), canvas element or a callback returning
 * one of the previous types.
 * @typedef {UniformLiteralValue|function(import("../PluggableMap.js").FrameState):UniformLiteralValue} UniformValue
 */

/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas which will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object.<string,UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {Object.<string,UniformValue>} [uniforms] Uniform definitions; property names must match the uniform
 * names in the provided or default shaders.
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @typedef {Object} UniformInternalDescription
 * @property {string} name Name
 * @property {UniformValue=} value Value
 * @property {WebGLTexture} [texture] Texture
 * @private
 */

/**
 * @classdesc
 * This class is intended to provide low-level functions related to WebGL rendering, so that accessing
 * directly the WebGL API should not be required anymore.
 *
 * Several operations are handled by the `WebGLHelper` class:
 *
 * ### Define custom shaders and uniforms
 *
 *   *Shaders* are low-level programs executed on the GPU and written in GLSL. There are two types of shaders:
 *
 *   Vertex shaders are used to manipulate the position and attribute of *vertices* of rendered primitives (ie. corners of a square).
 *   Outputs are:
 *
 *   * `gl_Position`: position of the vertex in screen space
 *
 *   * Varyings usually prefixed with `v_` are passed on to the fragment shader
 *
 *   Fragment shaders are used to control the actual color of the pixels drawn on screen. Their only output is `gl_FragColor`.
 *
 *   Both shaders can take *uniforms* or *attributes* as input. Attributes are explained later. Uniforms are common, read-only values that
 *   can be changed at every frame and can be of type float, arrays of float or images.
 *
 *   Shaders must be compiled and assembled into a program like so:
 *   ```js
 *   // here we simply create two shaders and assemble them in a program which is then used
 *   // for subsequent rendering calls
 *   const vertexShader = new WebGLVertex(VERTEX_SHADER);
 *   const fragmentShader = new WebGLFragment(FRAGMENT_SHADER);
 *   const program = this.context.getProgram(fragmentShader, vertexShader);
 *   helper.useProgram(this.program);
 *   ```
 *
 *   Uniforms are defined using the `uniforms` option and can either be explicit values or callbacks taking the frame state as argument.
 *   You can also change their value along the way like so:
 *   ```js
 *   helper.setUniformFloatValue('u_value', valueAsNumber);
 *   ```
 *
 * ### Defining post processing passes
 *
 *   *Post processing* describes the act of rendering primitives to a texture, and then rendering this texture to the final canvas
 *   while applying special effects in screen space.
 *   Typical uses are: blurring, color manipulation, depth of field, filtering...
 *
 *   The `WebGLHelper` class offers the possibility to define post processes at creation time using the `postProcesses` option.
 *   A post process step accepts the following options:
 *
 *   * `fragmentShader` and `vertexShader`: text literals in GLSL language that will be compiled and used in the post processing step.
 *   * `uniforms`: uniforms can be defined for the post processing steps just like for the main render.
 *   * `scaleRatio`: allows using an intermediate texture smaller or higher than the final canvas in the post processing step.
 *     This is typically used in blur steps to reduce the performance overhead by using an already downsampled texture as input.
 *
 *   The {@link module:ol/webgl/PostProcessingPass~WebGLPostProcessingPass} class is used internally, refer to its documentation for more info.
 *
 * ### Binding WebGL buffers and flushing data into them
 *
 *   Data that must be passed to the GPU has to be transferred using {@link module:ol/webgl/Buffer~WebGLArrayBuffer} objects.
 *   A buffer has to be created only once, but must be bound every time the buffer content will be used for rendering.
 *   This is done using {@link bindBuffer}.
 *   When the buffer's array content has changed, the new data has to be flushed to the GPU memory; this is done using
 *   {@link flushBufferData}. Note: this operation is expensive and should be done as infrequently as possible.
 *
 *   When binding an array buffer, a `target` parameter must be given: it should be either {@link module:ol/webgl.ARRAY_BUFFER}
 *   (if the buffer contains vertices data) or {@link module:ol/webgl.ELEMENT_ARRAY_BUFFER} (if the buffer contains indices data).
 *
 *   Examples below:
 *   ```js
 *   // at initialization phase
 *   const verticesBuffer = new WebGLArrayBuffer([], DYNAMIC_DRAW);
 *   const indicesBuffer = new WebGLArrayBuffer([], DYNAMIC_DRAW);
 *
 *   // when array values have changed
 *   helper.flushBufferData(ARRAY_BUFFER, this.verticesBuffer);
 *   helper.flushBufferData(ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
 *
 *   // at rendering phase
 *   helper.bindBuffer(ARRAY_BUFFER, this.verticesBuffer);
 *   helper.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
 *   ```
 *
 * ### Specifying attributes
 *
 *   The GPU only receives the data as arrays of numbers. These numbers must be handled differently depending on what it describes (position, texture coordinate...).
 *   Attributes are used to specify these uses. Use {@link enableAttributeArray_} and either
 *   the default attribute names in {@link module:ol/webgl/Helper.DefaultAttrib} or custom ones.
 *
 *   Please note that you will have to specify the type and offset of the attributes in the data array. You can refer to the documentation of [WebGLRenderingContext.vertexAttribPointer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer) for more explanation.
 *   ```js
 *   // here we indicate that the data array has the following structure:
 *   // [posX, posY, offsetX, offsetY, texCoordU, texCoordV, posX, posY, ...]
 *   helper.enableAttributes([
 *     {
 *        name: 'a_position',
 *        size: 2
 *     },
 *     {
 *       name: 'a_offset',
 *       size: 2
 *     },
 *     {
 *       name: 'a_texCoord',
 *       size: 2
 *     }
 *   ])
 *   ```
 *
 * ### Rendering primitives
 *
 *   Once all the steps above have been achieved, rendering primitives to the screen is done using {@link prepareDraw}, {@link drawElements} and {@link finalizeDraw}.
 *   ```js
 *   // frame preparation step
 *   helper.prepareDraw(frameState);
 *
 *   // call this for every data array that has to be rendered on screen
 *   helper.drawElements(0, this.indicesBuffer.getArray().length);
 *
 *   // finalize the rendering by applying post processes
 *   helper.finalizeDraw(frameState);
 *   ```
 *
 * For an example usage of this class, refer to {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 *
 * @api
 */
class WebGLHelper extends Disposable {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    super();
    const options = opt_options || {};

    /** @private */
    this.boundHandleWebGLContextLost_ = this.handleWebGLContextLost.bind(this);

    /** @private */
    this.boundHandleWebGLContextRestored_ = this.handleWebGLContextRestored.bind(this);

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = document.createElement('canvas');
    this.canvas_.style.position = 'absolute';
    this.canvas_.style.left = '0';


    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = getContext(this.canvas_);
    const gl = this.getGL();

    /**
     * @private
     * @type {!Object<string, BufferCacheEntry>}
     */
    this.bufferCache_ = {};

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.currentProgram_ = null;

    assert(includes(getSupportedExtensions(), 'OES_element_index_uint'), 63);
    gl.getExtension('OES_element_index_uint');

    this.canvas_.addEventListener(ContextEventType.LOST, this.boundHandleWebGLContextLost_);
    this.canvas_.addEventListener(ContextEventType.RESTORED, this.boundHandleWebGLContextRestored_);

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetRotateMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetScaleMatrix_ = createTransform();

    /**
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = create();

    /**
     * @private
     * @type {Object.<string, WebGLUniformLocation>}
     */
    this.uniformLocations_ = {};

    /**
     * @private
     * @type {Object.<string, number>}
     */
    this.attribLocations_ = {};

    /**
     * Holds info about custom uniforms used in the post processing pass.
     * If the uniform is a texture, the WebGL Texture object will be stored here.
     * @type {Array<UniformInternalDescription>}
     * @private
     */
    this.uniforms_ = [];
    if (options.uniforms) {
      for (const name in options.uniforms) {
        this.uniforms_.push({
          name: name,
          value: options.uniforms[name]
        });
      }
    }

    /**
     * An array of PostProcessingPass objects is kept in this variable, built from the steps provided in the
     * options. If no post process was given, a default one is used (so as not to have to make an exception to
     * the frame buffer logic).
     * @type {Array<WebGLPostProcessingPass>}
     * @private
     */
    this.postProcessPasses_ = options.postProcesses ? options.postProcesses.map(function(options) {
      return new WebGLPostProcessingPass({
        webGlContext: gl,
        scaleRatio: options.scaleRatio,
        vertexShader: options.vertexShader,
        fragmentShader: options.fragmentShader,
        uniforms: options.uniforms
      });
    }) : [new WebGLPostProcessingPass({webGlContext: gl})];

    /**
     * @type {string|null}
     * @private
     */
    this.shaderCompileErrors_ = null;

    /**
     * @type {number}
     * @private
     */
    this.startTime_ = Date.now();
  }

  /**
   * Just bind the buffer if it's in the cache. Otherwise create
   * the WebGL buffer, bind it, populate it, and add an entry to
   * the cache.
   * @param {import("./Buffer").default} buffer Buffer.
   * @api
   */
  bindBuffer(buffer) {
    const gl = this.getGL();
    const bufferKey = getUid(buffer);
    let bufferCache = this.bufferCache_[bufferKey];
    if (!bufferCache) {
      const webGlBuffer = gl.createBuffer();
      bufferCache = {
        buffer: buffer,
        webGlBuffer: webGlBuffer
      };
      this.bufferCache_[bufferKey] = bufferCache;
    }
    gl.bindBuffer(buffer.getType(), bufferCache.webGlBuffer);
  }

  /**
   * Update the data contained in the buffer array; this is required for the
   * new data to be rendered
   * @param {import("./Buffer").default} buffer Buffer.
   * @api
   */
  flushBufferData(buffer) {
    const gl = this.getGL();
    this.bindBuffer(buffer);
    gl.bufferData(buffer.getType(), buffer.getArray(), buffer.getUsage());
  }

  /**
   * @param {import("./Buffer.js").default} buf Buffer.
   */
  deleteBuffer(buf) {
    const gl = this.getGL();
    const bufferKey = getUid(buf);
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    if (!gl.isContextLost()) {
      gl.deleteBuffer(bufferCacheEntry.buffer);
    }
    delete this.bufferCache_[bufferKey];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.canvas_.removeEventListener(ContextEventType.LOST, this.boundHandleWebGLContextLost_);
    this.canvas_.removeEventListener(ContextEventType.RESTORED, this.boundHandleWebGLContextRestored_);
  }

  /**
   * Clear the buffer & set the viewport to draw.
   * Post process passes will be initialized here, the first one being bound as a render target for
   * subsequent draw calls.
   * @param {import("../PluggableMap.js").FrameState} frameState current frame state
   * @api
   */
  prepareDraw(frameState) {
    const gl = this.getGL();
    const canvas = this.getCanvas();
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;

    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;
    canvas.style.width = size[0] + 'px';
    canvas.style.height = size[1] + 'px';

    gl.useProgram(this.currentProgram_);

    // loop backwards in post processes list
    for (let i = this.postProcessPasses_.length - 1; i >= 0; i--) {
      this.postProcessPasses_[i].init(frameState);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.currentProgram_);
    this.applyFrameState(frameState);
    this.applyUniforms(frameState);
  }

  /**
   * Clear the render target & bind it for future draw operations.
   * This is similar to `prepareDraw`, only post processes will not be applied.
   * Note: the whole viewport will be drawn to the render target, regardless of its size.
   * @param {import("../PluggableMap.js").FrameState} frameState current frame state
   * @param {import("./RenderTarget.js").default} renderTarget Render target to draw to
   * @param {boolean} [opt_disableAlphaBlend] If true, no alpha blending will happen.
   */
  prepareDrawToRenderTarget(frameState, renderTarget, opt_disableAlphaBlend) {
    const gl = this.getGL();
    const size = renderTarget.getSize();

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.getFramebuffer());
    gl.viewport(0, 0, size[0], size[1]);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.getTexture());
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, opt_disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.currentProgram_);
    this.applyFrameState(frameState);
    this.applyUniforms(frameState);
  }

  /**
   * Execute a draw call based on the currently bound program, texture, buffers, attributes.
   * @param {number} start Start index.
   * @param {number} end End index.
   * @api
   */
  drawElements(start, end) {
    const gl = this.getGL();
    const elementType = gl.UNSIGNED_INT;
    const elementSize = 4;

    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(gl.TRIANGLES, numItems, elementType, offsetInBytes);
  }

  /**
   * Apply the successive post process passes which will eventually render to the actual canvas.
   * @param {import("../PluggableMap.js").FrameState} frameState current frame state
   * @api
   */
  finalizeDraw(frameState) {
    // apply post processes using the next one as target
    for (let i = 0; i < this.postProcessPasses_.length; i++) {
      this.postProcessPasses_[i].apply(frameState, this.postProcessPasses_[i + 1] || null);
    }
  }

  /**
   * @return {HTMLCanvasElement} Canvas.
   * @api
   */
  getCanvas() {
    return this.canvas_;
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   * @api
   */
  getGL() {
    return this.gl_;
  }

  /**
   * Sets the default matrix uniforms for a given frame state. This is called internally in `prepareDraw`.
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  applyFrameState(frameState) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;

    const offsetScaleMatrix = resetTransform(this.offsetScaleMatrix_);
    scaleTransform(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

    const offsetRotateMatrix = resetTransform(this.offsetRotateMatrix_);
    if (rotation !== 0) {
      rotateTransform(offsetRotateMatrix, -rotation);
    }

    this.setUniformMatrixValue(DefaultUniform.OFFSET_SCALE_MATRIX, fromTransform(this.tmpMat4_, offsetScaleMatrix));
    this.setUniformMatrixValue(DefaultUniform.OFFSET_ROTATION_MATRIX, fromTransform(this.tmpMat4_, offsetRotateMatrix));

    this.setUniformFloatValue(DefaultUniform.TIME, (Date.now() - this.startTime_) * 0.001);
    this.setUniformFloatValue(DefaultUniform.ZOOM, frameState.viewState.zoom);
    this.setUniformFloatValue(DefaultUniform.RESOLUTION, frameState.viewState.resolution);
  }

  /**
   * Sets the custom uniforms based on what was given in the constructor. This is called internally in `prepareDraw`.
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  applyUniforms(frameState) {
    const gl = this.getGL();

    let value;
    let textureSlot = 0;
    this.uniforms_.forEach(function(uniform) {
      value = typeof uniform.value === 'function' ? uniform.value(frameState) : uniform.value;

      // apply value based on type
      if (value instanceof HTMLCanvasElement || value instanceof HTMLImageElement || value instanceof ImageData) {
        // create a texture & put data
        if (!uniform.texture) {
          uniform.texture = gl.createTexture();
        }
        gl.activeTexture(gl[`TEXTURE${textureSlot}`]);
        gl.bindTexture(gl.TEXTURE_2D, uniform.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const imageReady = !(value instanceof HTMLImageElement) || /** @type {HTMLImageElement} */(value).complete;
        if (imageReady) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, value);
        }

        // fill texture slots by increasing index
        gl.uniform1i(this.getUniformLocation(uniform.name), textureSlot++);

      } else if (Array.isArray(value) && value.length === 6) {
        this.setUniformMatrixValue(uniform.name, fromTransform(this.tmpMat4_, value));
      } else if (Array.isArray(value) && value.length <= 4) {
        switch (value.length) {
          case 2:
            gl.uniform2f(this.getUniformLocation(uniform.name), value[0], value[1]);
            return;
          case 3:
            gl.uniform3f(this.getUniformLocation(uniform.name), value[0], value[1], value[2]);
            return;
          case 4:
            gl.uniform4f(this.getUniformLocation(uniform.name), value[0], value[1], value[2], value[3]);
            return;
          default:
            return;
        }
      } else if (typeof value === 'number') {
        gl.uniform1f(this.getUniformLocation(uniform.name), value);
      }
    }.bind(this));
  }

  /**
   * Use a program.  If the program is already in use, this will return `false`.
   * @param {WebGLProgram} program Program.
   * @return {boolean} Changed.
   * @api
   */
  useProgram(program) {
    if (program == this.currentProgram_) {
      return false;
    } else {
      const gl = this.getGL();
      gl.useProgram(program);
      this.currentProgram_ = program;
      this.uniformLocations_ = {};
      this.attribLocations_ = {};
      return true;
    }
  }

  /**
   * Will attempt to compile a vertex or fragment shader based on source
   * On error, the shader will be returned but
   * `gl.getShaderParameter(shader, gl.COMPILE_STATUS)` will return `true`
   * Use `gl.getShaderInfoLog(shader)` to have details
   * @param {string} source Shader source
   * @param {ShaderType} type VERTEX_SHADER or FRAGMENT_SHADER
   * @return {WebGLShader} Shader object
   */
  compileShader(source, type) {
    const gl = this.getGL();
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  /**
   * Create a program for a vertex and fragment shader. The shaders compilation may have failed:
   * use `WebGLHelper.getShaderCompileErrors()`to have details if any.
   * @param {string} fragmentShaderSource Fragment shader source.
   * @param {string} vertexShaderSource Vertex shader source.
   * @return {WebGLProgram} Program
   * @api
   */
  getProgram(fragmentShaderSource, vertexShaderSource) {
    const gl = this.getGL();

    const fragmentShader = this.compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    const vertexShader = this.compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    this.shaderCompileErrors_ = null;

    if (gl.getShaderInfoLog(fragmentShader)) {
      this.shaderCompileErrors_ =
        `Fragment shader compilation failed:\n${gl.getShaderInfoLog(fragmentShader)}`;
    }
    if (gl.getShaderInfoLog(vertexShader)) {
      this.shaderCompileErrors_ = (this.shaderCompileErrors_ || '') +
        `Vertex shader compilation failed:\n${gl.getShaderInfoLog(vertexShader)}`;
    }

    const program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    return program;
  }

  /**
   * Will return the last shader compilation errors. If no error happened, will return null;
   * @return {string|null} Errors description, or null if last compilation was successful
   * @api
   */
  getShaderCompileErrors() {
    return this.shaderCompileErrors_;
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Uniform name
   * @return {WebGLUniformLocation} uniformLocation
   * @api
   */
  getUniformLocation(name) {
    if (this.uniformLocations_[name] === undefined) {
      this.uniformLocations_[name] = this.getGL().getUniformLocation(this.currentProgram_, name);
    }
    return this.uniformLocations_[name];
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Attribute name
   * @return {number} attribLocation
   * @api
   */
  getAttributeLocation(name) {
    if (this.attribLocations_[name] === undefined) {
      this.attribLocations_[name] = this.getGL().getAttribLocation(this.currentProgram_, name);
    }
    return this.attribLocations_[name];
  }

  /**
   * Modifies the given transform to apply the rotation/translation/scaling of the given frame state.
   * The resulting transform can be used to convert world space coordinates to view coordinates.
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../transform").Transform} transform Transform to update.
   * @return {import("../transform").Transform} The updated transform object.
   * @api
   */
  makeProjectionTransform(frameState, transform) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const resolution = frameState.viewState.resolution;
    const center = frameState.viewState.center;

    resetTransform(transform);
    composeTransform(transform,
      0, 0,
      2 / (resolution * size[0]), 2 / (resolution * size[1]),
      -rotation,
      -center[0], -center[1]
    );
    return transform;
  }

  /**
   * Give a value for a standard float uniform
   * @param {string} uniform Uniform name
   * @param {number} value Value
   * @api
   */
  setUniformFloatValue(uniform, value) {
    this.getGL().uniform1f(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a standard matrix4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Matrix value
   * @api
   */
  setUniformMatrixValue(uniform, value) {
    this.getGL().uniformMatrix4fv(this.getUniformLocation(uniform), false, value);
  }

  /**
   * Will set the currently bound buffer to an attribute of the shader program. Used by `#enableAttributes`
   * internally.
   * @param {string} attribName Attribute name
   * @param {number} size Number of components per attributes
   * @param {number} type UNSIGNED_INT, UNSIGNED_BYTE, UNSIGNED_SHORT or FLOAT
   * @param {number} stride Stride in bytes (0 means attribs are packed)
   * @param {number} offset Offset in bytes
   * @private
   */
  enableAttributeArray_(attribName, size, type, stride, offset) {
    const location = this.getAttributeLocation(attribName);
    // the attribute has not been found in the shaders; do not enable it
    if (location < 0) {
      return;
    }
    this.getGL().enableVertexAttribArray(location);
    this.getGL().vertexAttribPointer(location, size, type,
      false, stride, offset);
  }

  /**
   * Will enable the following attributes to be read from the currently bound buffer,
   * i.e. tell the GPU where to read the different attributes in the buffer. An error in the
   * size/type/order of attributes will most likely break the rendering and throw a WebGL exception.
   * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
   * @api
   */
  enableAttributes(attributes) {
    const stride = computeAttributesStride(attributes);
    let offset = 0;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      this.enableAttributeArray_(attr.name, attr.size, attr.type || FLOAT, stride, offset);
      offset += attr.size * getByteSizeFromType(attr.type);
    }
  }

  /**
   * WebGL context was lost
   * @private
   */
  handleWebGLContextLost() {
    clear(this.bufferCache_);
    this.currentProgram_ = null;
  }

  /**
   * WebGL context was restored
   * @private
   */
  handleWebGLContextRestored() {
  }

  /**
   * Will create or reuse a given webgl texture and apply the given size. If no image data
   * specified, the texture will be empty, otherwise image data will be used and the `size`
   * parameter will be ignored.
   * Note: wrap parameters are set to clamp to edge, min filter is set to linear.
   * @param {Array<number>} size Expected size of the texture
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement} [opt_data] Image data/object to bind to the texture
   * @param {WebGLTexture} [opt_texture] Existing texture to reuse
   * @return {WebGLTexture} The generated texture
   * @api
   */
  createTexture(size, opt_data, opt_texture) {
    const gl = this.getGL();
    const texture = opt_texture || gl.createTexture();

    // set params & size
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (opt_data) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, opt_data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, size[0], size[1], border, format, type, null);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
}

/**
 * Compute a stride in bytes based on a list of attributes
 * @param {Array<AttributeDescription>} attributes Ordered list of attributes
 * @returns {number} Stride, ie amount of values for each vertex in the vertex buffer
 * @api
 */
export function computeAttributesStride(attributes) {
  let stride = 0;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    stride += attr.size * getByteSizeFromType(attr.type);
  }
  return stride;
}

/**
 * Computes the size in byte of an attribute type.
 * @param {AttributeType} type Attribute type
 * @returns {number} The size in bytes
 */
function getByteSizeFromType(type) {
  switch (type) {
    case AttributeType.UNSIGNED_BYTE: return Uint8Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_SHORT: return Uint16Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_INT: return Uint32Array.BYTES_PER_ELEMENT;
    case AttributeType.FLOAT:
    default: return Float32Array.BYTES_PER_ELEMENT;
  }
}

export default WebGLHelper;
