// FIXME should listen on appropriate pane, once it is defined
// FIXME works for View2D only

goog.provide('ol.control.MousePosition');

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
  this.undefinedHtml_ = goog.isDef(mousePositionOptions.undefinedHtml) ?
      mousePositionOptions.undefinedHtml : '';

  /**
   * @private
   * @type {ol.TransformFunction}
   */
  this.transform_ = ol.Projection.identityTransform;

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

  this.handleViewProjectionChanged_();
};
goog.inherits(ol.control.MousePosition, ol.control.Control);


/**
 * @private
 */
ol.control.MousePosition.prototype.handleMapViewChanged_ = function() {
  var map = this.getMap();
  goog.asserts.assert(!goog.isNull(map));
  if (!goog.isNull(this.viewListenerKeys_)) {
    goog.array.forEach(this.viewListenerKeys_, goog.events.unlistenByKey);
    this.viewListenerKeys_ = null;
  }
  var view = map.getView();
  if (goog.isDefAndNotNull(view)) {
    // FIXME works for View2D only
    goog.asserts.assert(view instanceof ol.View2D);
    this.viewListenerKeys_ = [
      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.ROTATION),
          this.handleViewProjectionChanged_, false, this)
    ];
    this.handleViewProjectionChanged_();
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  var eventPosition = goog.style.getRelativePosition(
      browserEvent, map.getViewport());
  var pixel = new ol.Pixel(eventPosition.x, eventPosition.y);
  var coordinate = map.getCoordinateFromPixel(pixel);
  var html;
  if (!goog.isNull(coordinate)) {
    coordinate = this.transform_(coordinate);
    if (goog.isDef(this.coordinateFormat_)) {
      html = this.coordinateFormat_(coordinate);
    } else {
      html = coordinate.toString();
    }
  } else {
    html = this.undefinedHtml_;
  }
  this.element.innerHTML = html;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.element.innerHTML = this.undefinedHtml_;
};


/**
 * @private
 */
ol.control.MousePosition.prototype.handleViewProjectionChanged_ = function() {
  this.updateTransform_();
  // FIXME should we instead re-calculate using the last known
  // mouse position?
  this.element.innerHTML = this.undefinedHtml_;
};


/**
 * @inheritDoc
 */
ol.control.MousePosition.prototype.setMap = function(map) {
  if (!goog.isNull(this.mapListenerKeys_)) {
    goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
    this.mapListenerKeys_ = null;
  }
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    var viewport = map.getViewport();
    this.listenerKeys = [
      goog.events.listen(viewport, goog.events.EventType.MOUSEMOVE,
          this.handleMouseMove, false, this),
      goog.events.listen(viewport, goog.events.EventType.MOUSEOUT,
          this.handleMouseOut, false, this),
      goog.events.listen(map,
          ol.Object.getChangedEventType(ol.MapProperty.VIEW),
          this.handleMapViewChanged_, false, this)
    ];
    this.updateTransform_();
  }
};


/**
 * @private
 */
ol.control.MousePosition.prototype.updateTransform_ = function() {
  var map, view;
  if (!goog.isNull(map = this.getMap()) &&
      !goog.isNull(view = map.getView())) {
    // FIXME works for View2D only
    goog.asserts.assert(view instanceof ol.View2D);
    var viewProjection = view.getProjection();
    if (!goog.isDef(viewProjection) || !goog.isDef(this.projection_)) {
      this.transform_ = ol.Projection.identityTransform;
    } else {
      this.transform_ =
          ol.Projection.getTransform(viewProjection, this.projection_);
    }
  } else {
    this.transform_ = ol.Projection.identityTransform;
  }
};
