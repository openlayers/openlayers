// FIXME should listen on appropriate pane, once it is defined

import _ol_ from '../index';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_Object_ from '../object';
import _ol_control_Control_ from '../control/control';
import _ol_proj_ from '../proj';

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
 * @api
 */
var _ol_control_MousePosition_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var element = document.createElement('DIV');
  element.className = options.className !== undefined ? options.className : 'ol-mouse-position';

  var render = options.render ?
    options.render : _ol_control_MousePosition_.render;

  _ol_control_Control_.call(this, {
    element: element,
    render: render,
    target: options.target
  });

  _ol_events_.listen(this,
      _ol_Object_.getChangeEventType(_ol_control_MousePosition_.Property_.PROJECTION),
      this.handleProjectionChanged_, this);

  if (options.coordinateFormat) {
    this.setCoordinateFormat(options.coordinateFormat);
  }
  if (options.projection) {
    this.setProjection(options.projection);
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

_ol_.inherits(_ol_control_MousePosition_, _ol_control_Control_);


/**
 * Update the mouseposition element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.MousePosition}
 * @api
 */
_ol_control_MousePosition_.render = function(mapEvent) {
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
_ol_control_MousePosition_.prototype.handleProjectionChanged_ = function() {
  this.transform_ = null;
};


/**
 * Return the coordinate format type used to render the current position or
 * undefined.
 * @return {ol.CoordinateFormatType|undefined} The format to render the current
 *     position in.
 * @observable
 * @api
 */
_ol_control_MousePosition_.prototype.getCoordinateFormat = function() {
  return (
    /** @type {ol.CoordinateFormatType|undefined} */ this.get(_ol_control_MousePosition_.Property_.COORDINATE_FORMAT)
  );
};


/**
 * Return the projection that is used to report the mouse position.
 * @return {ol.proj.Projection|undefined} The projection to report mouse
 *     position in.
 * @observable
 * @api
 */
_ol_control_MousePosition_.prototype.getProjection = function() {
  return (
    /** @type {ol.proj.Projection|undefined} */ this.get(_ol_control_MousePosition_.Property_.PROJECTION)
  );
};


/**
 * @param {Event} event Browser event.
 * @protected
 */
_ol_control_MousePosition_.prototype.handleMouseMove = function(event) {
  var map = this.getMap();
  this.lastMouseMovePixel_ = map.getEventPixel(event);
  this.updateHTML_(this.lastMouseMovePixel_);
};


/**
 * @param {Event} event Browser event.
 * @protected
 */
_ol_control_MousePosition_.prototype.handleMouseOut = function(event) {
  this.updateHTML_(null);
  this.lastMouseMovePixel_ = null;
};


/**
 * @inheritDoc
 * @api
 */
_ol_control_MousePosition_.prototype.setMap = function(map) {
  _ol_control_Control_.prototype.setMap.call(this, map);
  if (map) {
    var viewport = map.getViewport();
    this.listenerKeys.push(
        _ol_events_.listen(viewport, _ol_events_EventType_.MOUSEMOVE,
            this.handleMouseMove, this),
        _ol_events_.listen(viewport, _ol_events_EventType_.MOUSEOUT,
            this.handleMouseOut, this)
    );
  }
};


/**
 * Set the coordinate format type used to render the current position.
 * @param {ol.CoordinateFormatType} format The format to render the current
 *     position in.
 * @observable
 * @api
 */
_ol_control_MousePosition_.prototype.setCoordinateFormat = function(format) {
  this.set(_ol_control_MousePosition_.Property_.COORDINATE_FORMAT, format);
};


/**
 * Set the projection that is used to report the mouse position.
 * @param {ol.ProjectionLike} projection The projection to report mouse
 *     position in.
 * @observable
 * @api
 */
_ol_control_MousePosition_.prototype.setProjection = function(projection) {
  this.set(_ol_control_MousePosition_.Property_.PROJECTION, _ol_proj_.get(projection));
};


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
_ol_control_MousePosition_.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  if (pixel && this.mapProjection_) {
    if (!this.transform_) {
      var projection = this.getProjection();
      if (projection) {
        this.transform_ = _ol_proj_.getTransformFromProjections(
            this.mapProjection_, projection);
      } else {
        this.transform_ = _ol_proj_.identityTransform;
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
 * @private
 */
_ol_control_MousePosition_.Property_ = {
  PROJECTION: 'projection',
  COORDINATE_FORMAT: 'coordinateFormat'
};
export default _ol_control_MousePosition_;
