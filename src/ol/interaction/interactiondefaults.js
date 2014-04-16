goog.provide('ol.interaction');

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
 * This method is a convenience method to create a set of interactions
 * to be used with an {@link ol.Map}.  Specific interactions can be excluded by
 * setting the appropriate option to false in the constructor options,
 * but the order of the interactions is fixed.  If you want to specify a
 * different order for interactions, you will need to create your own
 * {@link ol.interaction} instances and insert them into an
 * {@link ol.Collection} in the order you want before creating your ol.Map
 * instance.
 * @param {olx.interaction.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection} A collection of interactions to be used with
 * the ol.Map constructor's interactions option.
 * @todo api
 */
ol.interaction.defaults = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var interactions = new ol.Collection();

  var kinetic = new ol.Kinetic(-0.005, 0.05, 100);

  var altShiftDragRotate = goog.isDef(options.altShiftDragRotate) ?
      options.altShiftDragRotate : true;
  if (altShiftDragRotate) {
    interactions.push(new ol.interaction.DragRotate());
  }

  var doubleClickZoom = goog.isDef(options.doubleClickZoom) ?
      options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(new ol.interaction.DoubleClickZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var dragPan = goog.isDef(options.dragPan) ?
      options.dragPan : true;
  if (dragPan) {
    interactions.push(new ol.interaction.DragPan({
      kinetic: kinetic
    }));
  }

  var pinchRotate = goog.isDef(options.pinchRotate) ?
      options.pinchRotate : true;
  if (pinchRotate) {
    interactions.push(new ol.interaction.PinchRotate());
  }

  var pinchZoom = goog.isDef(options.pinchZoom) ?
      options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(new ol.interaction.PinchZoom({
      duration: options.zoomDuration
    }));
  }

  var keyboard = goog.isDef(options.keyboard) ?
      options.keyboard : true;
  if (keyboard) {
    interactions.push(new ol.interaction.KeyboardPan());
    interactions.push(new ol.interaction.KeyboardZoom({
      delta: options.zoomDelta,
      duration: options.zoomDuration
    }));
  }

  var mouseWheelZoom = goog.isDef(options.mouseWheelZoom) ?
      options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new ol.interaction.MouseWheelZoom({
      duration: options.zoomDuration
    }));
  }

  var shiftDragZoom = goog.isDef(options.shiftDragZoom) ?
      options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new ol.interaction.DragZoom());
  }

  return interactions;

};
