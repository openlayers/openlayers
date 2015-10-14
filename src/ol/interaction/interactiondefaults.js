goog.provide('ol.interaction');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.Kinetic');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.DragRotate');
goog.require('ol.interaction.DragZoom');
goog.require('ol.interaction.KeyboardPan');
goog.require('ol.interaction.KeyboardZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.interaction.PinchRotate');
goog.require('ol.interaction.PinchZoom');


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
 * Note that DragZoom renders a box as a vector polygon, so this interaction
 * should be excluded if you want a build with no vector support.
 *
 * @param {olx.interaction.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection.<ol.interaction.Interaction>} A collection of
 * interactions to be used with the ol.Map constructor's interactions option.
 * @api stable
 */
ol.interaction.defaults = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var interactions = new ol.Collection();

  var kinetic = new ol.Kinetic(-0.005, 0.05, 100);

  var altShiftDragRotate = options.altShiftDragRotate !== undefined ?
      options.altShiftDragRotate : true;
  if (altShiftDragRotate) {
    interactions.push(new ol.interaction.DragRotate());
  }

  var doubleClickZoom = options.doubleClickZoom !== undefined ?
      options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(new ol.interaction.DoubleClickZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var dragPan = options.dragPan !== undefined ? options.dragPan : true;
  if (dragPan) {
    interactions.push(new ol.interaction.DragPan({
      kinetic: kinetic
    }));
  }

  var pinchRotate = options.pinchRotate !== undefined ? options.pinchRotate :
      true;
  if (pinchRotate) {
    interactions.push(new ol.interaction.PinchRotate());
  }

  var pinchZoom = options.pinchZoom !== undefined ? options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(new ol.interaction.PinchZoom({
      duration: options.zoomDuration
    }));
  }

  var keyboard = options.keyboard !== undefined ? options.keyboard : true;
  if (keyboard) {
    interactions.push(new ol.interaction.KeyboardPan());
    interactions.push(new ol.interaction.KeyboardZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var mouseWheelZoom = options.mouseWheelZoom !== undefined ?
      options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new ol.interaction.MouseWheelZoom({
      duration: options.zoomDuration
    }));
  }

  var shiftDragZoom = options.shiftDragZoom !== undefined ?
      options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new ol.interaction.DragZoom({
      duration: options.zoomDuration
    }));
  }

  return interactions;

};
