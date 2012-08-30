// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol3.control.MousePosition');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol3.Control');
goog.require('ol3.MapProperty');
goog.require('ol3.Object');
goog.require('ol3.Projection');
goog.require('ol3.TransformFunction');



/**
 * @constructor
 * @extends {ol3.Control}
 * @param {ol3.Map} map Map.
 * @param {ol3.Projection=} opt_projection Projection.
 * @param {ol3.CoordinateFormatType=} opt_coordinateFormat Coordinate format.
 * @param {string=} opt_undefinedHTML Undefined HTML.
 */
ol3.control.MousePosition =
    function(map, opt_projection, opt_coordinateFormat, opt_undefinedHTML) {

  goog.base(this, map);

  /**
   * @private
   * @type {Element}
   */
  this.divElement_ = goog.dom.createElement(goog.dom.TagName.DIV);

  /**
   * @private
   * @type {ol3.Projection}
   */
  this.projection_ = opt_projection || null;

  /**
   * @private
   * @type {ol3.CoordinateFormatType|undefined}
   */
  this.coordinateFormat_ = opt_coordinateFormat;

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = opt_undefinedHTML || '';

  /**
   * @private
   * @type {ol3.TransformFunction}
   */
  this.transform_ = ol3.Projection.identityTransform;

  goog.events.listen(map,
      ol3.Object.getChangedEventType(ol3.MapProperty.PROJECTION),
      this.handleMapProjectionChanged, false, this);

  goog.events.listen(map.getViewport(), goog.events.EventType.MOUSEMOVE,
      this.handleMouseMove, false, this);

  goog.events.listen(map.getViewport(), goog.events.EventType.MOUSEOUT,
      this.handleMouseOut, false, this);

  this.handleMapProjectionChanged();

};
goog.inherits(ol3.control.MousePosition, ol3.Control);


/**
 * @inheritDoc
 */
ol3.control.MousePosition.prototype.getElement = function() {
  return this.divElement_;
};


/**
 * @protected
 */
ol3.control.MousePosition.prototype.handleMapProjectionChanged = function() {
  var map = this.getMap();
  var mapProjection = map.getProjection();
  if (!goog.isDef(mapProjection) || goog.isNull(this.projection_)) {
    this.transform_ = ol3.Projection.identityTransform;
  } else {
    this.transform_ =
        ol3.Projection.getTransform(mapProjection, this.projection_);
  }
  // FIXME should we instead re-calculate using the last known mouse position?
  this.divElement_.innerHTML = this.undefinedHTML_;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol3.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  var pixel = new ol3.Pixel(browserEvent.offsetX, browserEvent.offsetY);
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
ol3.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.divElement_.innerHTML = this.undefinedHTML_;
};
