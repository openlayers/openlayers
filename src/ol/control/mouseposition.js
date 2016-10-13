// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol.control.MousePosition');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.Object');
goog.require('ol.control.Control');
goog.require('ol.proj');


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

  var options = opt_options ? opt_options : {};

  var element = document.createElement('DIV');
  element.className = options.className !== undefined ? options.className : 'ol-mouse-position';

  var render = options.render ?
      options.render : ol.control.MousePosition.render;

  ol.control.Control.call(this, {
    element: element,
    render: render,
    target: options.target
  });

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.control.MousePosition.Property.PROJECTION),
      this.handleProjectionChanged_, this);

  if (options.coordinateFormat) {
    this.setCoordinateFormat(options.coordinateFormat);
  }
  if (options.projection) {
    this.setProjection(ol.proj.get(options.projection));
  }

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = options.undefinedHTML !== undefined ? options.undefinedHTML : '';

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
ol.inherits(ol.control.MousePosition, ol.control.Control);


/**
 * Update the mouseposition element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.MousePosition}
 * @api
 */
ol.control.MousePosition.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (!frameState) {
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
      this.get(ol.control.MousePosition.Property.COORDINATE_FORMAT));
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
      this.get(ol.control.MousePosition.Property.PROJECTION));
};


/**
 * @param {Event} event Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseMove = function(event) {
  var map = this.getMap();
  this.lastMouseMovePixel_ = map.getEventPixel(event);
  this.updateHTML_(this.lastMouseMovePixel_);
};


/**
 * @param {Event} event Browser event.
 * @protected
 */
ol.control.MousePosition.prototype.handleMouseOut = function(event) {
  this.updateHTML_(null);
  this.lastMouseMovePixel_ = null;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.control.MousePosition.prototype.setMap = function(map) {
  ol.control.Control.prototype.setMap.call(this, map);
  if (map) {
    var viewport = map.getViewport();
    this.listenerKeys.push(
        ol.events.listen(viewport, ol.events.EventType.MOUSEMOVE,
            this.handleMouseMove, this),
        ol.events.listen(viewport, ol.events.EventType.MOUSEOUT,
            this.handleMouseOut, this)
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
  this.set(ol.control.MousePosition.Property.COORDINATE_FORMAT, format);
};


/**
 * Set the projection that is used to report the mouse position.
 * @param {ol.proj.Projection} projection The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePosition.prototype.setProjection = function(projection) {
  this.set(ol.control.MousePosition.Property.PROJECTION, projection);
};


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
ol.control.MousePosition.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  if (pixel && this.mapProjection_) {
    if (!this.transform_) {
      var projection = this.getProjection();
      if (projection) {
        this.transform_ = ol.proj.getTransformFromProjections(
            this.mapProjection_, projection);
      } else {
        this.transform_ = ol.proj.identityTransform;
      }
    }
    var map = this.getMap();
    var coordinate = map.getCoordinateFromPixel(pixel);
    if (coordinate) {
      this.transform_(coordinate, coordinate);
      var coordinateFormat = this.getCoordinateFormat();
      if (coordinateFormat) {
        html = coordinateFormat(coordinate);
      } else {
        html = coordinate.toString();
      }
    }
  }
  if (!this.renderedHTML_ || html != this.renderedHTML_) {
    this.element.innerHTML = html;
    this.renderedHTML_ = html;
  }
};


/**
 * @enum {string}
 */
ol.control.MousePosition.Property = {
  PROJECTION: 'projection',
  COORDINATE_FORMAT: 'coordinateFormat'
};
