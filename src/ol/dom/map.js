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
   * The current top left corner location of the layersPane element
   * (map coords).
   *
   * @type {goog.math.Coordinate}
   * @private
   */
  this.layersPaneOrigin_ = null;

  /**
   * The pixel offset of the layersPane element with respect to its
   * container.
   *
   * @type {goog.math.Coordinate}
   * @private
   */
  this.layersPaneOffset_ = null;

  /**
   * @type {goog.math.Coordinate|undefined}
   * @private
   */
  this.renderedCenter_ = undefined;

  /**
   * @type {number|undefined}
   * @private
   */
  this.renderedResolution_ = undefined;

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
  this.layersPaneOrigin_ = this.getOrigin_();
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.setContainerOrigin(this.layersPaneOrigin_);
  });
  var offset = new goog.math.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);
  this.renderedCenter_ = this.getCenter();
};


/**
 * Get the position of the top-left corner of the layers pane.
 * @private
 * @return {goog.math.Coordinate} Origin.
 */
ol.dom.Map.prototype.getOrigin_ = function() {
  var center = this.getCenter();
  var resolution = this.getResolution();
  var targetSize = this.getSize();
  var targetWidth = targetSize.width;
  var targetHeight = targetSize.height;
  return new goog.math.Coordinate(
      center.x - resolution * targetWidth / 2,
      center.y + resolution * targetHeight / 2);
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
  }
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
    layerPane.style.top = 0 + 'px';
    layerPane.style.left = 0 + 'px';
    this.layersPane_.appendChild(layerPane);

    var layerRenderer = new ol.dom.TileLayerRenderer(this, layer, layerPane);
    layerRenderer.setContainerOrigin(this.layersPaneOrigin_);

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
  //this.shiftLayersPane_();
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
  var resolution = this.getResolution();
  if (resolution != this.renderedResolution_) {
    this.resetLayersPane_();
    this.redraw();
  }
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
};


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.redrawInternal = function() {
  goog.base(this, 'redrawInternal');
  this.forEachVisibleLayer(function(layer, layerRenderer) {
    layerRenderer.redraw();
  }, this);
  return false;
};
