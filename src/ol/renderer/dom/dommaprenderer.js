goog.provide('ol.renderer.dom.Map');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('ol.Coordinate');
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
   * @type {number | undefined}
   * @private
   */
  this.renderedRotation_ = undefined;

  /**
   * The origin (top left) of the layers pane in map coordinates.
   *
   * @type {ol.Coordinate}
   * @private
   */
  this.layersPaneOrigin_ = null;
};
goog.inherits(ol.renderer.dom.Map, ol.renderer.Map);


/**
 * Apply the given transform to the layers pane.
 * @param {number} dx Translation along the x-axis.
 * @param {number} dy Translation along the y-axis.
 * @param {number} rotation Rotation angle.
 * @private
 */
ol.renderer.dom.Map.prototype.applyTransform_ = function(dx, dy, rotation) {
  var transform =
      'translate(' + Math.round(dx) + 'px, ' + Math.round(dy) + 'px) ' +
      'rotate(' + rotation.toFixed(6) + 'rad) ' +
      'scale3d(1, 1, 1)';

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
ol.renderer.dom.Map.prototype.handleViewPropertyChanged = function() {
  goog.base(this, 'handleViewPropertyChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.handleSizeChanged = function() {
  goog.base(this, 'handleSizeChanged');
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.handleViewChanged = function() {
  goog.base(this, 'handleViewChanged');
  this.getMap().render();
};


/**
 * Render the map.  Sets up the layers pane on first render and adjusts its
 * position as needed on subsequent calls.
 * @inheritDoc
 */
ol.renderer.dom.Map.prototype.renderFrame = function(time) {
  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }

  var view = map.getView().getView2D();
  var mapCenter = view.getCenter();
  var mapSize = map.getSize();
  var mapResolution = view.getResolution();
  var mapRotation = view.getRotation();

  goog.asserts.assert(goog.isDefAndNotNull(mapCenter));
  goog.asserts.assert(goog.isDef(mapResolution));
  goog.asserts.assert(goog.isDef(mapRotation));
  goog.asserts.assert(goog.isDefAndNotNull(mapSize));

  if (goog.isNull(this.renderedCenter_)) {
    // first rendering
    goog.asserts.assert(!goog.isDef(this.renderedResolution_));
    goog.asserts.assert(!goog.isDef(this.renderedRotation_));
    goog.asserts.assert(goog.isNull(this.renderedSize_));
    this.resetLayersPane_();
  } else {
    goog.asserts.assert(goog.isDef(this.renderedResolution_));
    goog.asserts.assert(!goog.isNull(this.renderedSize_));
    if (mapResolution !== this.renderedResolution_ ||
        !mapSize.equals(this.renderedSize_)) {
      // resolution or size changed, adjust layers pane
      this.resetLayersPane_();
    } else if (!mapCenter.equals(this.renderedCenter_) ||
        mapRotation !== this.renderedRotation_) {
      // same resolution and size, new center or rotation
      this.transformLayersPane_();
    }
  }

  this.renderedCenter_ = mapCenter;
  this.renderedResolution_ = mapResolution;
  this.renderedRotation_ = mapRotation;
  this.renderedSize_ = mapSize;

  var requestRenderFrame = false;
  this.forEachReadyVisibleLayer(function(layer, layerRenderer) {
    if (layerRenderer.renderFrame(time)) {
      requestRenderFrame = true;
    }
  });

  if (requestRenderFrame) {
    map.requestRenderFrame();
  }

};


/**
 * Reset the layers pane to its initial position.
 * @private
 */
ol.renderer.dom.Map.prototype.resetLayersPane_ = function() {
  var map = this.map;
  var mapSize = map.getSize();
  var halfWidth = mapSize.width / 2;
  var halfHeight = mapSize.height / 2;
  var view = /** @type {ol.View2D} */ (map.getView().getView2D());
  var center = view.getCenter();
  var resolution = view.getResolution();
  var origin = new ol.Coordinate(
      center.x - resolution * halfWidth,
      center.y + resolution * halfHeight);
  this.layersPaneOrigin_ = origin;
  this.setTransformOrigin_(halfWidth, halfHeight);
  this.applyTransform_(0, 0, view.getRotation());
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.setOrigin(origin);
  });
};


/**
 * Set the transform-origin CSS property of the layers pane.
 * @param {number} x The x-axis origin.
 * @param {number} y The y-axis origin.
 * @private
 */
ol.renderer.dom.Map.prototype.setTransformOrigin_ = function(x, y) {
  var origin = Math.round(x) + 'px ' + Math.round(y) + 'px';
  var style = this.layersPane_.style;
  style.WebkitTransformOrigin = origin;
  style.MozTransformOrigin = origin;
  style.OTransformOrigin = origin;
  style.msTransformOrigin = origin;
  style.transformOrigin = origin;

};


/**
 * Apply the appropriate transform to the layers pane.
 * @private
 */
ol.renderer.dom.Map.prototype.transformLayersPane_ = function() {
  var map = this.map;
  var view = map.getView();
  var resolution = view.getResolution();
  var center = view.getCenter();
  var size = map.getSize();
  var origin = this.layersPaneOrigin_;
  var ox = (center.x - origin.x) / resolution;
  var oy = (origin.y - center.y) / resolution;
  this.setTransformOrigin_(ox, oy);
  var dx = ox - (size.width / 2);
  var dy = oy - (size.height / 2);
  this.applyTransform_(-dx, -dy, view.getRotation());
};
