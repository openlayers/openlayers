goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.TileLayer');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom.TileLayer');



/**
 * @constructor
 * @extends {ol.renderer.Map}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.dom.Map = function(container, map) {

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
};
goog.inherits(ol.renderer.dom.Map, ol.renderer.Map);


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.createLayerRenderer = function(layer) {

  if (layer instanceof ol.TileLayer) {

    var layerPane = goog.dom.createElement(goog.dom.TagName.DIV);
    layerPane.className = 'ol-layer';
    layerPane.style.position = 'absolute';
    goog.dom.appendChild(this.layersPane_, layerPane);

    var layerRenderer = new ol.renderer.dom.TileLayer(this, layer, layerPane);

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
ol.renderer.dom.Map.prototype.handleCenterChanged = function() {
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
ol.renderer.dom.Map.prototype.handleResolutionChanged = function() {
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
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
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
ol.renderer.dom.Map.prototype.resetLayersPane_ = function() {
  var offset = new ol.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);

  this.layersPaneOffset_ = offset;
  this.renderedCenter_ = this.map.getCenter();

  this.setOrigin_();
};


/**
 * Set the origin for each layer renderer.
 * @private
 */
ol.renderer.dom.Map.prototype.setOrigin_ = function() {
  var center = this.map.getCenter();
  var resolution = this.map.getResolution();
  var mapSize = this.map.getSize();
  var mapWidth = mapSize.width;
  var mapHeight = mapSize.height;
  var origin = new ol.Coordinate(
      center.x - resolution * mapWidth / 2,
      center.y + resolution * mapHeight / 2);
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.setOrigin(origin);
  });
};


/**
 * Move the layers pane.
 * @private
 */
ol.renderer.dom.Map.prototype.shiftLayersPane_ = function() {
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
