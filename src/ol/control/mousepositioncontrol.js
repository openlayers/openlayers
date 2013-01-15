// FIXME should listen on appropriate pane, once it is defined
// FIXME works for View2D only

goog.provide('ol.control.MousePosition');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('ol.Object');
goog.require('ol.Pixel');
goog.require('ol.Projection');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.MousePositionOptions} mousePositionOptions Mouse position
 *     options.
 */
ol.control.MousePosition = function(mousePositionOptions) {

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-mouse-position'
  });

  goog.base(this, {
    element: element,
    map: mousePositionOptions.map,
    target: mousePositionOptions.target
  });

  /**
   * @private
   * @type {ol.Projection|undefined}
   */
  this.projection_ = mousePositionOptions.projection;

  /**
   * @private
   * @type {ol.CoordinateFormatType|undefined}
   */
  this.coordinateFormat_ = mousePositionOptions.coordinateFormat;

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = goog.isDef(mousePositionOptions.undefinedHTML) ?
      mousePositionOptions.undefinedHTML : '';

  /**
   * @private
   * @type {ol.TransformFunction|undefined}
   */
  this.transform_ = undefined;

  /**
   * @private
   * @type {ol.Projection}
   */
  this.transformProjection_ = null;

  /**
   * @private
   * @type {Array.<?number>}
   */
  this.listenerKeys_ = null;

};
goog.inherits(ol.control.MousePosition, ol.control.Control);


/**
 * @param {ol.MapEvent} mapEvent Map event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.transform_ = undefined;
    this.transformProjection_ = null;
  } else {
    var projection = frameState.view2DState.projection;
    if (projection != this.transformProjection_) {
      if (goog.isDef(this.projection_)) {
        this.transform_ = ol.Projection.getTransform(
            projection, this.projection_);
      } else {
        this.transform_ = ol.Projection.identityTransform;
      }
      this.transformProjection_ = projection;
    }
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var html = this.undefinedHTML_;
  if (goog.isDef(this.transform_)) {
    var map = this.getMap();
    var eventPosition = goog.style.getRelativePosition(
        browserEvent, map.getViewport());
    var pixel = new ol.Pixel(eventPosition.x, eventPosition.y);
    var coordinate = map.getCoordinateFromPixel(pixel);
    if (!goog.isNull(coordinate)) {
      coordinate = this.transform_(coordinate);
      if (goog.isDef(this.coordinateFormat_)) {
        html = this.coordinateFormat_(coordinate);
      } else {
        html = coordinate.toString();
      }
    }
  }
  this.element.innerHTML = html;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.element.innerHTML = this.undefinedHTML_;
};


/**
 * @inheritDoc
 */
ol.control.MousePosition.prototype.setMap = function(map) {
  if (!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null;
  }
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    var viewport = map.getViewport();
    this.listenerKeys_ = [
      goog.events.listen(viewport, goog.events.EventType.MOUSEMOVE,
          this.handleMouseMove, false, this),
      goog.events.listen(viewport, goog.events.EventType.MOUSEOUT,
          this.handleMouseOut, false, this),
      goog.events.listen(map, ol.MapEventType.POSTRENDER,
          this.handleMapPostrender, false, this)
    ];
  }
};
