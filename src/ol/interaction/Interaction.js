/**
 * @module ol/interaction/Interaction
 */
import BaseObject from '../Object.js';
import InteractionProperty from './Property.js';
import {easeOut, linear} from '../easing.js';

/**
 * Object literal with config options for interactions.
 * @typedef {Object} InteractionOptions
 * @property {function(import("../MapBrowserEvent.js").default):boolean} handleEvent
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. If the function returns a falsy value, propagation of
 * the event to other interactions in the map's interactions chain will be
 * prevented (this includes functions with no explicit return). The interactions
 * are traversed in reverse order of the interactions collection of the map.
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * User actions that change the state of the map. Some are similar to controls,
 * but are not associated with a DOM element.
 * For example, {@link module:ol/interaction/KeyboardZoom~KeyboardZoom} is
 * functionally the same as {@link module:ol/control/Zoom~Zoom}, but triggered
 * by a keyboard event not a button element event.
 * Although interactions do not have a DOM element, some of them do render
 * vectors and so are visible on the screen.
 * @api
 */
class Interaction extends BaseObject {
  /**
   * @param {InteractionOptions} [opt_options] Options.
   */
  constructor(opt_options) {
    super();

    if (opt_options && opt_options.handleEvent) {
      this.handleEvent = opt_options.handleEvent;
    }

    /**
     * @private
     * @type {import("../PluggableMap.js").default}
     */
    this.map_ = null;

    this.setActive(true);
  }

  /**
   * Return whether the interaction is currently active.
   * @return {boolean} `true` if the interaction is active, `false` otherwise.
   * @observable
   * @api
   */
  getActive() {
    return /** @type {boolean} */ (this.get(InteractionProperty.ACTIVE));
  }

  /**
   * Get the map associated with this interaction.
   * @return {import("../PluggableMap.js").default} Map.
   * @api
   */
  getMap() {
    return this.map_;
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event}.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   */
  handleEvent(mapBrowserEvent) {
    return true;
  }

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  setActive(active) {
    this.set(InteractionProperty.ACTIVE, active);
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   */
  setMap(map) {
    this.map_ = map;
  }
}

/**
 * @param {import("../View.js").default} view View.
 * @param {import("../coordinate.js").Coordinate} delta Delta.
 * @param {number} [opt_duration] Duration.
 */
export function pan(view, delta, opt_duration) {
  const currentCenter = view.getCenterInternal();
  if (currentCenter) {
    const center = [currentCenter[0] + delta[0], currentCenter[1] + delta[1]];
    view.animateInternal({
      duration: opt_duration !== undefined ? opt_duration : 250,
      easing: linear,
      center: view.getConstrainedCenter(center),
    });
  }
}

/**
 * @param {import("../View.js").default} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {import("../coordinate.js").Coordinate} [opt_anchor] Anchor coordinate in the user projection.
 * @param {number} [opt_duration] Duration.
 */
export function zoomByDelta(view, delta, opt_anchor, opt_duration) {
  const currentZoom = view.getZoom();

  if (currentZoom === undefined) {
    return;
  }

  const newZoom = view.getConstrainedZoom(currentZoom + delta);
  const newResolution = view.getResolutionForZoom(newZoom);

  if (view.getAnimating()) {
    view.cancelAnimations();
  }
  view.animate({
    resolution: newResolution,
    anchor: opt_anchor,
    duration: opt_duration !== undefined ? opt_duration : 250,
    easing: easeOut,
  });
}

export default Interaction;
