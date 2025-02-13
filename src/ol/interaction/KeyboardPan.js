/**
 * @module ol/interaction/KeyboardPan
 */
import {rotate as rotateCoordinate} from '../coordinate.js';
import EventType from '../events/EventType.js';
import Key from '../events/Key.js';
import {noModifierKeys, targetNotEditable} from '../events/condition.js';
import Interaction, {pan} from './Interaction.js';

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. Default is
 * {@link module:ol/events/condition.noModifierKeys} and
 * {@link module:ol/events/condition.targetNotEditable}.
 * @property {number} [duration=100] Animation duration in milliseconds.
 * @property {number} [pixelDelta=128] The amount of pixels to pan on each key
 * press.
 */

/**
 * @classdesc
 * Allows the user to pan the map using keyboard arrows.
 * Note that, although this interaction is by default included in maps,
 * the keys can only be used when browser focus is on the element to which
 * the keyboard events are attached. By default, this is the map div,
 * though you can change this with the `keyboardEventTarget` in
 * {@link module:ol/Map~Map}. `document` never loses focus but, for any other
 * element, focus will have to be on, and returned to, this element if the keys
 * are to function.
 * See also {@link module:ol/interaction/KeyboardZoom~KeyboardZoom}.
 * @api
 */
class KeyboardPan extends Interaction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    options = options || {};

    /**
     * @private
     * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Browser event.
     * @return {boolean} Combined condition result.
     */
    this.defaultCondition_ = function (mapBrowserEvent) {
      return (
        noModifierKeys(mapBrowserEvent) && targetNotEditable(mapBrowserEvent)
      );
    };

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ =
      options.condition !== undefined
        ? options.condition
        : this.defaultCondition_;

    /**
     * @private
     * @type {number}
     */
    this.duration_ = options.duration !== undefined ? options.duration : 100;

    /**
     * @private
     * @type {number}
     */
    this.pixelDelta_ =
      options.pixelDelta !== undefined ? options.pixelDelta : 128;
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} if it was a
   * `KeyEvent`, and decides the direction to pan to (if an arrow key was
   * pressed).
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    let stopEvent = false;
    if (mapBrowserEvent.type == EventType.KEYDOWN) {
      const keyEvent = /** @type {KeyboardEvent} */ (
        mapBrowserEvent.originalEvent
      );
      const key = keyEvent.key;
      if (
        this.condition_(mapBrowserEvent) &&
        (key == Key.DOWN ||
          key == Key.LEFT ||
          key == Key.RIGHT ||
          key == Key.UP)
      ) {
        const map = mapBrowserEvent.map;
        const view = map.getView();
        const mapUnitsDelta = view.getResolution() * this.pixelDelta_;
        let deltaX = 0,
          deltaY = 0;
        if (key == Key.DOWN) {
          deltaY = -mapUnitsDelta;
        } else if (key == Key.LEFT) {
          deltaX = -mapUnitsDelta;
        } else if (key == Key.RIGHT) {
          deltaX = mapUnitsDelta;
        } else {
          deltaY = mapUnitsDelta;
        }
        const delta = [deltaX, deltaY];
        rotateCoordinate(delta, view.getRotation());
        pan(view, delta, this.duration_);
        keyEvent.preventDefault();
        stopEvent = true;
      }
    }
    return !stopEvent;
  }
}

export default KeyboardPan;
