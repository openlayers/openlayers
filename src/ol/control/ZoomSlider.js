/**
 * @module ol/control/ZoomSlider
 */
import Control from './Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';
import {easeOut} from '../easing.js';
import {listen, unlistenByKey} from '../events.js';
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
 * @property {function(import("../MapEvent.js").default)} [render] Function called when the control
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
 * @api
 */
class ZoomSlider extends Control {

  /**
   * @param {Options=} opt_options Zoom slider options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super({
      element: document.createElement('div'),
      render: options.render || render
    });

    /**
      * @type {!Array.<import("../events.js").EventsKey>}
      * @private
      */
    this.dragListenerKeys_ = [];

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
    this.startX_;

    /**
     * @type {number|undefined}
     * @private
     */
    this.startY_;

    /**
     * The calculated thumb size (border box plus margins).  Set when initSlider_
     * is called.
     * @type {import("../size.js").Size}
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
    const containerElement = this.element;
    containerElement.className = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    containerElement.appendChild(thumbElement);
    /**
     * @type {PointerEventHandler}
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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.dragger_.dispose();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    super.setMap(map);
    if (map) {
      map.render();
    }
  }

  /**
   * Initializes the slider element. This will determine and set this controls
   * direction_ and also constrain the dragging of the thumb to always be within
   * the bounds of the container.
   *
   * @private
   */
  initSlider_() {
    const container = this.element;
    const containerSize = {
      width: container.offsetWidth, height: container.offsetHeight
    };

    const thumb = /** @type {HTMLElement} */ (container.firstElementChild);
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
  }

  /**
   * @param {MouseEvent} event The browser event to handle.
   * @private
   */
  handleContainerClick_(event) {
    const view = this.getMap().getView();

    const relativePosition = this.getRelativePosition_(
      event.offsetX - this.thumbSize_[0] / 2,
      event.offsetY - this.thumbSize_[1] / 2);

    const resolution = this.getResolutionForPosition_(relativePosition);
    const zoom = view.getConstrainedZoom(view.getZoomForResolution(resolution));

    view.animate({
      zoom: zoom,
      duration: this.duration_,
      easing: easeOut
    });
  }

  /**
   * Handle dragger start events.
   * @param {import("../pointer/PointerEvent.js").default} event The drag event.
   * @private
   */
  handleDraggerStart_(event) {
    if (!this.dragging_ && event.originalEvent.target === this.element.firstElementChild) {
      const element = /** @type {HTMLElement} */ (this.element.firstElementChild);
      this.getMap().getView().beginInteraction();
      this.startX_ = event.clientX - parseFloat(element.style.left);
      this.startY_ = event.clientY - parseFloat(element.style.top);
      this.dragging_ = true;

      if (this.dragListenerKeys_.length === 0) {
        const drag = this.handleDraggerDrag_;
        const end = this.handleDraggerEnd_;
        this.dragListenerKeys_.push(
          listen(document, EventType.MOUSEMOVE, drag, this),
          listen(document, PointerEventType.POINTERMOVE, drag, this),
          listen(document, EventType.MOUSEUP, end, this),
          listen(document, PointerEventType.POINTERUP, end, this)
        );
      }
    }
  }

  /**
   * Handle dragger drag events.
   *
   * @param {import("../pointer/PointerEvent.js").default} event The drag event.
   * @private
   */
  handleDraggerDrag_(event) {
    if (this.dragging_) {
      const deltaX = event.clientX - this.startX_;
      const deltaY = event.clientY - this.startY_;
      const relativePosition = this.getRelativePosition_(deltaX, deltaY);
      this.currentResolution_ = this.getResolutionForPosition_(relativePosition);
      this.getMap().getView().setResolution(this.currentResolution_);
    }
  }

  /**
   * Handle dragger end events.
   * @param {import("../pointer/PointerEvent.js").default} event The drag event.
   * @private
   */
  handleDraggerEnd_(event) {
    if (this.dragging_) {
      const view = this.getMap().getView();
      view.endInteraction();

      this.dragging_ = false;
      this.startX_ = undefined;
      this.startY_ = undefined;
      this.dragListenerKeys_.forEach(unlistenByKey);
      this.dragListenerKeys_.length = 0;
    }
  }

  /**
   * Positions the thumb inside its container according to the given resolution.
   *
   * @param {number} res The res.
   * @private
   */
  setThumbPosition_(res) {
    const position = this.getPositionForResolution_(res);
    const thumb = /** @type {HTMLElement} */ (this.element.firstElementChild);

    if (this.direction_ == Direction.HORIZONTAL) {
      thumb.style.left = this.widthLimit_ * position + 'px';
    } else {
      thumb.style.top = this.heightLimit_ * position + 'px';
    }
  }

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
  getRelativePosition_(x, y) {
    let amount;
    if (this.direction_ === Direction.HORIZONTAL) {
      amount = x / this.widthLimit_;
    } else {
      amount = y / this.heightLimit_;
    }
    return clamp(amount, 0, 1);
  }

  /**
   * Calculates the corresponding resolution of the thumb given its relative
   * position (where 0 is the minimum and 1 is the maximum).
   *
   * @param {number} position The relative position of the thumb.
   * @return {number} The corresponding resolution.
   * @private
   */
  getResolutionForPosition_(position) {
    const fn = this.getMap().getView().getResolutionForValueFunction();
    return fn(1 - position);
  }

  /**
   * Determines the relative position of the slider for the given resolution.  A
   * relative position of 0 corresponds to the minimum view resolution.  A
   * relative position of 1 corresponds to the maximum view resolution.
   *
   * @param {number} res The resolution.
   * @return {number} The relative position value (between 0 and 1).
   * @private
   */
  getPositionForResolution_(res) {
    const fn = this.getMap().getView().getValueForResolutionFunction();
    return clamp(1 - fn(res), 0, 1);
  }
}


/**
 * Update the zoomslider element.
 * @param {import("../MapEvent.js").default} mapEvent Map event.
 * @this {ZoomSlider}
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
  this.currentResolution_ = res;
  this.setThumbPosition_(res);
}


export default ZoomSlider;
