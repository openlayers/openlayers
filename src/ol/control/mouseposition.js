// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol.control.MousePosition');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Control');
goog.require('ol.MapProperty');
goog.require('ol.Object');
goog.require('ol.Projection');
goog.require('ol.TransformFunction');



/**
 * @constructor
 * @extends {ol.Control}
 * @param {ol.Map} map Map.
 * @param {ol.Projection=} opt_projection Projection.
 * @param {ol.CoordinateFormatType=} opt_coordinateFormat Coordinate format.
 * @param {string=} opt_undefinedHTML Undefined HTML.
 */
ol.control.MousePosition =
    function(map, opt_projection, opt_coordinateFormat, opt_undefinedHTML) {

  goog.base(this, map);

  /**
   * @private
   * @type {Element}
   */
  this.divElement_ = goog.dom.createElement(goog.dom.TagName.DIV);

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = opt_projection || null;

  /**
   * @private
   * @type {ol.CoordinateFormatType|undefined}
   */
  this.coordinateFormat_ = opt_coordinateFormat;

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = opt_undefinedHTML || '';

  /**
   * @private
   * @type {ol.TransformFunction}
   */
  this.transform_ = ol.Projection.identityTransform;

  goog.events.listen(map,
      ol.Object.getChangedEventType(ol.MapProperty.PROJECTION),
      this.handleMapProjectionChanged, false, this);

  goog.events.listen(map.getTarget(), goog.events.EventType.MOUSEMOVE,
      this.handleMouseMove, false, this);

  goog.events.listen(map.getTarget(), goog.events.EventType.MOUSEOUT,
      this.handleMouseOut, false, this);

  this.handleMapProjectionChanged();

};
goog.inherits(ol.control.MousePosition, ol.Control);


/**
 * @inheritDoc
 */
ol.control.MousePosition.prototype.getElement = function() {
  return this.divElement_;
};


/**
 * @protected
 */
ol.control.MousePosition.prototype.handleMapProjectionChanged = function() {
  var map = this.getMap();
  var mapProjection = map.getProjection();
  if (!goog.isDef(mapProjection) || goog.isNull(this.projection_)) {
    this.transform_ = ol.Projection.identityTransform;
  } else {
    this.transform_ =
        ol.Projection.getTransform(mapProjection, this.projection_);
  }
  // FIXME should we instead re-calculate using the last known mouse position?
  this.divElement_.innerHTML = this.undefinedHTML_;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  var pixel = new ol.Pixel(browserEvent.offsetX, browserEvent.offsetY);
  var coordinate = map.getCoordinateFromPixel(pixel);
  var html;
  if (goog.isDef(coordinate)) {
    coordinate = this.transform_(coordinate);
    if (goog.isDef(this.coordinateFormat_)) {
      html = this.coordinateFormat_(coordinate);
    } else {
      html = coordinate.toString();
    }
  } else {
    html = this.undefinedHTML_;
  }
  this.divElement_.innerHTML = html;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.divElement_.innerHTML = this.undefinedHTML_;
};
