/**
 * @module ol/interaction/Interaction
 */
import BaseObject from '../Object.js';
import {easeOut, linear} from '../easing.js';
import InteractionProperty from '../interaction/Property.js';
import {clamp} from '../math.js';


/**
 * Object literal with config options for interactions.
 * @typedef {Object} InteractionOptions
 * @property {function(import("../MapBrowserEvent.js").default):boolean} handleEvent
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. If the function returns a falsy value, propagation of
 * the event to other interactions in the map's interactions chain will be
 * prevented (this includes functions with no explicit return).
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
   * @param {InteractionOptions} options Options.
   */
  constructor(options) {
    super();

    if (options.handleEvent) {
      this.handleEvent = options.handleEvent;
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
 * @param {number=} opt_duration Duration.
 */
export function pan(view, delta, opt_duration) {
  const currentCenter = view.getCenter();
  if (currentCenter) {
    const center = view.constrainCenter(
      [currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
    if (opt_duration) {
      view.animate({
        duration: opt_duration,
        easing: linear,
        center: center
      });
    } else {
      view.setCenter(center);
    }
  }
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
export function rotate(view, rotation, opt_anchor, opt_duration) {
  rotation = view.constrainRotation(rotation, 0);
  rotateWithoutConstraints(view, rotation, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
export function rotateWithoutConstraints(view, rotation, opt_anchor, opt_duration) {
  if (rotation !== undefined) {
    const currentRotation = view.getRotation();
    const currentCenter = view.getCenter();
    if (currentRotation !== undefined && currentCenter && opt_duration > 0) {
      view.animate({
        rotation: rotation,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: easeOut
      });
    } else {
      view.rotate(rotation, opt_anchor);
    }
  }
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_direction Zooming direction; > 0 indicates
 *     zooming out, in which case the constraints system will select
 *     the largest nearest resolution; < 0 indicates zooming in, in
 *     which case the constraints system will select the smallest
 *     nearest resolution; == 0 indicates that the zooming direction
 *     is unknown/not relevant, in which case the constraints system
 *     will select the nearest resolution. If not defined 0 is
 *     assumed.
 */
export function zoom(view, resolution, opt_anchor, opt_duration, opt_direction) {
  resolution = view.constrainResolution(resolution, 0, opt_direction);
  zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
export function zoomByDelta(view, delta, opt_anchor, opt_duration) {
  const currentResolution = view.getResolution();
  let resolution = view.constrainResolution(currentResolution, delta, 0);

  if (resolution !== undefined) {
    const resolutions = view.getResolutions();
    resolution = clamp(
      resolution,
      view.getMinResolution() || resolutions[resolutions.length - 1],
      view.getMaxResolution() || resolutions[0]);
  }

  // If we have a constraint on center, we need to change the anchor so that the
  // new center is within the extent. We first calculate the new center, apply
  // the constraint to it, and then calculate back the anchor
  if (opt_anchor && resolution !== undefined && resolution !== currentResolution) {
    const currentCenter = view.getCenter();
    let center = view.calculateCenterZoom(resolution, opt_anchor);
    center = view.constrainCenter(center);

    opt_anchor = [
      (resolution * currentCenter[0] - currentResolution * center[0]) /
          (resolution - currentResolution),
      (resolution * currentCenter[1] - currentResolution * center[1]) /
          (resolution - currentResolution)
    ];
  }

  zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
export function zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration) {
  if (resolution) {
    const currentResolution = view.getResolution();
    const currentCenter = view.getCenter();
    if (currentResolution !== undefined && currentCenter &&
        resolution !== currentResolution && opt_duration) {
      view.animate({
        resolution: resolution,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: easeOut
      });
    } else {
      if (opt_anchor) {
        const center = view.calculateCenterZoom(resolution, opt_anchor);
        view.setCenter(center);
      }
      view.setResolution(resolution);
    }
  }
}

export default Interaction;
