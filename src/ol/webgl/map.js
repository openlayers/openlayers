goog.provide('ol.webgl.Map');

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol.Layer');
goog.require('ol.Map');
goog.require('ol.TileLayer');
goog.require('ol.webgl.TileLayerRenderer');


/**
 * @enum {string}
 */
ol.webgl.WebGLContextEventType = {
  LOST: 'webglcontextlost',
  RESTORED: 'webglcontextrestored'
};



/**
 * @constructor
 * @extends {ol.Map}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.webgl.Map = function(target, opt_values) {

  goog.base(this, target);

  /**
   * @private
   * @type {Element}
   */
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = target.clientHeight;
  this.canvas_.width = target.clientWidth;
  this.canvas_.style.overflow = 'hidden';
  target.appendChild(this.canvas_);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = this.canvas_.getContext('experimental-webgl', {
    alpha: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: false
  });
  goog.asserts.assert(!goog.isNull(this.gl_));

  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST,
      this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED,
      this.handleWebGLContextRestored, false, this);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

  this.handleViewportResize();
  this.handleWebGLContextRestored();

};
goog.inherits(ol.webgl.Map, ol.Map);


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.createLayerRenderer = function(layer) {
  var gl = this.getGL();
  if (gl.isContextLost()) {
    return null;
  }
  if (layer instanceof ol.TileLayer) {
    return new ol.webgl.TileLayerRenderer(this, layer);
  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.disposeInternal = function() {
  this.forEachLayerRenderer(goog.dispose);
  this.layerRenderers = {};
  goog.base(this, 'disposeInternal');
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webgl.Map.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleCenterChanged = function() {
  goog.base(this, 'handleCenterChanged');
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleLayerAdd = function(layer) {
  goog.base(this, 'handleLayerAdd', layer);
  if (layer.getVisible()) {
    this.redraw_();
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleLayerRemove = function(layer) {
  goog.base(this, 'handleLayerRemove', layer);
  if (layer.getVisible()) {
    this.redraw_();
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleResolutionChanged = function() {
  goog.base(this, 'handleResolutionChanged');
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
  var size = this.getSize();
  if (!goog.isDef(size)) {
    return;
  }
  this.canvas_.width = size.width;
  this.canvas_.height = size.height;
  var gl = this.gl_;
  if (!goog.isNull(gl)) {
    gl.viewport(0, 0, size.width, size.height);
    this.redraw_();
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  event.preventDefault();
  this.forEachLayerRenderer(goog.dispose);
  this.layerRenderers = {};
};


/**
 * @protected
 */
ol.webgl.Map.prototype.handleWebGLContextRestored = function() {
  var gl = this.gl_;
  gl.clearColor(1, 0, 0, 1);
  gl.disable(goog.webgl.CULL_FACE);
  gl.disable(goog.webgl.SCISSOR_TEST);
  var layers = this.getLayers();
  layers.forEach(function(layer) {
    var layerRenderer = this.createLayerRenderer(layer);
    var key = goog.getUid(layer);
    goog.asserts.assert(!(key in this.layerRenderers));
    this.layerRenderers[key] = layerRenderer;
  }, this);
};


/**
 * @private
 */
ol.webgl.Map.prototype.redraw_ = function() {

  var gl = this.getGL();

  gl.clear(goog.webgl.COLOR_BUFFER_BIT);

};
