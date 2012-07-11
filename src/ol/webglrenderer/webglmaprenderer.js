goog.provide('ol.WebGLMapRenderer');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol.Layer');
goog.require('ol.MapRenderer');
goog.require('ol.TileStore');
goog.require('ol.webglrenderer.IGLObject');



/**
 * @constructor
 * @extends {ol.MapRenderer}
 * @implements {ol.webglrenderer.IGLObject}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.WebGLMapRenderer = function(target, opt_values) {

  goog.base(this, target);

  /**
   * @private
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement('canvas');
  target.appendChild(this.canvas_);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = null;

  /** @type {WebGLRenderingContext} */
  var gl = this.canvas_.getContext('experimental-webgl', {
    alpha: false,
    depth: false,
    antialias: true,
    stencil: false,
    preserveDrawingBuffer: false
  });
  goog.asserts.assert(!goog.isNull(gl));
  this.setGL(gl);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.WebGLMapRenderer, ol.MapRenderer);


/**
 * @return {boolean} Is supported.
 */
ol.WebGLMapRenderer.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.createLayerRenderer = function(layer) {
  var store = layer.getStore();
  if (layer instanceof ol.TileStore) {
    // FIXME create WebGLTileLayerRenderer
  }
  return null;
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.disposeInternal = function() {
  this.setGL(null);
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.getGL = function() {
  var gl = this.gl_;
  goog.asserts.assert(!goog.isNull(gl));
  return gl;
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.handleCameraPropertyChanged = function() {
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.handleLayerAdd = function(layer) {
  goog.base(this, 'handleLayerAdd', layer);
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.handleLayerRemove = function(layer) {
  goog.base(this, 'handleLayerRemove', layer);
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.handleTargetResize = function(event) {
  goog.base(this, 'handleTargetResize', event);
  this.updateSize_();
};


/**
 * @private
 */
ol.WebGLMapRenderer.prototype.redraw_ = function() {

  var gl = this.getGL();

  gl.clear(goog.webgl.COLOR_BUFFER_BIT);

};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl_)) {
    this.gl_ = null;
  }
  this.gl_ = gl;
  if (!goog.isNull(gl)) {
    gl.clearColor(1, 0, 0, 1);
    gl.disable(goog.webgl.CULL_FACE);
    gl.disable(goog.webgl.DEPTH_TEST);
    gl.disable(goog.webgl.SCISSOR_TEST);
    this.updateSize_();
    this.redraw_();
  }
};


/**
 * @private
 */
ol.WebGLMapRenderer.prototype.updateSize_ = function() {
  var size = this.getSize();
  this.canvas_.width = size.width;
  this.canvas_.height = size.height;
  var gl = this.gl_;
  if (!goog.isNull(gl)) {
    gl.viewport(0, 0, size.width, size.height);
    this.redraw_();
  }
};
