goog.provide('ol.dom.Map');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('ol.Map');
goog.require('ol.TileLayer');
goog.require('ol.dom.TileLayerRenderer');



/**
 * @constructor
 * @extends {ol.Map}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.dom.Map = function(target, opt_values) {
  goog.base(this, target);

  /**
   * @type {Element}
   * @private
   */
  this.layersPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.layersPane_.style.position = 'absolute';
  this.layersPane_.className = 'ol-renderer-dom';
  target.appendChild(this.layersPane_);

  /**
   * @type {Object}
   * @private
   */
  this.layerPanes_ = {};

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

  this.handleViewportResize();

};
goog.inherits(ol.dom.Map, ol.Map);


/**
 * Reset the layers pane to its initial position.
 * @private
 */
ol.dom.Map.prototype.resetLayersPane_ = function() {
  var offset = new goog.math.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);
};


/**
 * Move the layers pane.
 * @private
 */
ol.dom.Map.prototype.shiftLayersPane_ = function() {
  //var center = this.getCenter();
  //var oldCenter = this.renderedCenter_;
  //var resolution = this.getResolution();
  //var dx = Math.round((oldCenter.x - center.x) / resolution);
  //var dy = Math.round((center.y - oldCenter.y) / resolution);
  //if (!(dx === 0 && dy === 0)) {
  //var offset = this.layersPaneOffset_;
  //offset.x += Math.round((oldCenter.x - center.x) / resolution);
  //offset.y += Math.round((center.y - oldCenter.y) / resolution);
  //goog.style.setPosition(this.layersPane_, offset);
  //}
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.createLayerRenderer = function(layer) {

  if (layer instanceof ol.TileLayer) {

    var layerPane = goog.dom.createElement(goog.dom.TagName.DIV);
    layerPane.className = 'ol-renderer-dom-layer';
    layerPane.style.position = 'absolute';
    layerPane.style.width = '100%';
    layerPane.style.height = '100%';
    this.layersPane_.appendChild(layerPane);

    var layerRenderer = new ol.dom.TileLayerRenderer(this, layer, layerPane);

    this.layerPanes_[goog.getUid(layerRenderer)] = layerPane;

    return layerRenderer;

  } else {
    goog.asserts.assert(false);
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleCenterChanged = function() {
  goog.base(this, 'handleCenterChanged');
  this.resetLayersPane_();
  this.redraw();
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleLayerAdd = function(layer) {
  goog.base(this, 'handleLayerAdd', layer);
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleLayerRemove = function(layer) {
  goog.base(this, 'handleLayerRemove', layer);
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleResolutionChanged = function() {
  goog.base(this, 'handleResolutionChanged');
  this.resetLayersPane_();
  this.redraw();
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
};
