/**
 * @module ol/renderer/webgl/Layer
 */
import {inherits} from '../../util.js';
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

/**
 * @constructor
 * @abstract
 * @extends {module:ol/renderer/Layer}
 * @param {module:ol/renderer/webgl/Map} mapRenderer Map renderer.
 * @param {module:ol/layer/Layer} layer Layer.
 */
const WebGLLayerRenderer = function(mapRenderer, layer) {

  LayerRenderer.call(this, layer);

  /**
   * @protected
   * @type {module:ol/renderer/webgl/Map}
   */
  this.mapRenderer = mapRenderer;

  /**
   * @private
   * @type {module:ol/webgl/Buffer}
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
   * @type {module:ol/transform~Transform}
   */
  this.texCoordMatrix = createTransform();

  /**
   * @protected
   * @type {module:ol/transform~Transform}
   */
  this.projectionMatrix = createTransform();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.tmpMat4_ = create();

  /**
   * @private
   * @type {module:ol/renderer/webgl/defaultmapshader/Locations}
   */
  this.defaultLocations_ = null;

};

inherits(WebGLLayerRenderer, LayerRenderer);


/**
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {number} framebufferDimension Framebuffer dimension.
 * @protected
 */
WebGLLayerRenderer.prototype.bindFramebuffer = function(frameState, framebufferDimension) {

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
      /** @type {module:ol/PluggableMap~PostRenderFunction} */ (postRenderFunction)
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

};


/**
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {module:ol/layer/Layer~State} layerState Layer state.
 * @param {module:ol/webgl/Context} context Context.
 */
WebGLLayerRenderer.prototype.composeFrame = function(frameState, layerState, context) {

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
};


/**
 * @param {module:ol/render/EventType} type Event type.
 * @param {module:ol/webgl/Context} context WebGL context.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @private
 */
WebGLLayerRenderer.prototype.dispatchComposeEvent_ = function(type, context, frameState) {
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
};


/**
 * @return {!module:ol/transform~Transform} Matrix.
 */
WebGLLayerRenderer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix;
};


/**
 * @return {WebGLTexture} Texture.
 */
WebGLLayerRenderer.prototype.getTexture = function() {
  return this.texture;
};


/**
 * @return {!module:ol/transform~Transform} Matrix.
 */
WebGLLayerRenderer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix;
};


/**
 * Handle webglcontextlost.
 */
WebGLLayerRenderer.prototype.handleWebGLContextLost = function() {
  this.texture = null;
  this.framebuffer = null;
  this.framebufferDimension = undefined;
};


/**
 * @abstract
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {module:ol/layer/Layer~State} layerState Layer state.
 * @param {module:ol/webgl/Context} context Context.
 * @return {boolean} whether composeFrame should be called.
 */
WebGLLayerRenderer.prototype.prepareFrame = function(frameState, layerState, context) {};


/**
 * @abstract
 * @param {module:ol~Pixel} pixel Pixel.
 * @param {module:ol/PluggableMap~FrameState} frameState FrameState.
 * @param {function(this: S, module:ol/layer/Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
WebGLLayerRenderer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {};
export default WebGLLayerRenderer;
