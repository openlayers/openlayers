/**
 * @module ol/webgl/Helper
 */
import ContextEventType from '../webgl/ContextEventType.js';
import Disposable from '../Disposable.js';
import WebGLPostProcessingPass from './PostProcessingPass.js';
import {
  FLOAT,
  UNSIGNED_BYTE,
  UNSIGNED_INT,
  UNSIGNED_SHORT,
  getContext,
} from '../webgl.js';
import {clear} from '../obj.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../transform.js';
import {create, fromTransform} from '../vec/mat4.js';
import {getUid} from '../util.js';

/**
 * @typedef {Object} BufferCacheEntry
 * @property {import("./Buffer.js").default} buffer Buffer.
 * @property {WebGLBuffer} webGlBuffer WebGlBuffer.
 */

/**
 * Shader types, either `FRAGMENT_SHADER` or `VERTEX_SHADER`.
 * @enum {number}
 */
export const ShaderType = {
  FRAGMENT_SHADER: 0x8b30,
  VERTEX_SHADER: 0x8b31,
};

/**
 * Names of uniforms made available to all shaders.
 * Please note: changing these *will* break custom shaders!
 * @enum {string}
 */
export const DefaultUniform = {
  PROJECTION_MATRIX: 'u_projectionMatrix',
  SCREEN_TO_WORLD_MATRIX: 'u_screenToWorldMatrix',
  TIME: 'u_time',
  ZOOM: 'u_zoom',
  RESOLUTION: 'u_resolution',
  ROTATION: 'u_rotation',
  VIEWPORT_SIZE_PX: 'u_viewportSizePx',
  PIXEL_RATIO: 'u_pixelRatio',
  HIT_DETECTION: 'u_hitDetection',
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
  FLOAT: FLOAT,
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
 * @typedef {number|Array<number>|HTMLCanvasElement|HTMLImageElement|ImageData|WebGLTexture|import("../transform").Transform} UniformLiteralValue
 */

/**
 * Uniform value can be a number, array of numbers (2 to 4), canvas element or a callback returning
 * one of the previous types.
 * @typedef {UniformLiteralValue|function(import("../Map.js").FrameState):UniformLiteralValue} UniformValue
 */

/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas which will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object<string,UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {Object<string,UniformValue>} [uniforms] Uniform definitions; property names must match the uniform
 * names in the provided or default shaders.
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 * @property {string} [canvasCacheKey] The cache key for the canvas.
 */

/**
 * @typedef {Object} UniformInternalDescription
 * @property {string} name Name
 * @property {UniformValue} [value] Value
 * @property {UniformValue} [prevValue] The previous value.
 * @property {WebGLTexture} [texture] Texture
 * @private
 */

/**
 * @typedef {Object} CanvasCacheItem
 * @property {WebGLRenderingContext} context The context of this canvas.
 * @property {number} users The count of users of this canvas.
 */

/**
 * @type {Object<string,CanvasCacheItem>}
 */
const canvasCache = {};

/**
 * @param {string} key The cache key for the canvas.
 * @return {string} The shared cache key.
 */
function getSharedCanvasCacheKey(key) {
  return 'shared/' + key;
}

let uniqueCanvasCacheKeyCount = 0;

/**
 * @return {string} The unique cache key.
 */
function getUniqueCanvasCacheKey() {
  const key = 'unique/' + uniqueCanvasCacheKeyCount;
  uniqueCanvasCacheKeyCount += 1;
  return key;
}

/**
 * @param {string} key The cache key for the canvas.
 * @return {WebGLRenderingContext} The canvas.
 */
function getOrCreateContext(key) {
  let cacheItem = canvasCache[key];
  if (!cacheItem) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    const context = getContext(canvas);
    cacheItem = {users: 0, context};
    canvasCache[key] = cacheItem;
  }

  cacheItem.users += 1;
  return cacheItem.context;
}

