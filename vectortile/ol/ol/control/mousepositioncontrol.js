// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol.control.MousePosition');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.CoordinateFormatType');
goog.require('ol.Object');
goog.require('ol.Pixel');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');
goog.require('ol.proj');
goog.require('ol.proj.Projection');


/**
 * @enum {string}
 */
ol.control.MousePositionProperty = {
  PROJECTION: 'projection',
  COORDINATE_FORMAT: 'coordinateFormat'
};



/**
 * @classdesc
 * A control to show the 2D coordinates of the mouse cursor. By default, these
 * are in the view projection, but can be in any supported projection.
 * By default the control is shown in the top right corner of the map, but this
 * can be changed by using the css selector `.ol-mouse-position`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.MousePositionOptions=} opt_options Mouse position
 *     options.
 * @api stable
 */
ol.control.MousePosition = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ?
      options.className : 'ol-mouse-position';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, className);

  var render = goog.isDef(options.render) ?
      options.render : ol.control.MousePosition.render;

  goog.base(this, {
    element: element,
    render: render,
    target: options.target
  });

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.control.MousePositionProperty.PROJECTION),
      this.handleProjectionChanged_, false, this);

  if (goog.isDef(options.coordinateFormat)) {
    this.setCoordinateFormat(options.coordinateFormat);
  }
  if (goog.isDef(options.projection)) {
    this.setProjection(ol.proj.get(options.projection));
  }

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
   * @type {ol.proj.Projection}
   */
  this.mapProjection_ = null;

  /**
   * @private
   * @type {?ol.TransformFunction}
   */
  this.transform_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.lastMouseMovePixel_ = null;

};
goog.inherits(ol.control.MousePosition, ol.control.Control);


/**
 * Update the mouseposition element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.MousePosition}
 * @api
 */
ol.control.MousePosition.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.mapProjection_ = null;
  } else {
    if (this.mapProjection_ != frameState.viewState.projection) {
      this.mapProjection_ = frameState.viewState.projection;
      this.transform_ = null;
    }
  }
  this.updateHTML_(this.lastMouseMovePixel_);
};


/**
 * @private
 */
ol.control.MousePosition.prototype.handleProjectionChanged_ = function() {
  this.transform_ = null;
};


/**
 * Return the coordinate format type used to render the current position or
 * undefined.
 * @return {ol.CoordinateFormatType|undefined} The format to render the current
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePosition.prototype.getCoordinateFormat = function() {
  return /** @type {ol.CoordinateFormatType|undefined} */ (
      this.get(ol.control.MousePositionProperty.COORDINATE_FORMAT));
};


/**
 * Return the projection that is used to report the mouse position.
 * @return {ol.proj.Projection|undefined} The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePosition.prototype.getProjection = function() {
  return /** @type {ol.proj.Projection|undefined} */ (
      this.get(ol.control.MousePositionProperty.PROJECTION));
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  this.lastMouseMovePixel_ = map.getEventPixel(browserEvent.getBrowserEvent());
  this.updateHTML_(this.lastMouseMovePixel_);
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
 * @api stable
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
 * Set the coordinate format type used to render the current position.
 * @param {ol.CoordinateFormatType} format The format to render the current
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePosition.prototype.setCoordinateFormat = function(format) {
  this.set(ol.control.MousePositionProperty.COORDINATE_FORMAT, format);
};


/**
 * Set the projection that is used to report the mouse position.
 * @param {ol.proj.Projection} projection The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePosition.prototype.setProjection = function(projection) {
  this.set(ol.control.MousePositionProperty.PROJECTION, projection);
};


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
ol.control.MousePosition.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  if (!goog.isNull(pixel) && !goog.isNull(this.mapProjection_)) {
    if (goog.isNull(this.transform_)) {
      var projection = this.getProjection();
      if (goog.isDef(projection)) {
        this.transform_ = ol.proj.getTransformFromProjections(
            this.mapProjection_, projection);
      } else {
        this.transform_ = ol.proj.identityTransform;
      }
    }
    var map = this.getMap();
    var coordinate = map.getCoordinateFromPixel(pixel);
    if (!goog.isNull(coordinate)) {
      this.transform_(coordinate, coordinate);
      var coordinateFormat = this.getCoordinateFormat();
      if (goog.isDef(coordinateFormat)) {
        html = coordinateFormat(coordinate);
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
