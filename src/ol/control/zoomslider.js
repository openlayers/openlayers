// FIXME should possibly show tooltip when dragging?

import _ol_ from '../index';
import _ol_ViewHint_ from '../viewhint';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';
import _ol_easing_ from '../easing';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_math_ from '../math';
import _ol_pointer_EventType_ from '../pointer/eventtype';
import _ol_pointer_PointerEventHandler_ from '../pointer/pointereventhandler';

/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ol.control.ZoomSlider());
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomSliderOptions=} opt_options Zoom slider options.
 * @api
 */
var _ol_control_ZoomSlider_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * Will hold the current resolution of the view.
   *
   * @type {number|undefined}
   * @private
   */
  this.currentResolution_ = undefined;

  /**
   * The direction of the slider. Will be determined from actual display of the
   * container and defaults to ol.control.ZoomSlider.Direction_.VERTICAL.
   *
   * @type {ol.control.ZoomSlider.Direction_}
   * @private
   */
  this.direction_ = _ol_control_ZoomSlider_.Direction_.VERTICAL;

  /**
   * @type {boolean}
   * @private
   */
  this.dragging_;

  /**
   * @type {number}
   * @private
   */
  this.heightLimit_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.widthLimit_ = 0;

  /**
   * @type {number|undefined}
   * @private
   */
  this.previousX_;

  /**
   * @type {number|undefined}
   * @private
   */
  this.previousY_;

  /**
   * The calculated thumb size (border box plus margins).  Set when initSlider_
   * is called.
   * @type {ol.Size}
   * @private
   */
  this.thumbSize_ = null;

  /**
   * Whether the slider is initialized.
   * @type {boolean}
   * @private
   */
  this.sliderInitialized_ = false;

  /**
   * @type {number}
   * @private
   */
  this.duration_ = options.duration !== undefined ? options.duration : 200;

  var className = options.className !== undefined ? options.className : 'ol-zoomslider';
  var thumbElement = document.createElement('button');
  thumbElement.setAttribute('type', 'button');
  thumbElement.className = className + '-thumb ' + _ol_css_.CLASS_UNSELECTABLE;
  var containerElement = document.createElement('div');
  containerElement.className = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' + _ol_css_.CLASS_CONTROL;
  containerElement.appendChild(thumbElement);
  /**
   * @type {ol.pointer.PointerEventHandler}
   * @private
   */
  this.dragger_ = new _ol_pointer_PointerEventHandler_(containerElement);

  _ol_events_.listen(this.dragger_, _ol_pointer_EventType_.POINTERDOWN,
      this.handleDraggerStart_, this);
  _ol_events_.listen(this.dragger_, _ol_pointer_EventType_.POINTERMOVE,
      this.handleDraggerDrag_, this);
  _ol_events_.listen(this.dragger_, _ol_pointer_EventType_.POINTERUP,
      this.handleDraggerEnd_, this);

  _ol_events_.listen(containerElement, _ol_events_EventType_.CLICK,
      this.handleContainerClick_, this);
  _ol_events_.listen(thumbElement, _ol_events_EventType_.CLICK,
      _ol_events_Event_.stopPropagation);

  var render = options.render ? options.render : _ol_control_ZoomSlider_.render;

  _ol_control_Control_.call(this, {
    element: containerElement,
    render: render
  });
};

_ol_.inherits(_ol_control_ZoomSlider_, _ol_control_Control_);


/**
 * @inheritDoc
 */
_ol_control_ZoomSlider_.prototype.disposeInternal = function() {
  this.dragger_.dispose();
  _ol_control_Control_.prototype.disposeInternal.call(this);
};


/**
 * The enum for available directions.
 *
 * @enum {number}
 * @private
 */
_ol_control_ZoomSlider_.Direction_ = {
  VERTICAL: 0,
  HORIZONTAL: 1
};


/**
 * @inheritDoc
 */
_ol_control_ZoomSlider_.prototype.setMap = function(map) {
  _ol_control_Control_.prototype.setMap.call(this, map);
  if (map) {
    map.render();
  }
};


/**
 * Initializes the slider element. This will determine and set this controls
 * direction_ and also constrain the dragging of the thumb to always be within
 * the bounds of the container.
 *
 * @private
 */
_ol_control_ZoomSlider_.prototype.initSlider_ = function() {
  var container = this.element;
  var containerSize = {
    width: container.offsetWidth, height: container.offsetHeight
  };

  var thumb = container.firstElementChild;
  var computedStyle = getComputedStyle(thumb);
  var thumbWidth = thumb.offsetWidth +
      parseFloat(computedStyle['marginRight']) +
      parseFloat(computedStyle['marginLeft']);
  var thumbHeight = thumb.offsetHeight +
      parseFloat(computedStyle['marginTop']) +
      parseFloat(computedStyle['marginBottom']);
  this.thumbSize_ = [thumbWidth, thumbHeight];

  if (containerSize.width > containerSize.height) {
    this.direction_ = _ol_control_ZoomSlider_.Direction_.HORIZONTAL;
    this.widthLimit_ = containerSize.width - thumbWidth;
  } else {
    this.direction_ = _ol_control_ZoomSlider_.Direction_.VERTICAL;
    this.heightLimit_ = containerSize.height - thumbHeight;
  }
  this.sliderInitialized_ = true;
};


