goog.provide('ol.overlay.Overlay');
goog.provide('ol.overlay.OverlayPositioning');

goog.require('goog.events');
goog.require('goog.style');



/**
 * @constructor
 * @param {ol.overlay.OverlayOptions} overlayOptions Overlay options.
 */
ol.overlay.Overlay = function(overlayOptions) {

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.coordinate_ = null;

  /**
   * @type {Element}
   * @private
   */
  this.element_ = null;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @type {Array.<string>}
   * @private
   */
  this.positioning_ = [
    ol.overlay.OverlayPositioning.LEFT,
    ol.overlay.OverlayPositioning.BOTTOM
  ];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.mapListenerKeys_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.viewListenerKeys_ = null;

  if (goog.isDef(overlayOptions.coordinate)) {
    this.setCoordinate(overlayOptions.coordinate);
  }
  if (goog.isDef(overlayOptions.element)) {
    this.setElement(overlayOptions.element);
  }
  if (goog.isDef(overlayOptions.map)) {
    this.setMap(overlayOptions.map);
  }
  if (goog.isDef(overlayOptions.positioning)) {
    this.setPositioning(overlayOptions.positioning);
  }
};


/**
 * @private
 */
ol.overlay.Overlay.prototype.handleViewChanged_ = function() {
  goog.asserts.assert(!goog.isNull(this.map_));
  if (!goog.isNull(this.viewListenerKeys_)) {
    goog.array.forEach(this.viewListenerKeys_, goog.events.unlistenByKey);
    this.viewListenerKeys_ = null;
  }
  var view = this.map_.getView();
  if (goog.isDefAndNotNull(view)) {
    // FIXME works for View2D only
    goog.asserts.assert(view instanceof ol.View2D);
    this.viewListenerKeys_ = [
      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.CENTER),
          this.updatePixelPosition_, false, this),

      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.RESOLUTION),
          this.updatePixelPosition_, false, this),

      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.ROTATION),
          this.updatePixelPosition_, false, this)
    ];
    this.updatePixelPosition_();
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate for the overlay's position on
 *     the map.
 */
ol.overlay.Overlay.prototype.setCoordinate = function(coordinate) {
  this.coordinate_ = coordinate;
  this.updatePixelPosition_();
};


/**
 * @param {Element} element The DOM element for the overlay.
 */
ol.overlay.Overlay.prototype.setElement = function(element) {
  if (this.element_) {
    goog.dom.removeNode(this.element_);
  }
  this.element_ = element;
  if (this.map_) {
    goog.style.setStyle(this.element_, 'position', 'absolute');
    goog.dom.append(/** @type {!Node} */ (this.map_.getOverlayContainer()),
        this.element_);
  }
  this.updatePixelPosition_();
};


/**
 * @return {Element} The DOM element for the overlay.
 */
ol.overlay.Overlay.prototype.getElement = function() {
  return this.element_;
};


/**
 * @param {ol.Map} map Map.
 */
ol.overlay.Overlay.prototype.setMap = function(map) {
  this.map_ = map;
  if (!goog.isNull(this.mapListenerKeys_)) {
    goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
    this.mapListenerKeys_ = null;
  }
  if (this.element_) {
    this.setElement(this.element_);
  }
  if (goog.isDefAndNotNull(map)) {
    this.mapListenerKeys_ = [
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.SIZE),
          this.updatePixelPosition_, false, this),
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.VIEW),
          this.handleViewChanged_, false, this)
    ];
    this.handleViewChanged_();
  }
};


/**
 * @return {ol.Map} Map.
 */
ol.overlay.Overlay.prototype.getMap = function() {
  return this.map_;
};


/**
 * Set the CSS properties to use for x- and y-positioning of the element. If
 * not set, the default is {@code ['left', 'bottom']}.
 * @param {Array.<string>} positioning The positioning.
 */
ol.overlay.Overlay.prototype.setPositioning = function(positioning) {
  this.positioning_ = positioning;
  this.updatePixelPosition_();
};


/**
 * @private
 */
ol.overlay.Overlay.prototype.updatePixelPosition_ = function() {
  if (!goog.isNull(this.map_) && !goog.isNull(this.coordinate_) &&
      !goog.isNull(this.element_)) {
    var pixel = this.map_.getPixelFromCoordinate(this.coordinate_);
    var mapSize = this.map_.get(ol.MapProperty.SIZE);
    var x = Math.round(pixel.x);
    if (this.positioning_[0] === ol.overlay.OverlayPositioning.RIGHT) {
      x = mapSize.width - x;
    }
    var y = Math.round(pixel.y);
    if (this.positioning_[1] === ol.overlay.OverlayPositioning.BOTTOM) {
      y = mapSize.height - y;
    }
    goog.style.setStyle(this.element_, this.positioning_[0], x + 'px');
    goog.style.setStyle(this.element_, this.positioning_[1], y + 'px');
  }
};


/**
 * @enum {string}
 */
ol.overlay.OverlayPositioning = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom'
};
