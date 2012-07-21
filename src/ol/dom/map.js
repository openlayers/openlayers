goog.provide('ol.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('ol.Coordinate');
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
   * @type {!Element}
   * @private
   */
  this.viewport_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.viewport_.className = 'ol-viewport';
  this.viewport_.style.position = 'relative';
  this.viewport_.style.overflow = 'hidden';
  this.viewport_.style.width = '100%';
  this.viewport_.style.height = '100%';
  target.appendChild(this.viewport_);

  /**
   * @type {!Element}
   * @private
   */
  this.layersPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.layersPane_.className = 'ol-layers-pane';
  this.layersPane_.style.position = 'absolute';
  this.viewport_.appendChild(this.layersPane_);

  /**
   * @type {Object}
   * @private
   */
  this.layerPanes_ = {};

  /**
   * @type {ol.Coordinate|undefined}
   * @private
   */
  this.renderedCenter_ = undefined;

  /**
   * The pixel offset of the layers pane with respect to its container.
   *
   * @type {ol.Coordinate}
   * @private
   */
  this.layersPaneOffset_ = null;


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
  var offset = new ol.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);

  this.layersPaneOffset_ = offset;
  this.renderedCenter_ = this.getCenter();

  this.setOrigin_();
};


/**
 * Set the origin for each layer renderer.
 * @private
 */
ol.dom.Map.prototype.setOrigin_ = function() {
  var center = this.getCenter();
  var resolution = this.getResolution();
  var targetSize = this.getSize();
  var targetWidth = targetSize.width;
  var targetHeight = targetSize.height;
  var origin = new ol.Coordinate(
      center.x - resolution * targetWidth / 2,
      center.y + resolution * targetHeight / 2);
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.setOrigin(origin);
  });
};


/**
 * Move the layers pane.
 * @private
 */
ol.dom.Map.prototype.shiftLayersPane_ = function() {
  var center = this.getCenter();
  var oldCenter = this.renderedCenter_;
  var resolution = this.getResolution();
  var dx = Math.round((oldCenter.x - center.x) / resolution);
  var dy = Math.round((center.y - oldCenter.y) / resolution);
  if (!(dx === 0 && dy === 0)) {
    var offset = this.layersPaneOffset_;
    offset.x += Math.round((oldCenter.x - center.x) / resolution);
    offset.y += Math.round((center.y - oldCenter.y) / resolution);
    goog.style.setPosition(this.layersPane_, offset);
    this.renderedCenter_ = center;
  }
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.createLayerRenderer = function(layer) {

  if (layer instanceof ol.TileLayer) {

    var layerPane = goog.dom.createElement(goog.dom.TagName.DIV);
    layerPane.className = 'ol-layer';
    layerPane.style.position = 'absolute';
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
  // FIXME: shiftLayersPane_ and resetLayersPane_ should be called
  // elsewhere as we may be frozen here
  if (goog.isDef(this.renderedCenter_)) {
    this.shiftLayersPane_();
  } else {
    this.resetLayersPane_();
  }
  this.render();
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
  // FIXME: resetLayersPane_ should be called
  // elsewhere as we may be frozen here
  this.resetLayersPane_();
  this.render();
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
};