/**
 * Update the zoomslider element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.ZoomSlider}
 * @api
 */
_ol_control_ZoomSlider_.render = function(mapEvent) {
  if (!mapEvent.frameState) {
    return;
  }
  if (!this.sliderInitialized_) {
    this.initSlider_();
  }
  var res = mapEvent.frameState.viewState.resolution;
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    this.setThumbPosition_(res);
  }
};


/**
 * @param {Event} event The browser event to handle.
 * @private
 */
_ol_control_ZoomSlider_.prototype.handleContainerClick_ = function(event) {
  var view = this.getMap().getView();

  var relativePosition = this.getRelativePosition_(
      event.offsetX - this.thumbSize_[0] / 2,
      event.offsetY - this.thumbSize_[1] / 2);

  var resolution = this.getResolutionForPosition_(relativePosition);

  view.animate({
    resolution: view.constrainResolution(resolution),
    duration: this.duration_,
    easing: _ol_easing_.easeOut
  });
};


/**
 * Handle dragger start events.
 * @param {ol.pointer.PointerEvent} event The drag event.
 * @private
 */
_ol_control_ZoomSlider_.prototype.handleDraggerStart_ = function(event) {
  if (!this.dragging_ && event.originalEvent.target === this.element.firstElementChild) {
    this.getMap().getView().setHint(_ol_ViewHint_.INTERACTING, 1);
    this.previousX_ = event.clientX;
    this.previousY_ = event.clientY;
    this.dragging_ = true;
  }
};


/**
 * Handle dragger drag events.
 *
 * @param {ol.pointer.PointerEvent|Event} event The drag event.
 * @private
 */
_ol_control_ZoomSlider_.prototype.handleDraggerDrag_ = function(event) {
  if (this.dragging_) {
    var element = this.element.firstElementChild;
    var deltaX = event.clientX - this.previousX_ + parseInt(element.style.left, 10);
    var deltaY = event.clientY - this.previousY_ + parseInt(element.style.top, 10);
    var relativePosition = this.getRelativePosition_(deltaX, deltaY);
    this.currentResolution_ = this.getResolutionForPosition_(relativePosition);
    this.getMap().getView().setResolution(this.currentResolution_);
    this.setThumbPosition_(this.currentResolution_);
    this.previousX_ = event.clientX;
    this.previousY_ = event.clientY;
  }
};


/**
 * Handle dragger end events.
 * @param {ol.pointer.PointerEvent|Event} event The drag event.
 * @private
 */
_ol_control_ZoomSlider_.prototype.handleDraggerEnd_ = function(event) {
  if (this.dragging_) {
    var view = this.getMap().getView();
    view.setHint(_ol_ViewHint_.INTERACTING, -1);

    view.animate({
      resolution: view.constrainResolution(this.currentResolution_),
      duration: this.duration_,
      easing: _ol_easing_.easeOut
    });

    this.dragging_ = false;
    this.previousX_ = undefined;
    this.previousY_ = undefined;
  }
};


/**
 * Positions the thumb inside its container according to the given resolution.
 *
 * @param {number} res The res.
 * @private
 */
_ol_control_ZoomSlider_.prototype.setThumbPosition_ = function(res) {
  var position = this.getPositionForResolution_(res);
  var thumb = this.element.firstElementChild;

  if (this.direction_ == _ol_control_ZoomSlider_.Direction_.HORIZONTAL) {
    thumb.style.left = this.widthLimit_ * position + 'px';
  } else {
    thumb.style.top = this.heightLimit_ * position + 'px';
  }
};


/**
 * Calculates the relative position of the thumb given x and y offsets.  The
 * relative position scales from 0 to 1.  The x and y offsets are assumed to be
 * in pixel units within the dragger limits.
 *
 * @param {number} x Pixel position relative to the left of the slider.
 * @param {number} y Pixel position relative to the top of the slider.
 * @return {number} The relative position of the thumb.
 * @private
 */
_ol_control_ZoomSlider_.prototype.getRelativePosition_ = function(x, y) {
  var amount;
  if (this.direction_ === _ol_control_ZoomSlider_.Direction_.HORIZONTAL) {
    amount = x / this.widthLimit_;
  } else {
    amount = y / this.heightLimit_;
  }
  return _ol_math_.clamp(amount, 0, 1);
};


/**
 * Calculates the corresponding resolution of the thumb given its relative
 * position (where 0 is the minimum and 1 is the maximum).
 *
 * @param {number} position The relative position of the thumb.
 * @return {number} The corresponding resolution.
 * @private
 */
_ol_control_ZoomSlider_.prototype.getResolutionForPosition_ = function(position) {
  var fn = this.getMap().getView().getResolutionForValueFunction();
  return fn(1 - position);
};


/**
 * Determines the relative position of the slider for the given resolution.  A
 * relative position of 0 corresponds to the minimum view resolution.  A
 * relative position of 1 corresponds to the maximum view resolution.
 *
 * @param {number} res The resolution.
 * @return {number} The relative position value (between 0 and 1).
 * @private
 */
_ol_control_ZoomSlider_.prototype.getPositionForResolution_ = function(res) {
  var fn = this.getMap().getView().getValueForResolutionFunction();
  return 1 - fn(res);
};
export default _ol_control_ZoomSlider_;
