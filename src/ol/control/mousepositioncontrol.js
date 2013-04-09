// FIXME should listen on appropriate pane, once it is defined
// FIXME works for View2D only

goog.provide('ol.control.MousePosition');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('ol.CoordinateFormatType');
goog.require('ol.Pixel');
goog.require('ol.Projection');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');
goog.require('ol.projection');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.MousePositionOptions=} opt_options Mouse position options.
 */
ol.control.MousePosition = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-mouse-position'
  });

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = ol.projection.get(options.projection);

  /**
   * @private
   * @type {ol.CoordinateFormatType|undefined}
   */
  this.coordinateFormat_ = options.coordinateFormat;

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = goog.isDef(options.undefinedHTML) ?
      options.undefinedHTML : '';

  /**
   * @private
   * @type {string}
   */
  this.renderedHTML_ = element.innerHTML;

  /**
   * @private
   * @type {ol.Projection}
   */
  this.mapProjection_ = null;

  /**
   * @private
   * @type {ol.TransformFunction}
   */
  this.transform_ = ol.projection.identityTransform;

  /**
   * @private
   * @type {ol.Projection}
   */
  this.renderedProjection_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.lastMouseMovePixel_ = null;

};
goog.inherits(ol.control.MousePosition, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.MousePosition.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.mapProjection_ = null;
  } else {
    this.mapProjection_ = frameState.view2DState.projection;
  }
  this.updateHTML_(this.lastMouseMovePixel_);
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
  this.updateHTML_(pixel);
  this.lastMouseMovePixel_ = pixel;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.updateHTML_(null);
  this.lastMouseMovePixel_ = null;
};


/**
 * @inheritDoc
 */
ol.control.MousePosition.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    var viewport = map.getViewport();
    this.listenerKeys.push(
        goog.events.listen(viewport, goog.events.EventType.MOUSEMOVE,
            this.handleMouseMove, false, this),
        goog.events.listen(viewport, goog.events.EventType.MOUSEOUT,
            this.handleMouseOut, false, this)
    );
  }
};


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
ol.control.MousePosition.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  if (!goog.isNull(pixel)) {
    if (this.renderedProjection_ != this.mapProjection_) {
      if (!goog.isNull(this.projection_)) {
        this.transform_ = ol.projection.getTransformFromProjections(
            this.mapProjection_, this.projection_);
      } else {
        this.transform_ = ol.projection.identityTransform;
      }
      this.renderedProjection_ = this.mapProjection_;
    }
    var map = this.getMap();
    var coordinate = map.getCoordinateFromPixel(pixel);
    if (!goog.isNull(coordinate)) {
      this.transform_(coordinate, coordinate);
      if (goog.isDef(this.coordinateFormat_)) {
        html = this.coordinateFormat_(coordinate);
      } else {
        html = coordinate.toString();
      }
    }
  }
  if (!goog.isDef(this.renderedHTML_) || html != this.renderedHTML_) {
    this.element.innerHTML = html;
    this.renderedHTML_ = html;
  }
};
