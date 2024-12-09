/**
 * @module ol/interaction/MouseWheelZoom
 */
import EventType from '../events/EventType.js';
import {all, always, focusWithTabindex} from '../events/condition.js';
import {DEVICE_PIXEL_RATIO, FIREFOX} from '../has.js';
import {clamp} from '../math.js';
import Interaction, {zoomByDelta} from './Interaction.js';

/**
 * @typedef {'trackpad' | 'wheel'} Mode
 */

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. Default is
 * {@link module:ol/events/condition.always}.
 * @property {boolean} [onFocusOnly=false] When the map's target has a `tabindex` attribute set,
 * the interaction will only handle events when the map has the focus.
 * @property {number} [maxDelta=1] Maximum mouse wheel delta.
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {number} [timeout=80] Mouse wheel timeout duration in milliseconds.
 * @property {boolean} [useAnchor=true] Enable zooming using the mouse's
 * location as the anchor. When set to `false`, zooming in and out will zoom to
 * the center of the screen instead of zooming on the mouse's location.
 * @property {boolean} [constrainResolution=false] If true, the mouse wheel zoom
 * event will always animate to the closest zoom level after an interaction;
 * false means intermediary zoom levels are allowed.
 */

/**
 * @classdesc
 * Allows the user to zoom the map by scrolling the mouse wheel.
 * @api
 */
class MouseWheelZoom extends Interaction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super(
      /** @type {import("./Interaction.js").InteractionOptions} */ (options),
    );

    /**
     * @private
     * @type {number}
     */
    this.totalDelta_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.lastDelta_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = options.maxDelta !== undefined ? options.maxDelta : 1;

    /**
     * @private
     * @type {number}
     */
    this.duration_ = options.duration !== undefined ? options.duration : 250;

    /**
     * @private
     * @type {number}
     */
    this.timeout_ = options.timeout !== undefined ? options.timeout : 80;

    /**
     * @private
     * @type {boolean}
     */
    this.useAnchor_ =
      options.useAnchor !== undefined ? options.useAnchor : true;

    /**
     * @private
     * @type {boolean}
     */
    this.constrainResolution_ =
      options.constrainResolution !== undefined
        ? options.constrainResolution
        : false;

    const condition = options.condition ? options.condition : always;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.onFocusOnly
      ? all(focusWithTabindex, condition)
      : condition;

    /**
     * @private
     * @type {?import("../pixel.js").Pixel}
     */
    this.lastAnchor_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.startTime_ = undefined;

    /**
     * @private
     * @type {ReturnType<typeof setTimeout>}
     */
    this.timeoutId_;

    /**
     * @private
     * @type {Mode|undefined}
     */
    this.mode_ = undefined;

    /**
     * Trackpad events separated by this delay will be considered separate
     * interactions.
     * @private
     * @type {number}
     */
    this.trackpadEventGap_ = 400;

    /**
     * @private
     * @type {ReturnType<typeof setTimeout>}
     */
    this.trackpadTimeoutId_;

    /**
     * The number of delta values per zoom level
     * @private
     * @type {number}
     */
    this.deltaPerZoom_ = 300;
  }

  /**
   * @private
   */
  endInteraction_() {
    this.trackpadTimeoutId_ = undefined;
    const map = this.getMap();
    if (!map) {
      return;
    }
    const view = map.getView();
    view.endInteraction(
      undefined,
      this.lastDelta_ ? (this.lastDelta_ > 0 ? 1 : -1) : 0,
      this.lastAnchor_ ? map.getCoordinateFromPixel(this.lastAnchor_) : null,
    );
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} (if it was a mousewheel-event) and eventually
   * zooms the map.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    if (!this.condition_(mapBrowserEvent)) {
      return true;
    }
    const type = mapBrowserEvent.type;
    if (type !== EventType.WHEEL) {
      return true;
    }

    const map = mapBrowserEvent.map;
    const wheelEvent = /** @type {WheelEvent} */ (
      mapBrowserEvent.originalEvent
    );
    wheelEvent.preventDefault();

    if (this.useAnchor_) {
      this.lastAnchor_ = mapBrowserEvent.pixel;
    }

    // Delta normalisation inspired by
    // https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
    let delta;
    if (mapBrowserEvent.type == EventType.WHEEL) {
      delta = wheelEvent.deltaY;
      if (FIREFOX && wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        delta /= DEVICE_PIXEL_RATIO;
      }
      if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 40;
      }
    }

    if (delta === 0) {
      return false;
    }
    this.lastDelta_ = delta;

    const now = Date.now();

    if (this.startTime_ === undefined) {
      this.startTime_ = now;
    }

    if (!this.mode_ || now - this.startTime_ > this.trackpadEventGap_) {
      this.mode_ = Math.abs(delta) < 4 ? 'trackpad' : 'wheel';
    }

    const view = map.getView();
    if (
      this.mode_ === 'trackpad' &&
      !(view.getConstrainResolution() || this.constrainResolution_)
    ) {
      if (this.trackpadTimeoutId_) {
        clearTimeout(this.trackpadTimeoutId_);
      } else {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.beginInteraction();
      }
      this.trackpadTimeoutId_ = setTimeout(
        this.endInteraction_.bind(this),
        this.timeout_,
      );
      view.adjustZoom(
        -delta / this.deltaPerZoom_,
        this.lastAnchor_ ? map.getCoordinateFromPixel(this.lastAnchor_) : null,
      );
      this.startTime_ = now;
      return false;
    }

    this.totalDelta_ += delta;

    const timeLeft = Math.max(this.timeout_ - (now - this.startTime_), 0);

    clearTimeout(this.timeoutId_);
    this.timeoutId_ = setTimeout(
      this.handleWheelZoom_.bind(this, map),
      timeLeft,
    );

    return false;
  }

  /**
   * @private
   * @param {import("../Map.js").default} map Map.
   */
  handleWheelZoom_(map) {
    const view = map.getView();
    if (view.getAnimating()) {
      view.cancelAnimations();
    }
    let delta =
      -clamp(
        this.totalDelta_,
        -this.maxDelta_ * this.deltaPerZoom_,
        this.maxDelta_ * this.deltaPerZoom_,
      ) / this.deltaPerZoom_;
    if (view.getConstrainResolution() || this.constrainResolution_) {
      // view has a zoom constraint, zoom by 1
      delta = delta ? (delta > 0 ? 1 : -1) : 0;
    }
    zoomByDelta(
      view,
      delta,
      this.lastAnchor_ ? map.getCoordinateFromPixel(this.lastAnchor_) : null,
      this.duration_,
    );

    this.mode_ = undefined;
    this.totalDelta_ = 0;
    this.lastAnchor_ = null;
    this.startTime_ = undefined;
    this.timeoutId_ = undefined;
  }

  /**
   * Enable or disable using the mouse's location as an anchor when zooming
   * @param {boolean} useAnchor true to zoom to the mouse's location, false
   * to zoom to the center of the map
   * @api
   */
  setMouseAnchor(useAnchor) {
    this.useAnchor_ = useAnchor;
    if (!useAnchor) {
      this.lastAnchor_ = null;
    }
  }
}

export default MouseWheelZoom;
