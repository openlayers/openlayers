/**
 * @module ol/control/ZoomSlider
 */
import {inherits} from '../util.js';
import ViewHint from '../ViewHint.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';
import {easeOut} from '../easing.js';
import {listen} from '../events.js';
import {stopPropagation} from '../events/Event.js';
import EventType from '../events/EventType.js';
import {clamp} from '../math.js';
import PointerEventType from '../pointer/EventType.js';
import PointerEventHandler from '../pointer/PointerEventHandler.js';


/**
 * The enum for available directions.
 *
 * @enum {number}
 */
const Direction = {
  VERTICAL: 0,
  HORIZONTAL: 1
};


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-zoomslider'] CSS class name.
 * @property {number} [duration=200] Animation duration in milliseconds.
 * @property {function(module:ol/MapEvent)} [render] Function called when the control
 * should be re-rendered. This is called in a `requestAnimationFrame` callback.
 */


/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ZoomSlider());
 *
 * @constructor
 * @extends {module:ol/control/Control}
 * @param {module:ol/control/ZoomSlider~Options=} opt_options Zoom slider options.
 * @api
 */
const ZoomSlider = function(opt_options) {

  const options = opt_options ? opt_options : {};

  /**
   * Will hold the current resolution of the view.
   *
   * @type {number|undefined}
   * @private
   */
  this.currentResolution_ = undefined;

  /**
   * The direction of the slider. Will be determined from actual display of the
   * container and defaults to Direction.VERTICAL.
   *
   * @type {Direction}
   * @private
   */
  this.direction_ = Direction.VERTICAL;

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
   * @type {module:ol/size~Size}
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

  const className = options.className !== undefined ? options.className : 'ol-zoomslider';
  const thumbElement = document.createElement('button');
  thumbElement.setAttribute('type', 'button');
  thumbElement.className = className + '-thumb ' + CLASS_UNSELECTABLE;
  const containerElement = document.createElement('div');
  containerElement.className = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
  containerElement.appendChild(thumbElement);
  /**
   * @type {module:ol/pointer/PointerEventHandler}
   * @private
   */
  this.dragger_ = new PointerEventHandler(containerElement);

  listen(this.dragger_, PointerEventType.POINTERDOWN,
    this.handleDraggerStart_, this);
  listen(this.dragger_, PointerEventType.POINTERMOVE,
    this.handleDraggerDrag_, this);
  listen(this.dragger_, PointerEventType.POINTERUP,
    this.handleDraggerEnd_, this);

  listen(containerElement, EventType.CLICK, this.handleContainerClick_, this);
  listen(thumbElement, EventType.CLICK, stopPropagation);

  Control.call(this, {
    element: containerElement,
    render: options.render || render
  });
};

inherits(ZoomSlider, Control);


/**
 * @inheritDoc
 */
