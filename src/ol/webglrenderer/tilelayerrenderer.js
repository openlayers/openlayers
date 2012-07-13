goog.provide('ol.webglrenderer.TileLayerRenderer');

goog.require('goog.events.EventType');
goog.require('ol.LayerRenderer');
goog.require('ol.webglrenderer.IGLObject');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @implements {ol.webglrenderer.IGLObject}
 * @param {ol.Layer} layer Layer.
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webglrenderer.TileLayerRenderer = function(layer, gl) {

  goog.base(this, layer);

  /**
   * @type {WebGLRenderingContext}
   * @private
   */
  this.gl_ = null;

  this.setGL(gl);

};
goog.inherits(ol.webglrenderer.TileLayerRenderer, ol.LayerRenderer);


/**
 * @protected
 */
ol.webglrenderer.TileLayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @inheritDoc
 */
ol.webglrenderer.TileLayerRenderer.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @inheritDoc
 */
ol.webglrenderer.TileLayerRenderer.prototype.handleLayerOpacityChange =
    function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webglrenderer.TileLayerRenderer.prototype.handleLayerVisibleChange =
    function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webglrenderer.TileLayerRenderer.prototype.setGL = function(gl) {
  this.gl_ = gl;
};
