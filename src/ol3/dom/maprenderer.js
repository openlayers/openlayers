goog.provide('ol3.dom.MapRenderer');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('ol3.Coordinate');
goog.require('ol3.Map');
goog.require('ol3.MapRenderer');
goog.require('ol3.TileLayer');
goog.require('ol3.dom.TileLayerRenderer');



/**
 * @constructor
 * @extends {ol3.MapRenderer}
 * @param {Element} container Container.
 * @param {ol3.Map} map Map.
 */
ol3.dom.MapRenderer = function(container, map) {

  goog.base(this, container, map);

  /**
   * @type {!Element}
   * @private
   */
  this.layersPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.layersPane_.className = 'ol-layers-pane';
  this.layersPane_.style.position = 'absolute';
  goog.dom.appendChild(container, this.layersPane_);

  /**
   * @type {Object}
   * @private
   */
  this.layerPanes_ = {};

  /**
   * @type {ol3.Coordinate|undefined}
   * @private
   */
  this.renderedCenter_ = undefined;

  /**
   * The pixel offset of the layers pane with respect to its container.
   *
   * @type {ol3.Coordinate}
   * @private
   */
  this.layersPaneOffset_ = null;
};
goog.inherits(ol3.dom.MapRenderer, ol3.MapRenderer);


/**
 * @inheritDoc
 */
ol3.dom.MapRenderer.prototype.createLayerRenderer = function(layer) {

  if (layer instanceof ol3.TileLayer) {

    var layerPane = goog.dom.createElement(goog.dom.TagName.DIV);
    layerPane.className = 'ol-layer';
    layerPane.style.position = 'absolute';
    goog.dom.appendChild(this.layersPane_, layerPane);

    var layerRenderer = new ol3.dom.TileLayerRenderer(this, layer, layerPane);

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
ol3.dom.MapRenderer.prototype.handleCenterChanged = function() {
  goog.base(this, 'handleCenterChanged');
  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }
  // FIXME: shiftLayersPane_ and resetLayersPane_ should be called
  // elsewhere as we may be frozen here
  if (goog.isDef(this.renderedCenter_)) {
    this.shiftLayersPane_();
  } else {
    this.resetLayersPane_();
  }
  map.render();
};


/**
 * @inheritDoc
 */
ol3.dom.MapRenderer.prototype.handleResolutionChanged = function() {
  goog.base(this, 'handleResolutionChanged');
  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }
  // FIXME: resetLayersPane_ should be called
  // elsewhere as we may be frozen here
  this.resetLayersPane_();
  map.render();
};


/**
 * Reset the layers pane to its initial position.
 * @private
 */
ol3.dom.MapRenderer.prototype.resetLayersPane_ = function() {
  var offset = new ol3.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);

  this.layersPaneOffset_ = offset;
  this.renderedCenter_ = this.map.getCenter();

  this.setOrigin_();
};


/**
 * Set the origin for each layer renderer.
 * @private
 */
ol3.dom.MapRenderer.prototype.setOrigin_ = function() {
  var center = this.map.getCenter();
  var resolution = this.map.getResolution();
  var targetSize = this.map.getSize();
  var targetWidth = targetSize.width;
  var targetHeight = targetSize.height;
  var origin = new ol3.Coordinate(
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
ol3.dom.MapRenderer.prototype.shiftLayersPane_ = function() {
  var center = this.map.getCenter();
  var oldCenter = this.renderedCenter_;
  var resolution = this.map.getResolution();
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
