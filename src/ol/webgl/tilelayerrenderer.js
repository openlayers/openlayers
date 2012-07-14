goog.provide('ol.webgl.TileLayerRenderer');

goog.require('goog.events.EventType');
goog.require('ol.LayerRenderer');
goog.require('ol.webgl.IGLObject');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @implements {ol.webgl.IGLObject}
 * @param {ol.Layer} layer Layer.
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webgl.TileLayerRenderer = function(layer, gl) {

  goog.base(this, layer);

  /**
   * @type {WebGLRenderingContext}
   * @private
   */
  this.gl_ = null;

  this.setGL(gl);

};
goog.inherits(ol.webgl.TileLayerRenderer, ol.LayerRenderer);


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerOpacityChange =
    function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerVisibleChange =
    function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.setGL = function(gl) {
  this.gl_ = gl;
};
