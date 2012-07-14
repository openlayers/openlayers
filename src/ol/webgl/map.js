goog.provide('ol.webgl.Map');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('goog.webgl');
goog.require('ol.Layer');
goog.require('ol.Map');
goog.require('ol.TileStore');
goog.require('ol.webgl.IGLObject');
goog.require('ol.webgl.TileLayerRenderer');



/**
 * @constructor
 * @extends {ol.Map}
 * @implements {ol.webgl.IGLObject}
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
  this.gl_ = null;

  /** @type {WebGLRenderingContext} */
  var gl = this.canvas_.getContext('experimental-webgl', {
    alpha: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: false
  });
  goog.asserts.assert(!goog.isNull(gl));
  this.setGL(gl);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.webgl.Map, ol.Map);


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.createLayerRenderer = function(layer) {
  var store = layer.getStore();
  if (store instanceof ol.TileStore) {
    return new ol.webgl.TileLayerRenderer(layer, this.getGL());
  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.disposeInternal = function() {
  this.setGL(null);
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.getGL = function() {
  var gl = this.gl_;
  goog.asserts.assert(!goog.isNull(gl));
  return gl;
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
  this.redraw_();
};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.handleLayerRemove = function(layer) {
  goog.base(this, 'handleLayerRemove', layer);
  this.redraw_();
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
ol.webgl.Map.prototype.handleTargetResize = function(event) {
  goog.base(this, 'handleTargetResize', event);
  this.updateSize_();
};


/**
 * @private
 */
ol.webgl.Map.prototype.redraw_ = function() {

  var gl = this.getGL();

  gl.clear(goog.webgl.COLOR_BUFFER_BIT);

};


/**
 * @inheritDoc
 */
ol.webgl.Map.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl_)) {
    this.gl_ = null;
  }
  this.gl_ = gl;
  if (!goog.isNull(gl)) {
    gl.clearColor(1, 0, 0, 1);
    gl.disable(goog.webgl.CULL_FACE);
    gl.disable(goog.webgl.DEPTH_TEST);
    gl.disable(goog.webgl.SCISSOR_TEST);
    this.forEachLayerRenderer(function(layerRenderer) {
      layerRenderer.setGL(gl);
    });
    this.updateSize_();
    this.redraw_();
  }
};


/**
 * @private
 */
ol.webgl.Map.prototype.updateSize_ = function() {
  var size = this.getSize();
  this.canvas_.width = size.width;
  this.canvas_.height = size.height;
  var gl = this.gl_;
  if (!goog.isNull(gl)) {
    gl.viewport(0, 0, size.width, size.height);
    this.redraw_();
  }
};
