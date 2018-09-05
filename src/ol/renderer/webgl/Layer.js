/**
 * @module ol/renderer/webgl/Layer
 */
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import WebGLImmediateRenderer from '../../render/webgl/Immediate.js';
import LayerRenderer from '../Layer.js';
import {fragment, vertex} from '../webgl/defaultmapshader.js';
import Locations from '../webgl/defaultmapshader/Locations.js';
import {create as createTransform} from '../../transform.js';
import {create, fromTransform} from '../../vec/mat4.js';
import {ARRAY_BUFFER, FRAMEBUFFER, FLOAT, TEXTURE_2D,
  TRIANGLE_STRIP, COLOR_ATTACHMENT0} from '../../webgl.js';
import WebGLBuffer from '../../webgl/Buffer.js';
import {createEmptyTexture} from '../../webgl/Context.js';

class WebGLLayerRenderer extends LayerRenderer {

  /**
   * @param {import("./Map.js").default} mapRenderer Map renderer.
   * @param {import("../../layer/Layer.js").default} layer Layer.
   */
  constructor(mapRenderer, layer) {

    super(layer);

    /**
     * @protected
     * @type {import("./Map.js").default}
     */
    this.mapRenderer = mapRenderer;

    /**
     * @private
     * @type {import("../../webgl/Buffer.js").default}
     */
    this.arrayBuffer_ = new WebGLBuffer([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1
    ]);

    /**
     * @protected
     * @type {WebGLTexture}
     */
    this.texture = null;

    /**
     * @protected
     * @type {WebGLFramebuffer}
     */
    this.framebuffer = null;

    /**
     * @protected
     * @type {number|undefined}
     */
    this.framebufferDimension = undefined;

    /**
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.texCoordMatrix = createTransform();

    /**
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.projectionMatrix = createTransform();

    /**
     * @type {Array<number>}
     * @private
     */
    this.tmpMat4_ = create();

    /**
     * @private
     * @type {import("./defaultmapshader/Locations.js").default}
     */
    this.defaultLocations_ = null;

  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} framebufferDimension Framebuffer dimension.
   * @protected
   */
  bindFramebuffer(frameState, framebufferDimension) {

    const gl = this.mapRenderer.getGL();

    if (this.framebufferDimension === undefined ||
        this.framebufferDimension != framebufferDimension) {
      /**
       * @param {WebGLRenderingContext} gl GL.
       * @param {WebGLFramebuffer} framebuffer Framebuffer.
       * @param {WebGLTexture} texture Texture.
       */
      const postRenderFunction = function(gl, framebuffer, texture) {
        if (!gl.isContextLost()) {
          gl.deleteFramebuffer(framebuffer);
          gl.deleteTexture(texture);
        }
      }.bind(null, gl, this.framebuffer, this.texture);

      frameState.postRenderFunctions.push(
        /** @type {import("../../PluggableMap.js").PostRenderFunction} */ (postRenderFunction)
      );

      const texture = createEmptyTexture(
        gl, framebufferDimension, framebufferDimension);

      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(FRAMEBUFFER,
        COLOR_ATTACHMENT0, TEXTURE_2D, texture, 0);

      this.texture = texture;
      this.framebuffer = framebuffer;
      this.framebufferDimension = framebufferDimension;

    } else {
      gl.bindFramebuffer(FRAMEBUFFER, this.framebuffer);
    }

  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {import("../../webgl/Context.js").default} context Context.
   */
  composeFrame(frameState, layerState, context) {

    this.dispatchComposeEvent_(RenderEventType.PRECOMPOSE, context, frameState);

    context.bindBuffer(ARRAY_BUFFER, this.arrayBuffer_);

    const gl = context.getGL();

    const program = context.getProgram(fragment, vertex);

    let locations;
    if (!this.defaultLocations_) {
      locations = new Locations(gl, program);
      this.defaultLocations_ = locations;
    } else {
      locations = this.defaultLocations_;
    }

    if (context.useProgram(program)) {
      gl.enableVertexAttribArray(locations.a_position);
      gl.vertexAttribPointer(
        locations.a_position, 2, FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(locations.a_texCoord);
      gl.vertexAttribPointer(
        locations.a_texCoord, 2, FLOAT, false, 16, 8);
      gl.uniform1i(locations.u_texture, 0);
    }

    gl.uniformMatrix4fv(locations.u_texCoordMatrix, false,
      fromTransform(this.tmpMat4_, this.getTexCoordMatrix()));
    gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      fromTransform(this.tmpMat4_, this.getProjectionMatrix()));
    gl.uniform1f(locations.u_opacity, layerState.opacity);
    gl.bindTexture(TEXTURE_2D, this.getTexture());
    gl.drawArrays(TRIANGLE_STRIP, 0, 4);

    this.dispatchComposeEvent_(RenderEventType.POSTCOMPOSE, context, frameState);
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {import("../../webgl/Context.js").default} context WebGL context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchComposeEvent_(type, context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const viewState = frameState.viewState;
      const resolution = viewState.resolution;
      const pixelRatio = frameState.pixelRatio;
      const extent = frameState.extent;
      const center = viewState.center;
      const rotation = viewState.rotation;
      const size = frameState.size;

      const render = new WebGLImmediateRenderer(
        context, center, resolution, rotation, size, extent, pixelRatio);
      const composeEvent = new RenderEvent(
        type, render, frameState, null, context);
      layer.dispatchEvent(composeEvent);
    }
  }

  /**
   * @return {!import("../../transform.js").Transform} Matrix.
   */
  getTexCoordMatrix() {
    return this.texCoordMatrix;
  }

  /**
   * @return {WebGLTexture} Texture.
   */
  getTexture() {
    return this.texture;
  }

  /**
   * @return {!import("../../transform.js").Transform} Matrix.
   */
  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  /**
   * Handle webglcontextlost.
   */
  handleWebGLContextLost() {
    this.texture = null;
    this.framebuffer = null;
    this.framebufferDimension = undefined;
  }

  /**
   * @abstract
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @return {boolean} whether composeFrame should be called.
   */
  prepareFrame(frameState, layerState, context) {}

  /**
   * @abstract
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @param {import("../../PluggableMap.js").FrameState} frameState FrameState.
   * @param {function(this: S, import("../../layer/Layer.js").default, (Uint8ClampedArray|Uint8Array)): T} callback Layer
   *     callback.
   * @param {S} thisArg Value to use as `this` when executing `callback`.
   * @return {T|undefined} Callback result.
   * @template S,T,U
   */
  forEachLayerAtPixel(pixel, frameState, callback, thisArg) {}
}


export default WebGLLayerRenderer;
