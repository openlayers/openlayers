goog.provide('ol.renderer.webgl.Layer');

goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.color.Matrix');
goog.require('ol.layer.Layer');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.webgl.Immediate');
goog.require('ol.renderer.Layer');
goog.require('ol.renderer.webgl.map.shader.Color');
goog.require('ol.renderer.webgl.map.shader.Default');
goog.require('ol.structs.Buffer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.webgl.Layer = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * @private
   * @type {ol.structs.Buffer}
   */
  this.arrayBuffer_ = new ol.structs.Buffer([
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
   * @type {!goog.vec.Mat4.Number}
   */
  this.texCoordMatrix = goog.vec.Mat4.createNumber();

  /**
   * @protected
   * @type {!goog.vec.Mat4.Number}
   */
  this.projectionMatrix = goog.vec.Mat4.createNumberIdentity();

  /**
   * @private
   * @type {ol.color.Matrix}
   */
  this.colorMatrix_ = new ol.color.Matrix();

  /**
   * @private
   * @type {ol.renderer.webgl.map.shader.Color.Locations}
   */
  this.colorLocations_ = null;

  /**
   * @private
   * @type {ol.renderer.webgl.map.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

};
goog.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} framebufferDimension Framebuffer dimension.
 * @protected
 */
ol.renderer.webgl.Layer.prototype.bindFramebuffer =
    function(frameState, framebufferDimension) {

  var mapRenderer = this.getWebGLMapRenderer();
  var gl = mapRenderer.getGL();

  if (!goog.isDef(this.framebufferDimension) ||
      this.framebufferDimension != framebufferDimension) {

    frameState.postRenderFunctions.push(
        goog.partial(
            /**
             * @param {WebGLRenderingContext} gl GL.
             * @param {WebGLFramebuffer} framebuffer Framebuffer.
             * @param {WebGLTexture} texture Texture.
             */
            function(gl, framebuffer, texture) {
              if (!gl.isContextLost()) {
                gl.deleteFramebuffer(framebuffer);
                gl.deleteTexture(texture);
              }
            }, gl, this.framebuffer, this.texture));

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA,
        framebufferDimension, framebufferDimension, 0, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.LINEAR);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);

    this.texture = texture;
    this.framebuffer = framebuffer;
    this.framebufferDimension = framebufferDimension;

  } else {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer);
  }

};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @param {ol.webgl.Context} context Context.
 */
ol.renderer.webgl.Layer.prototype.composeFrame =
    function(frameState, layerState, context) {

  this.dispatchComposeEvent_(
      ol.render.EventType.PRECOMPOSE, context, frameState);

  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_);

  var gl = context.getGL();

  var useColor =
      layerState.brightness ||
      layerState.contrast != 1 ||
      layerState.hue ||
      layerState.saturation != 1;

  var fragmentShader, vertexShader;
  if (useColor) {
    fragmentShader = ol.renderer.webgl.map.shader.ColorFragment.getInstance();
    vertexShader = ol.renderer.webgl.map.shader.ColorVertex.getInstance();
  } else {
    fragmentShader =
        ol.renderer.webgl.map.shader.DefaultFragment.getInstance();
    vertexShader = ol.renderer.webgl.map.shader.DefaultVertex.getInstance();
  }

  var program = context.getProgram(fragmentShader, vertexShader);

  // FIXME colorLocations_ and defaultLocations_ should be shared somehow
  var locations;
  if (useColor) {
    if (goog.isNull(this.colorLocations_)) {
      locations =
          new ol.renderer.webgl.map.shader.Color.Locations(gl, program);
      this.colorLocations_ = locations;
    } else {
      locations = this.colorLocations_;
    }
  } else {
    if (goog.isNull(this.defaultLocations_)) {
      locations =
          new ol.renderer.webgl.map.shader.Default.Locations(gl, program);
      this.defaultLocations_ = locations;
    } else {
      locations = this.defaultLocations_;
    }
  }

  if (context.useProgram(program)) {
    gl.enableVertexAttribArray(locations.a_position);
    gl.vertexAttribPointer(
        locations.a_position, 2, goog.webgl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(locations.a_texCoord);
    gl.vertexAttribPointer(
        locations.a_texCoord, 2, goog.webgl.FLOAT, false, 16, 8);
    gl.uniform1i(locations.u_texture, 0);
  }

  gl.uniformMatrix4fv(
      locations.u_texCoordMatrix, false, this.getTexCoordMatrix());
  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      this.getProjectionMatrix());
  if (useColor) {
    gl.uniformMatrix4fv(locations.u_colorMatrix, false,
        this.colorMatrix_.getMatrix(
            layerState.brightness,
            layerState.contrast,
            layerState.hue,
            layerState.saturation
        ));
  }
  gl.uniform1f(locations.u_opacity, layerState.opacity);
  gl.bindTexture(goog.webgl.TEXTURE_2D, this.getTexture());
  gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);

  this.dispatchComposeEvent_(
      ol.render.EventType.POSTCOMPOSE, context, frameState);

};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {ol.webgl.Context} context WebGL context.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.webgl.Layer.prototype.dispatchComposeEvent_ =
    function(type, context, frameState) {
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var render = new ol.render.webgl.Immediate(context, frameState.pixelRatio);
    var composeEvent = new ol.render.Event(
        type, layer, render, null, frameState, null, context);
    layer.dispatchEvent(composeEvent);
  }
};


/**
 * @protected
 * @return {ol.renderer.webgl.Map} MapRenderer.
 */
ol.renderer.webgl.Layer.prototype.getWebGLMapRenderer = function() {
  return /** @type {ol.renderer.webgl.Map} */ (this.getMapRenderer());
};


/**
 * @return {!goog.vec.Mat4.Number} Matrix.
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
 * @return {!goog.vec.Mat4.Number} Matrix.
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