/**
 * @param {string} key The cache key for the canvas.
 */
function releaseCanvas(key) {
  const cacheItem = canvasCache[key];
  if (!cacheItem) {
    return;
  }

  cacheItem.users -= 1;
  if (cacheItem.users > 0) {
    return;
  }

  const gl = cacheItem.context;
  const extension = gl.getExtension('WEBGL_lose_context');
  if (extension) {
    extension.loseContext();
  }
  const canvas = gl.canvas;
  canvas.width = 1;
  canvas.height = 1;

  delete canvasCache[key];
}

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
 *   // for subsequent rendering calls; note how a frameState is required to set up a program,
 *   // as several default uniforms are computed from it (projection matrix, zoom level, etc.)
 *   const vertexShader = new WebGLVertex(VERTEX_SHADER);
 *   const fragmentShader = new WebGLFragment(FRAGMENT_SHADER);
 *   const program = this.context.getProgram(fragmentShader, vertexShader);
 *   helper.useProgram(this.program, frameState);
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
 *   Attributes are used to specify these uses. Specify the attribute names with
 *   {@link module:ol/webgl/Helper~WebGLHelper#enableAttributes} (see code snippet below).
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
 */
class WebGLHelper extends Disposable {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();
    options = options || {};

    /** @private */
    this.boundHandleWebGLContextLost_ = this.handleWebGLContextLost.bind(this);

    /** @private */
    this.boundHandleWebGLContextRestored_ =
      this.handleWebGLContextRestored.bind(this);

    /**
     * @private
     * @type {string}
     */
    this.canvasCacheKey_ = options.canvasCacheKey
      ? getSharedCanvasCacheKey(options.canvasCacheKey)
      : getUniqueCanvasCacheKey();

    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = getOrCreateContext(this.canvasCacheKey_);

    /**
     * @private
     * @type {!Object<string, BufferCacheEntry>}
     */
    this.bufferCache_ = {};

    /**
     * @private
     * @type {Object<string, Object>}
     */
    this.extensionCache_ = {};

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.currentProgram_ = null;

    /**
     * @private
     * @type boolean
     */
    this.needsToBeRecreated_ = false;

    const canvas = this.gl_.canvas;

    canvas.addEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_,
    );
    canvas.addEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_,
    );

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
     * @type {Object<string, Object<string, WebGLUniformLocation>>}
     */
    this.uniformLocationsByProgram_ = {};

    /**
     * @private
     * @type {Object<string, Object<string, number>>}
     */
    this.attribLocationsByProgram_ = {};

    /**
     * Holds info about custom uniforms used in the post processing pass.
     * If the uniform is a texture, the WebGL Texture object will be stored here.
     * @type {Array<UniformInternalDescription>}
     * @private
     */
    this.uniforms_ = [];
    if (options.uniforms) {
      this.setUniforms(options.uniforms);
    }

    /**
     * An array of PostProcessingPass objects is kept in this variable, built from the steps provided in the
     * options. If no post process was given, a default one is used (so as not to have to make an exception to
     * the frame buffer logic).
     * @type {Array<WebGLPostProcessingPass>}
     * @private
     */
    this.postProcessPasses_ = options.postProcesses
      ? options.postProcesses.map(
          (options) =>
            new WebGLPostProcessingPass({
              webGlContext: this.gl_,
              scaleRatio: options.scaleRatio,
              vertexShader: options.vertexShader,
              fragmentShader: options.fragmentShader,
              uniforms: options.uniforms,
            }),
        )
      : [new WebGLPostProcessingPass({webGlContext: this.gl_})];

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
   * @param {Object<string, UniformValue>} uniforms Uniform definitions.
   */
  setUniforms(uniforms) {
    this.uniforms_ = [];
    this.addUniforms(uniforms);
  }

  /**
   * @param {Object<string, UniformValue>} uniforms Uniform definitions.
   */
  addUniforms(uniforms) {
    for (const name in uniforms) {
      this.uniforms_.push({
        name: name,
        value: uniforms[name],
      });
    }
  }

  /**
   * @param {string} canvasCacheKey The canvas cache key.
   * @return {boolean} The provided key matches the one this helper was constructed with.
   */
  canvasCacheKeyMatches(canvasCacheKey) {
    return this.canvasCacheKey_ === getSharedCanvasCacheKey(canvasCacheKey);
  }

  /**
   * Get a WebGL extension.  If the extension is not supported, null is returned.
   * Extensions are cached after they are enabled for the first time.
   * @param {string} name The extension name.
   * @return {Object|null} The extension or null if not supported.
   */
  getExtension(name) {
    if (name in this.extensionCache_) {
      return this.extensionCache_[name];
    }
    const extension = this.gl_.getExtension(name);
    this.extensionCache_[name] = extension;
    return extension;
  }

  /**
   * Just bind the buffer if it's in the cache. Otherwise create
   * the WebGL buffer, bind it, populate it, and add an entry to
   * the cache.
   * @param {import("./Buffer").default} buffer Buffer.
   */
  bindBuffer(buffer) {
    const gl = this.gl_;
    const bufferKey = getUid(buffer);
    let bufferCache = this.bufferCache_[bufferKey];
    if (!bufferCache) {
      const webGlBuffer = gl.createBuffer();
      bufferCache = {
        buffer: buffer,
        webGlBuffer: webGlBuffer,
      };
      this.bufferCache_[bufferKey] = bufferCache;
    }
    gl.bindBuffer(buffer.getType(), bufferCache.webGlBuffer);
  }

  /**
   * Update the data contained in the buffer array; this is required for the
   * new data to be rendered
   * @param {import("./Buffer").default} buffer Buffer.
   */
  flushBufferData(buffer) {
    const gl = this.gl_;
    this.bindBuffer(buffer);
    gl.bufferData(buffer.getType(), buffer.getArray(), buffer.getUsage());
  }

  /**
   * @param {import("./Buffer.js").default} buf Buffer.
   */
  deleteBuffer(buf) {
    const gl = this.gl_;
    const bufferKey = getUid(buf);
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    if (bufferCacheEntry && !gl.isContextLost()) {
      gl.deleteBuffer(bufferCacheEntry.webGlBuffer);
    }
    delete this.bufferCache_[bufferKey];
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    const canvas = this.gl_.canvas;
    canvas.removeEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_,
    );
    canvas.removeEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_,
    );

    releaseCanvas(this.canvasCacheKey_);

    delete this.gl_;
  }

  /**
   * Clear the buffer & set the viewport to draw.
   * Post process passes will be initialized here, the first one being bound as a render target for
   * subsequent draw calls.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
   * @param {boolean} [enableDepth] If true, enables depth testing.
   */
  prepareDraw(frameState, disableAlphaBlend, enableDepth) {
    const gl = this.gl_;
    const canvas = this.getCanvas();
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;

    if (
      canvas.width !== size[0] * pixelRatio ||
      canvas.height !== size[1] * pixelRatio
    ) {
      canvas.width = size[0] * pixelRatio;
      canvas.height = size[1] * pixelRatio;
      canvas.style.width = size[0] + 'px';
      canvas.style.height = size[1] + 'px';
    }

    // loop backwards in post processes list
    for (let i = this.postProcessPasses_.length - 1; i >= 0; i--) {
      this.postProcessPasses_[i].init(frameState);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.depthRange(0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
    if (enableDepth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  /**
   * Prepare a program to use a texture.
   * @param {WebGLTexture} texture The texture.
   * @param {number} slot The texture slot.
   * @param {string} uniformName The corresponding uniform name.
   */
  bindTexture(texture, slot, uniformName) {
    const gl = this.gl_;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.getUniformLocation(uniformName), slot);
  }

  /**
   * Clear the render target & bind it for future draw operations.
   * This is similar to `prepareDraw`, only post processes will not be applied.
   * Note: the whole viewport will be drawn to the render target, regardless of its size.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {import("./RenderTarget.js").default} renderTarget Render target to draw to
   * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
   * @param {boolean} [enableDepth] If true, enables depth testing.
   */
  prepareDrawToRenderTarget(
    frameState,
    renderTarget,
    disableAlphaBlend,
    enableDepth,
  ) {
    const gl = this.gl_;
    const size = renderTarget.getSize();

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.getFramebuffer());
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderTarget.getDepthbuffer());
    gl.viewport(0, 0, size[0], size[1]);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.getTexture());
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.depthRange(0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
    if (enableDepth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  /**
   * Execute a draw call based on the currently bound program, texture, buffers, attributes.
   * @param {number} start Start index.
   * @param {number} end End index.
   */
  drawElements(start, end) {
    const gl = this.gl_;
    this.getExtension('OES_element_index_uint');

    const elementType = gl.UNSIGNED_INT;
    const elementSize = 4;

    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(gl.TRIANGLES, numItems, elementType, offsetInBytes);
  }

  /**
   * Apply the successive post process passes which will eventually render to the actual canvas.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [preCompose] Called before composing.
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [postCompose] Called before composing.
   */
  finalizeDraw(frameState, preCompose, postCompose) {
    // apply post processes using the next one as target
    for (let i = 0, ii = this.postProcessPasses_.length; i < ii; i++) {
      if (i === ii - 1) {
        this.postProcessPasses_[i].apply(
          frameState,
          null,
          preCompose,
          postCompose,
        );
      } else {
        this.postProcessPasses_[i].apply(
          frameState,
          this.postProcessPasses_[i + 1],
        );
      }
    }
  }

  /**
   * @return {HTMLCanvasElement} Canvas.
   */
  getCanvas() {
    return /** @type {HTMLCanvasElement} */ (this.gl_.canvas);
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   */
  getGL() {
    return this.gl_;
  }

  /**
   * Sets the default matrix uniforms for a given frame state. This is called internally in `prepareDraw`.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  applyFrameState(frameState) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const pixelRatio = frameState.pixelRatio;

    this.setUniformFloatValue(
      DefaultUniform.TIME,
      (Date.now() - this.startTime_) * 0.001,
    );
    this.setUniformFloatValue(DefaultUniform.ZOOM, frameState.viewState.zoom);
    this.setUniformFloatValue(
      DefaultUniform.RESOLUTION,
      frameState.viewState.resolution,
    );
    this.setUniformFloatValue(DefaultUniform.PIXEL_RATIO, pixelRatio);
    this.setUniformFloatVec2(DefaultUniform.VIEWPORT_SIZE_PX, [
      size[0],
      size[1],
    ]);
    this.setUniformFloatValue(DefaultUniform.ROTATION, rotation);
  }

  /**
   * Sets the `u_hitDetection` uniform.
   * @param {boolean} enabled Whether to enable the hit detection code path
   */
  applyHitDetectionUniform(enabled) {
    const loc = this.getUniformLocation(DefaultUniform.HIT_DETECTION);
    this.getGL().uniform1i(loc, enabled ? 1 : 0);

    // hit detection uses a fixed pixel ratio
    if (enabled) {
      this.setUniformFloatValue(DefaultUniform.PIXEL_RATIO, 0.5);
    }
  }

  /**
   * Sets the custom uniforms based on what was given in the constructor. This is called internally in `prepareDraw`.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  applyUniforms(frameState) {
    const gl = this.gl_;

    let value;
    let textureSlot = 0;
    this.uniforms_.forEach((uniform) => {
      value =
        typeof uniform.value === 'function'
          ? uniform.value(frameState)
          : uniform.value;

      // apply value based on type
      if (
        value instanceof HTMLCanvasElement ||
        value instanceof HTMLImageElement ||
        value instanceof ImageData ||
        value instanceof WebGLTexture
      ) {
        // create a texture & put data
        if (value instanceof WebGLTexture && !uniform.texture) {
          uniform.prevValue = undefined;
          uniform.texture = value;
        } else if (!uniform.texture) {
          uniform.prevValue = undefined;
          uniform.texture = gl.createTexture();
        }
        this.bindTexture(uniform.texture, textureSlot, uniform.name);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const imageReady =
          !(value instanceof HTMLImageElement) ||
          /** @type {HTMLImageElement} */ (value).complete;
        if (
          !(value instanceof WebGLTexture) &&
          imageReady &&
          uniform.prevValue !== value
        ) {
          uniform.prevValue = value;
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            value,
          );
        }
        textureSlot++;
      } else if (Array.isArray(value) && value.length === 6) {
        this.setUniformMatrixValue(
          uniform.name,
          fromTransform(this.tmpMat4_, value),
        );
      } else if (Array.isArray(value) && value.length <= 4) {
        switch (value.length) {
          case 2:
            gl.uniform2f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1],
            );
            return;
          case 3:
            gl.uniform3f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1],
              value[2],
            );
            return;
          case 4:
            gl.uniform4f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1],
              value[2],
              value[3],
            );
            return;
          default:
            return;
        }
      } else if (typeof value === 'number') {
        gl.uniform1f(this.getUniformLocation(uniform.name), value);
      }
    });
  }

  /**
   * Set up a program for use. The program will be set as the current one. Then, the uniforms used
   * in the program will be set based on the current frame state and the helper configuration.
   * @param {WebGLProgram} program Program.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  useProgram(program, frameState) {
    const gl = this.gl_;
    gl.useProgram(program);
    this.currentProgram_ = program;
    this.applyFrameState(frameState);
    this.applyUniforms(frameState);
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
    const gl = this.gl_;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  /**
   * Create a program for a vertex and fragment shader.  Throws if shader compilation fails.
   * @param {string} fragmentShaderSource Fragment shader source.
   * @param {string} vertexShaderSource Vertex shader source.
   * @return {WebGLProgram} Program
   */
  getProgram(fragmentShaderSource, vertexShaderSource) {
    const gl = this.gl_;

    const fragmentShader = this.compileShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER,
    );

    const vertexShader = this.compileShader(
      vertexShaderSource,
      gl.VERTEX_SHADER,
    );

    const program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const message = `Fragment shader compilation failed: ${gl.getShaderInfoLog(
        fragmentShader,
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(fragmentShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const message = `Vertex shader compilation failed: ${gl.getShaderInfoLog(
        vertexShader,
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(vertexShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = `GL program linking failed: ${gl.getProgramInfoLog(
        program,
      )}`;
      throw new Error(message);
    }

    return program;
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Uniform name
   * @return {WebGLUniformLocation} uniformLocation
   */
  getUniformLocation(name) {
    const programUid = getUid(this.currentProgram_);
    if (this.uniformLocationsByProgram_[programUid] === undefined) {
      this.uniformLocationsByProgram_[programUid] = {};
    }
    if (this.uniformLocationsByProgram_[programUid][name] === undefined) {
      this.uniformLocationsByProgram_[programUid][name] =
        this.gl_.getUniformLocation(this.currentProgram_, name);
    }
    return this.uniformLocationsByProgram_[programUid][name];
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Attribute name
   * @return {number} attribLocation
   */
  getAttributeLocation(name) {
    const programUid = getUid(this.currentProgram_);
    if (this.attribLocationsByProgram_[programUid] === undefined) {
      this.attribLocationsByProgram_[programUid] = {};
    }
    if (this.attribLocationsByProgram_[programUid][name] === undefined) {
      this.attribLocationsByProgram_[programUid][name] =
        this.gl_.getAttribLocation(this.currentProgram_, name);
    }
    return this.attribLocationsByProgram_[programUid][name];
  }

  /**
   * Sets the given transform to apply the rotation/translation/scaling of the given frame state.
   * The resulting transform can be used to convert world space coordinates to view coordinates in the [-1, 1] range.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("../transform").Transform} transform Transform to update.
   * @return {import("../transform").Transform} The updated transform object.
   */
  makeProjectionTransform(frameState, transform) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const resolution = frameState.viewState.resolution;
    const center = frameState.viewState.center;
    composeTransform(
      transform,
      0,
      0,
      2 / (resolution * size[0]),
      2 / (resolution * size[1]),
      -rotation,
      -center[0],
      -center[1],
    );
    return transform;
  }

  /**
   * Give a value for a standard float uniform
   * @param {string} uniform Uniform name
   * @param {number} value Value
   */
  setUniformFloatValue(uniform, value) {
    this.gl_.uniform1f(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a vec2 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Array of length 4.
   */
  setUniformFloatVec2(uniform, value) {
    this.gl_.uniform2fv(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a vec4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Array of length 4.
   */
  setUniformFloatVec4(uniform, value) {
    this.gl_.uniform4fv(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a standard matrix4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Matrix value
   */
  setUniformMatrixValue(uniform, value) {
    this.gl_.uniformMatrix4fv(this.getUniformLocation(uniform), false, value);
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
    // the attribute has not been found in the shaders or is not used; do not enable it
    if (location < 0) {
      return;
    }
    this.gl_.enableVertexAttribArray(location);
    this.gl_.vertexAttribPointer(location, size, type, false, stride, offset);
  }

  /**
   * Will enable the following attributes to be read from the currently bound buffer,
   * i.e. tell the GPU where to read the different attributes in the buffer. An error in the
   * size/type/order of attributes will most likely break the rendering and throw a WebGL exception.
   * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
   */
  enableAttributes(attributes) {
    const stride = computeAttributesStride(attributes);
    let offset = 0;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      this.enableAttributeArray_(
        attr.name,
        attr.size,
        attr.type || FLOAT,
        stride,
        offset,
      );
      offset += attr.size * getByteSizeFromType(attr.type);
    }
  }

  /**
   * WebGL context was lost
   * @param {WebGLContextEvent} event The context loss event.
   * @private
   */
  handleWebGLContextLost(event) {
    clear(this.bufferCache_);
    this.currentProgram_ = null;

    event.preventDefault();
  }

  /**
   * WebGL context was restored
   * @private
   */
  handleWebGLContextRestored() {
    this.needsToBeRecreated_ = true;
  }

  /**
   * Returns whether this helper needs to be recreated, as the context was lost and then restored.
   * @return {boolean} Whether this helper needs to be recreated.
   */
  needsToBeRecreated() {
    return this.needsToBeRecreated_;
  }

  /**
   * Will create or reuse a given webgl texture and apply the given size. If no image data
   * specified, the texture will be empty, otherwise image data will be used and the `size`
   * parameter will be ignored.
   * Note: wrap parameters are set to clamp to edge, min filter is set to linear.
   * @param {Array<number>} size Expected size of the texture
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement} [data] Image data/object to bind to the texture
   * @param {WebGLTexture} [texture] Existing texture to reuse
   * @return {WebGLTexture} The generated texture
   */
  createTexture(size, data, texture) {
    const gl = this.gl_;
    texture = texture || gl.createTexture();

    // set params & size
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (data) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, data);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        size[0],
        size[1],
        border,
        format,
        type,
        null,
      );
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
 * @return {number} Stride, ie amount of values for each vertex in the vertex buffer
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
 * @return {number} The size in bytes
 */
function getByteSizeFromType(type) {
  switch (type) {
    case AttributeType.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case AttributeType.FLOAT:
    default:
      return Float32Array.BYTES_PER_ELEMENT;
  }
}

export default WebGLHelper;
