goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.layer.TileLayer');
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
  this.layersPane_.className = 'ol-layers-pane ol-unselectable';
  var style = this.layersPane_.style;
  style.position = 'absolute';
  style.width = '100%';
  style.height = '100%';

  goog.dom.insertChildAt(container, this.layersPane_, 0);

  /**
   * @type {Object}
   * @private
   */
  this.layerPanes_ = {};

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.renderedCenter_ = null;

  /**
   * @type {number | undefined}
   * @private
   */
  this.renderedResolution_ = undefined;

  /**
   * @type {ol.Size}
   * @private
   */
  this.renderedSize_ = null;

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
 * Apply the given transform to the layers pane.
 * @param {string} transform The transform to apply.
 * @private
 */
ol.renderer.dom.Map.prototype.applyTransform_ = function(transform) {
  var style = this.layersPane_.style;
  style.WebkitTransform = transform;
  style.MozTransform = transform;
  style.OTransform = transform;
  style.msTransform = transform;
  style.transform = transform;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.canRotate = goog.functions.TRUE;


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.createLayerRenderer = function(layer) {

  if (layer instanceof ol.layer.TileLayer) {

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
  map.render();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.handleRotationChanged = function() {
  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }
  var rotation = map.getRotation();
  this.applyTransform_('rotate(' + rotation + 'rad) scale3d(1, 1, 1)');
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
  map.render();
};


/**
 * Render the map.  Sets up the layers pane on first render and adjusts its
 * position as needed on subsequent calls.
 *
 * @return {boolean} Animating.
 */
ol.renderer.dom.Map.prototype.render = function() {
  var map = this.getMap();
  if (!map.isDef()) {
    return false;
  }

  var mapSize = map.getSize();
  var mapResolution = map.getResolution();
  var mapCenter = map.getCenter();
  goog.asserts.assert(goog.isDefAndNotNull(mapSize));
  goog.asserts.assert(goog.isDef(mapResolution));
  goog.asserts.assert(goog.isDefAndNotNull(mapCenter));

  if (goog.isNull(this.renderedCenter_)) {
    // first rendering
    goog.asserts.assert(!goog.isDef(this.renderedResolution_));
    goog.asserts.assert(goog.isNull(this.renderedSize_));
    this.resetLayersPane_();
  } else {
    goog.asserts.assert(goog.isDef(this.renderedResolution_));
    goog.asserts.assert(!goog.isNull(this.renderedSize_));
    if (mapResolution !== this.renderedResolution_ ||
        !mapSize.equals(this.renderedSize_)) {
      // resolution or size changed, adjust layers pane
      this.resetLayersPane_();
    } else if (!mapCenter.equals(this.renderedCenter_)) {
      // same resolution and size, new center
      this.shiftLayersPane_();
    }
  }

  this.renderedCenter_ = mapCenter;
  this.renderedResolution_ = mapResolution;
  this.renderedSize_ = mapSize;

  return goog.base(this, 'render');
};


/**
 * Reset the layers pane to its initial position.
 * @private
 */
ol.renderer.dom.Map.prototype.resetLayersPane_ = function() {
  var offset = new ol.Coordinate(0, 0);
  goog.style.setPosition(this.layersPane_, offset);
  this.layersPaneOffset_ = offset;
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
  goog.asserts.assert(goog.isDef(center));
  var oldCenter = this.renderedCenter_;
  var currentPx = this.getPixelFromCoordinate(center);
  var oldPx = this.getPixelFromCoordinate(oldCenter);
  var dx = Math.round(oldPx.x - currentPx.x);
  var dy = Math.round(oldPx.y - currentPx.y);
  if (!(dx === 0 && dy === 0)) {
    var offset = this.layersPaneOffset_;
    offset.x += dx;
    offset.y += dy;
    goog.style.setPosition(this.layersPane_, offset);
  }
};
