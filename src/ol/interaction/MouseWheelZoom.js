/**
 * @module ol/interaction/MouseWheelZoom
 */
import {always, focus} from '../events/condition.js';
import EventType from '../events/EventType.js';
import {DEVICE_PIXEL_RATIO, FIREFOX} from '../has.js';
import Interaction from './Interaction.js';


/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. Default is
 * {@link module:ol/events/condition~always}.
 * @property {number} [maxDelta=1] Maximum mouse wheel delta.
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {number} [timeout=80] Mouse wheel timeout duration in milliseconds.
 * @property {boolean} [useAnchor=true] Enable zooming using the mouse's
 * location as the anchor. When set to `false`, zooming in and out will zoom to
 * the center of the screen instead of zooming on the mouse's location.
 */


/**
 * @classdesc
 * Allows the user to zoom the map by scrolling the mouse wheel.
 * @api
 */
class MouseWheelZoom extends Interaction {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super(/** @type {import("./Interaction.js").InteractionOptions} */ (options));

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
    this.useAnchor_ = options.useAnchor !== undefined ? options.useAnchor : true;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : always;

    /**
     * @private
     * @type {?import("../coordinate.js").Coordinate}
     */
    this.lastAnchor_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.startTime_ = undefined;

    /**
     * Events separated by this delay will be considered separate
     * interactions.
     * @type {number}
     */
    this.eventGap_ = 400;

    /**
     * @type {?}
     */
    this.timeoutId_;

    /**
     * The number of delta values per zoom level
     * @private
     * @type {number}
     */
    this.deltaPerZoom_ = 300;

  }

  /**
   * @private
   * @param {import("../MapBrowserEvent").default} mapBrowserEvent Event.
   * @return {boolean} Condition passes.
   */
  conditionInternal_(mapBrowserEvent) {
    let pass = true;
    if (mapBrowserEvent.map.getTargetElement().hasAttribute('tabindex')) {
      pass = focus(mapBrowserEvent);
    }
    return pass && this.condition_(mapBrowserEvent);
  }


  /**
   * @private
   */
  endInteraction_() {
    this.timeoutId_ = undefined;
    const view = this.getMap().getView();
    view.endInteraction(undefined, this.lastDelta_ ? (this.lastDelta_ > 0 ? 1 : -1) : 0, this.lastAnchor_);
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} (if it was a mousewheel-event) and eventually
   * zooms the map.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    if (!this.conditionInternal_(mapBrowserEvent)) {
      return true;
    }
    const type = mapBrowserEvent.type;
    if (type !== EventType.WHEEL) {
      return true;
    }

    mapBrowserEvent.preventDefault();

    const map = mapBrowserEvent.map;
    const wheelEvent = /** @type {WheelEvent} */ (mapBrowserEvent.originalEvent);

    if (this.useAnchor_) {
      this.lastAnchor_ = mapBrowserEvent.coordinate;
    }

    // Delta normalisation inspired by
    // https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
    let delta;
    if (mapBrowserEvent.type == EventType.WHEEL) {
      delta = wheelEvent.deltaY;
      if (FIREFOX &&
          wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        delta /= DEVICE_PIXEL_RATIO;
      }
      if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 40;
      }
    }

    if (delta === 0) {
      return false;
    } else {
      this.lastDelta_ = delta;
    }

    const now = Date.now();

    if (this.startTime_ === undefined) {
      this.startTime_ = now;
    }

    const view = map.getView();
    if (this.timeoutId_) {
      clearTimeout(this.timeoutId_);
    } else {
      view.beginInteraction();
    }
    this.timeoutId_ = setTimeout(this.endInteraction_.bind(this), this.eventGap_);
    view.adjustZoom(-delta / this.deltaPerZoom_, this.lastAnchor_);
    this.startTime_ = now;
    return false;
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
