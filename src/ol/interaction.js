/**
 * @module ol/interaction
 */
import Collection from './Collection.js';
import DoubleClickZoom from './interaction/DoubleClickZoom.js';
import DragPan from './interaction/DragPan.js';
import DragRotate from './interaction/DragRotate.js';
import DragZoom from './interaction/DragZoom.js';
import KeyboardPan from './interaction/KeyboardPan.js';
import KeyboardZoom from './interaction/KeyboardZoom.js';
import Kinetic from './Kinetic.js';
import MouseWheelZoom from './interaction/MouseWheelZoom.js';
import PinchRotate from './interaction/PinchRotate.js';
import PinchZoom from './interaction/PinchZoom.js';

export {default as DoubleClickZoom} from './interaction/DoubleClickZoom.js';
export {default as DragAndDrop} from './interaction/DragAndDrop.js';
export {default as DragBox} from './interaction/DragBox.js';
export {default as DragPan} from './interaction/DragPan.js';
export {default as DragRotate} from './interaction/DragRotate.js';
export {default as DragRotateAndZoom} from './interaction/DragRotateAndZoom.js';
export {default as DragZoom} from './interaction/DragZoom.js';
export {default as Draw} from './interaction/Draw.js';
export {default as Extent} from './interaction/Extent.js';
export {default as Interaction} from './interaction/Interaction.js';
export {default as KeyboardPan} from './interaction/KeyboardPan.js';
export {default as KeyboardZoom} from './interaction/KeyboardZoom.js';
export {default as Modify} from './interaction/Modify.js';
export {default as MouseWheelZoom} from './interaction/MouseWheelZoom.js';
export {default as PinchRotate} from './interaction/PinchRotate.js';
export {default as PinchZoom} from './interaction/PinchZoom.js';
export {default as Pointer} from './interaction/Pointer.js';
export {default as Select} from './interaction/Select.js';
export {default as Snap} from './interaction/Snap.js';
export {default as Translate} from './interaction/Translate.js';

/**
 * @typedef {Object} DefaultsOptions
 * @property {boolean} [altShiftDragRotate=true] Whether Alt-Shift-drag rotate is
 * desired.
 * @property {boolean} [onFocusOnly=false] Interact only when the map has the
 * focus. This affects the `MouseWheelZoom` and `DragPan` interactions and is
 * useful when page scroll is desired for maps that do not have the browser's
 * focus.
 * @property {boolean} [doubleClickZoom=true] Whether double click zoom is
 * desired.
 * @property {boolean} [keyboard=true] Whether keyboard interaction is desired.
 * @property {boolean} [mouseWheelZoom=true] Whether mousewheel zoom is desired.
 * @property {boolean} [shiftDragZoom=true] Whether Shift-drag zoom is desired.
 * @property {boolean} [dragPan=true] Whether drag pan is desired.
 * @property {boolean} [pinchRotate=true] Whether pinch rotate is desired.
 * @property {boolean} [pinchZoom=true] Whether pinch zoom is desired.
 * @property {number} [zoomDelta] Zoom level delta when using keyboard or double click zoom.
 * @property {number} [zoomDuration] Duration of the zoom animation in
 * milliseconds.
 */

/**
 * Set of interactions included in maps by default. Specific interactions can be
 * excluded by setting the appropriate option to false in the constructor
 * options, but the order of the interactions is fixed.  If you want to specify
 * a different order for interactions, you will need to create your own
 * {@link module:ol/interaction/Interaction} instances and insert
 * them into a {@link module:ol/Collection} in the order you want
 * before creating your {@link module:ol/Map~Map} instance. Changing the order can
 * be of interest if the event propagation needs to be stopped at a point.
 * The default set of interactions, in sequence, is:
 * * {@link module:ol/interaction/DragRotate~DragRotate}
 * * {@link module:ol/interaction/DoubleClickZoom~DoubleClickZoom}
 * * {@link module:ol/interaction/DragPan~DragPan}
 * * {@link module:ol/interaction/PinchRotate~PinchRotate}
 * * {@link module:ol/interaction/PinchZoom~PinchZoom}
 * * {@link module:ol/interaction/KeyboardPan~KeyboardPan}
 * * {@link module:ol/interaction/KeyboardZoom~KeyboardZoom}
 * * {@link module:ol/interaction/MouseWheelZoom~MouseWheelZoom}
 * * {@link module:ol/interaction/DragZoom~DragZoom}
 *
 * @param {DefaultsOptions} [opt_options] Defaults options.
 * @return {import("./Collection.js").default<import("./interaction/Interaction.js").default>}
 * A collection of interactions to be used with the {@link module:ol/Map~Map}
 * constructor's `interactions` option.
 * @api
 */
export function defaults(opt_options) {
  const options = opt_options ? opt_options : {};

  const interactions = new Collection();

  const kinetic = new Kinetic(-0.005, 0.05, 100);

  const altShiftDragRotate =
    options.altShiftDragRotate !== undefined
      ? options.altShiftDragRotate
      : true;
  if (altShiftDragRotate) {
    interactions.push(new DragRotate());
  }

  const doubleClickZoom =
    options.doubleClickZoom !== undefined ? options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(
      new DoubleClickZoom({
        delta: options.zoomDelta,
        duration: options.zoomDuration,
      })
    );
  }

  const dragPan = options.dragPan !== undefined ? options.dragPan : true;
  if (dragPan) {
    interactions.push(
      new DragPan({
        onFocusOnly: options.onFocusOnly,
        kinetic: kinetic,
      })
    );
  }

  const pinchRotate =
    options.pinchRotate !== undefined ? options.pinchRotate : true;
  if (pinchRotate) {
    interactions.push(new PinchRotate());
  }

  const pinchZoom = options.pinchZoom !== undefined ? options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(
      new PinchZoom({
        duration: options.zoomDuration,
      })
    );
  }

  const keyboard = options.keyboard !== undefined ? options.keyboard : true;
  if (keyboard) {
    interactions.push(new KeyboardPan());
    interactions.push(
      new KeyboardZoom({
        delta: options.zoomDelta,
        duration: options.zoomDuration,
      })
    );
  }

  const mouseWheelZoom =
    options.mouseWheelZoom !== undefined ? options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(
      new MouseWheelZoom({
        onFocusOnly: options.onFocusOnly,
        duration: options.zoomDuration,
      })
    );
  }

  const shiftDragZoom =
    options.shiftDragZoom !== undefined ? options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(
      new DragZoom({
        duration: options.zoomDuration,
      })
    );
  }

  return interactions;
}