ZoomSlider.prototype.disposeInternal = function() {
  this.dragger_.dispose();
  Control.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ZoomSlider.prototype.setMap = function(map) {
  Control.prototype.setMap.call(this, map);
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
ZoomSlider.prototype.initSlider_ = function() {
  const container = this.element;
  const containerSize = {
    width: container.offsetWidth, height: container.offsetHeight
  };

  const thumb = container.firstElementChild;
  const computedStyle = getComputedStyle(thumb);
  const thumbWidth = thumb.offsetWidth +
      parseFloat(computedStyle['marginRight']) +
      parseFloat(computedStyle['marginLeft']);
  const thumbHeight = thumb.offsetHeight +
      parseFloat(computedStyle['marginTop']) +
      parseFloat(computedStyle['marginBottom']);
  this.thumbSize_ = [thumbWidth, thumbHeight];

  if (containerSize.width > containerSize.height) {
    this.direction_ = Direction.HORIZONTAL;
    this.widthLimit_ = containerSize.width - thumbWidth;
  } else {
    this.direction_ = Direction.VERTICAL;
    this.heightLimit_ = containerSize.height - thumbHeight;
  }
  this.sliderInitialized_ = true;
};


/**
 * Update the zoomslider element.
 * @param {module:ol/MapEvent} mapEvent Map event.
 * @this {module:ol/control/ZoomSlider}
 * @api
 */
export function render(mapEvent) {
  if (!mapEvent.frameState) {
    return;
  }
  if (!this.sliderInitialized_) {
    this.initSlider_();
  }
  const res = mapEvent.frameState.viewState.resolution;
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    this.setThumbPosition_(res);
  }
}


/**
 * @param {Event} event The browser event to handle.
 * @private
 */
ZoomSlider.prototype.handleContainerClick_ = function(event) {
  const view = this.getMap().getView();

  const relativePosition = this.getRelativePosition_(
    event.offsetX - this.thumbSize_[0] / 2,
    event.offsetY - this.thumbSize_[1] / 2);

  const resolution = this.getResolutionForPosition_(relativePosition);

  view.animate({
    resolution: view.constrainResolution(resolution),
    duration: this.duration_,
    easing: easeOut
  });
};


/**
 * Handle dragger start events.
 * @param {module:ol/pointer/PointerEvent} event The drag event.
 * @private
 */
ZoomSlider.prototype.handleDraggerStart_ = function(event) {
  if (!this.dragging_ && event.originalEvent.target === this.element.firstElementChild) {
    this.getMap().getView().setHint(ViewHint.INTERACTING, 1);
    this.previousX_ = event.clientX;
    this.previousY_ = event.clientY;
    this.dragging_ = true;
  }
};


/**
 * Handle dragger drag events.
 *
 * @param {module:ol/pointer/PointerEvent|Event} event The drag event.
 * @private
 */
ZoomSlider.prototype.handleDraggerDrag_ = function(event) {
  if (this.dragging_) {
    const element = this.element.firstElementChild;
    const deltaX = event.clientX - this.previousX_ + parseInt(element.style.left, 10);
    const deltaY = event.clientY - this.previousY_ + parseInt(element.style.top, 10);
    const relativePosition = this.getRelativePosition_(deltaX, deltaY);
    this.currentResolution_ = this.getResolutionForPosition_(relativePosition);
    this.getMap().getView().setResolution(this.currentResolution_);
    this.setThumbPosition_(this.currentResolution_);
    this.previousX_ = event.clientX;
    this.previousY_ = event.clientY;
  }
};


/**
 * Handle dragger end events.
 * @param {module:ol/pointer/PointerEvent|Event} event The drag event.
 * @private
 */
ZoomSlider.prototype.handleDraggerEnd_ = function(event) {
  if (this.dragging_) {
    const view = this.getMap().getView();
    view.setHint(ViewHint.INTERACTING, -1);

    view.animate({
      resolution: view.constrainResolution(this.currentResolution_),
      duration: this.duration_,
      easing: easeOut
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
ZoomSlider.prototype.setThumbPosition_ = function(res) {
  const position = this.getPositionForResolution_(res);
  const thumb = this.element.firstElementChild;

  if (this.direction_ == Direction.HORIZONTAL) {
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
ZoomSlider.prototype.getRelativePosition_ = function(x, y) {
  let amount;
  if (this.direction_ === Direction.HORIZONTAL) {
    amount = x / this.widthLimit_;
  } else {
    amount = y / this.heightLimit_;
  }
  return clamp(amount, 0, 1);
};


/**
 * Calculates the corresponding resolution of the thumb given its relative
 * position (where 0 is the minimum and 1 is the maximum).
 *
 * @param {number} position The relative position of the thumb.
 * @return {number} The corresponding resolution.
 * @private
 */
ZoomSlider.prototype.getResolutionForPosition_ = function(position) {
  const fn = this.getMap().getView().getResolutionForValueFunction();
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
ZoomSlider.prototype.getPositionForResolution_ = function(res) {
  const fn = this.getMap().getView().getValueForResolutionFunction();
  return 1 - fn(res);
};

export default ZoomSlider;
