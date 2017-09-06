import _ol_Collection_ from './collection';
import _ol_Kinetic_ from './kinetic';
import _ol_interaction_DoubleClickZoom_ from './interaction/doubleclickzoom';
import _ol_interaction_DragPan_ from './interaction/dragpan';
import _ol_interaction_DragRotate_ from './interaction/dragrotate';
import _ol_interaction_DragZoom_ from './interaction/dragzoom';
import _ol_interaction_KeyboardPan_ from './interaction/keyboardpan';
import _ol_interaction_KeyboardZoom_ from './interaction/keyboardzoom';
import _ol_interaction_MouseWheelZoom_ from './interaction/mousewheelzoom';
import _ol_interaction_PinchRotate_ from './interaction/pinchrotate';
import _ol_interaction_PinchZoom_ from './interaction/pinchzoom';
var _ol_interaction_ = {};


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
_ol_interaction_.defaults = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var interactions = new _ol_Collection_();

  var kinetic = new _ol_Kinetic_(-0.005, 0.05, 100);

  var altShiftDragRotate = options.altShiftDragRotate !== undefined ?
    options.altShiftDragRotate : true;
  if (altShiftDragRotate) {
    interactions.push(new _ol_interaction_DragRotate_());
  }

  var doubleClickZoom = options.doubleClickZoom !== undefined ?
    options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(new _ol_interaction_DoubleClickZoom_({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var dragPan = options.dragPan !== undefined ? options.dragPan : true;
  if (dragPan) {
    interactions.push(new _ol_interaction_DragPan_({
      kinetic: kinetic
    }));
  }

  var pinchRotate = options.pinchRotate !== undefined ? options.pinchRotate :
    true;
  if (pinchRotate) {
    interactions.push(new _ol_interaction_PinchRotate_());
  }

  var pinchZoom = options.pinchZoom !== undefined ? options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(new _ol_interaction_PinchZoom_({
      constrainResolution: options.constrainResolution,
      duration: options.zoomDuration
    }));
  }

  var keyboard = options.keyboard !== undefined ? options.keyboard : true;
  if (keyboard) {
    interactions.push(new _ol_interaction_KeyboardPan_());
    interactions.push(new _ol_interaction_KeyboardZoom_({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var mouseWheelZoom = options.mouseWheelZoom !== undefined ?
    options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new _ol_interaction_MouseWheelZoom_({
      constrainResolution: options.constrainResolution,
      duration: options.zoomDuration
    }));
  }

  var shiftDragZoom = options.shiftDragZoom !== undefined ?
    options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new _ol_interaction_DragZoom_({
      duration: options.zoomDuration
    }));
  }

  return interactions;

};
export default _ol_interaction_;
