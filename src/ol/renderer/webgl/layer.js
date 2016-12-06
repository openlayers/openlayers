goog.provide('ol.renderer.webgl.Layer');

goog.require('ol');
goog.require('ol.render.Event');
goog.require('ol.render.webgl.Immediate');
goog.require('ol.renderer.Layer');
goog.require('ol.renderer.webgl.defaultmapshader');
goog.require('ol.transform');
goog.require('ol.vec.Mat4');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');
goog.require('ol.webgl.Context');


/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.webgl.Layer = function(mapRenderer, layer) {

  ol.renderer.Layer.call(this, layer);

  /**
   * @protected
   * @type {ol.renderer.webgl.Map}
   */
  this.mapRenderer = mapRenderer;

  /**
   * @private
   * @type {ol.webgl.Buffer}
   */
  this.arrayBuffer_ = new ol.webgl.Buffer([
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
   * @type {ol.Transform}
   */
  this.texCoordMatrix = ol.transform.create();

  /**
   * @protected
   * @type {ol.Transform}
   */
  this.projectionMatrix = ol.transform.create();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.tmpMat4_ = ol.vec.Mat4.create();

  /**
   * @private
   * @type {ol.renderer.webgl.defaultmapshader.Locations}
   */
  this.defaultLocations_ = null;

};
ol.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} framebufferDimension Framebuffer dimension.
 * @protected
 */
ol.renderer.webgl.Layer.prototype.bindFramebuffer = function(frameState, framebufferDimension) {

  var gl = this.mapRenderer.getGL();

  if (this.framebufferDimension === undefined ||
      this.framebufferDimension != framebufferDimension) {
    /**
     * @param {WebGLRenderingContext} gl GL.
     * @param {WebGLFramebuffer} framebuffer Framebuffer.
     * @param {WebGLTexture} texture Texture.
     */
    var postRenderFunction = function(gl, framebuffer, texture) {
      if (!gl.isContextLost()) {
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
      }
    }.bind(null, gl, this.framebuffer, this.texture);

    frameState.postRenderFunctions.push(
      /** @type {ol.PostRenderFunction} */ (postRenderFunction)
    );

    var texture = ol.webgl.Context.createEmptyTexture(
        gl, framebufferDimension, framebufferDimension);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(ol.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(ol.webgl.FRAMEBUFFER,
        ol.webgl.COLOR_ATTACHMENT0, ol.webgl.TEXTURE_2D, texture, 0);

    this.texture = texture;
    this.framebuffer = framebuffer;
    this.framebufferDimension = framebufferDimension;

  } else {
    gl.bindFramebuffer(ol.webgl.FRAMEBUFFER, this.framebuffer);
  }

};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {ol.webgl.Context} context Context.
 */
ol.renderer.webgl.Layer.prototype.composeFrame = function(frameState, layerState, context) {

  this.dispatchComposeEvent_(
      ol.render.Event.Type.PRECOMPOSE, context, frameState);

  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.arrayBuffer_);

  var gl = context.getGL();

  var fragmentShader = ol.renderer.webgl.defaultmapshader.fragment;
  var vertexShader = ol.renderer.webgl.defaultmapshader.vertex;

  var program = context.getProgram(fragmentShader, vertexShader);

  var locations;
  if (!this.defaultLocations_) {
    locations =
        new ol.renderer.webgl.defaultmapshader.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  if (context.useProgram(program)) {
    gl.enableVertexAttribArray(locations.a_position);
    gl.vertexAttribPointer(
        locations.a_position, 2, ol.webgl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(locations.a_texCoord);
    gl.vertexAttribPointer(
        locations.a_texCoord, 2, ol.webgl.FLOAT, false, 16, 8);
    gl.uniform1i(locations.u_texture, 0);
  }

  gl.uniformMatrix4fv(locations.u_texCoordMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, this.getTexCoordMatrix()));
  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, this.getProjectionMatrix()));
  gl.uniform1f(locations.u_opacity, layerState.opacity);
  gl.bindTexture(ol.webgl.TEXTURE_2D, this.getTexture());
  gl.drawArrays(ol.webgl.TRIANGLE_STRIP, 0, 4);

  this.dispatchComposeEvent_(
      ol.render.Event.Type.POSTCOMPOSE, context, frameState);

};


/**
 * @param {ol.render.Event.Type} type Event type.
 * @param {ol.webgl.Context} context WebGL context.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Layer.prototype.dispatchComposeEvent_ = function(type, context, frameState) {
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var viewState = frameState.viewState;
    var resolution = viewState.resolution;
    var pixelRatio = frameState.pixelRatio;
    var extent = frameState.extent;
    var center = viewState.center;
    var rotation = viewState.rotation;
    var size = frameState.size;

    var render = new ol.render.webgl.Immediate(
        context, center, resolution, rotation, size, extent, pixelRatio);
    var composeEvent = new ol.render.Event(
        type, render, frameState, null, context);
    layer.dispatchEvent(composeEvent);
  }
};


/**
 * @return {!ol.Transform} Matrix.
 */
ol.renderer.webgl.Layer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix;
};


/**
 * @return {WebGLTexture} Texture.
 */
ol.renderer.webgl.Layer.prototype.getTexture = function() {
  return this.texture;
};


/**
 * @return {!ol.Transform} Matrix.
 */
ol.renderer.webgl.Layer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix;
};


/**
 * Handle webglcontextlost.
 */
ol.renderer.webgl.Layer.prototype.handleWebGLContextLost = function() {
  this.texture = null;
  this.framebuffer = null;
  this.framebufferDimension = undefined;
};


/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {ol.webgl.Context} context Context.
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.webgl.Layer.prototype.prepareFrame = function(frameState, layerState, context) {};


/**
 * @abstract
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.webgl.Layer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {};
