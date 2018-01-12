/**
 * @module ol/interaction
 */
import Collection from './Collection.js';
import Kinetic from './Kinetic.js';
import DoubleClickZoom from './interaction/DoubleClickZoom.js';
import DragPan from './interaction/DragPan.js';
import DragRotate from './interaction/DragRotate.js';
import DragZoom from './interaction/DragZoom.js';
import KeyboardPan from './interaction/KeyboardPan.js';
import KeyboardZoom from './interaction/KeyboardZoom.js';
import MouseWheelZoom from './interaction/MouseWheelZoom.js';
import PinchRotate from './interaction/PinchRotate.js';
import PinchZoom from './interaction/PinchZoom.js';


/**
 * Set of interactions included in maps by default. Specific interactions can be
 * excluded by setting the appropriate option to false in the constructor
 * options, but the order of the interactions is fixed.  If you want to specify
 * a different order for interactions, you will need to create your own
 * {@link ol.interaction.Interaction} instances and insert them into a
 * {@link ol.Collection} in the order you want before creating your
 * {@link ol.Map} instance. The default set of interactions, in sequence, is:
 * * {@link ol.interaction.DragRotate}
 * * {@link ol.interaction.DoubleClickZoom}
 * * {@link ol.interaction.DragPan}
 * * {@link ol.interaction.PinchRotate}
 * * {@link ol.interaction.PinchZoom}
 * * {@link ol.interaction.KeyboardPan}
 * * {@link ol.interaction.KeyboardZoom}
 * * {@link ol.interaction.MouseWheelZoom}
 * * {@link ol.interaction.DragZoom}
 *
 * @param {olx.interaction.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection.<ol.interaction.Interaction>} A collection of
 * interactions to be used with the ol.Map constructor's interactions option.
 * @api
 */
export function defaults(opt_options) {

  const options = opt_options ? opt_options : {};

  const interactions = new Collection();

  const kinetic = new Kinetic(-0.005, 0.05, 100);

  const altShiftDragRotate = options.altShiftDragRotate !== undefined ?
    options.altShiftDragRotate : true;
  if (altShiftDragRotate) {
    interactions.push(new DragRotate());
  }

  const doubleClickZoom = options.doubleClickZoom !== undefined ?
    options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(new DoubleClickZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  const dragPan = options.dragPan !== undefined ? options.dragPan : true;
  if (dragPan) {
    interactions.push(new DragPan({
      kinetic: kinetic
    }));
  }

  const pinchRotate = options.pinchRotate !== undefined ? options.pinchRotate :
    true;
  if (pinchRotate) {
    interactions.push(new PinchRotate());
  }

  const pinchZoom = options.pinchZoom !== undefined ? options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(new PinchZoom({
      constrainResolution: options.constrainResolution,
      duration: options.zoomDuration
    }));
  }

  const keyboard = options.keyboard !== undefined ? options.keyboard : true;
  if (keyboard) {
    interactions.push(new KeyboardPan());
    interactions.push(new KeyboardZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  const mouseWheelZoom = options.mouseWheelZoom !== undefined ?
    options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new MouseWheelZoom({
      constrainResolution: options.constrainResolution,
      duration: options.zoomDuration
    }));
  }

  const shiftDragZoom = options.shiftDragZoom !== undefined ?
    options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new DragZoom({
      duration: options.zoomDuration
    }));
  }

  return interactions;

}
