goog.provide('ol.interaction.defaults');

goog.require('ol.Collection');
goog.require('ol.Kinetic');
goog.require('ol.interaction.DblClickZoom');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.DragRotate');
goog.require('ol.interaction.DragZoom');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.KeyboardPan');
goog.require('ol.interaction.KeyboardZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.interaction.TouchPan');
goog.require('ol.interaction.TouchRotate');
goog.require('ol.interaction.TouchZoom');
goog.require('ol.interaction.condition');


/**
 * @param {ol.interaction.DefaultOptions=} opt_options Options.
 * @param {...ol.interaction.Interaction} var_args Further interactions.
 * @return {ol.Collection} Interactions.
 */
ol.interaction.defaults = function(opt_options, var_args) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var interactions = new ol.Collection();

  var rotate = goog.isDef(options.rotate) ?
      options.rotate : true;
  if (rotate) {
    interactions.push(new ol.interaction.DragRotate(
        ol.interaction.condition.altShiftKeysOnly));
  }

  var doubleClickZoom = goog.isDef(options.doubleClickZoom) ?
      options.doubleClickZoom : true;
  if (doubleClickZoom) {
    var zoomDelta = goog.isDef(options.zoomDelta) ?
        options.zoomDelta : 1;
    interactions.push(new ol.interaction.DblClickZoom(zoomDelta));
  }

  var touchPan = goog.isDef(options.touchPan) ?
      options.touchPan : true;
  if (touchPan) {
    interactions.push(new ol.interaction.TouchPan(
        new ol.Kinetic(-0.005, 0.05, 100)));
  }

  var touchRotate = goog.isDef(options.touchRotate) ?
      options.touchRotate : true;
  if (touchRotate) {
    interactions.push(new ol.interaction.TouchRotate());
  }

  var touchZoom = goog.isDef(options.touchZoom) ?
      options.touchZoom : true;
  if (touchZoom) {
    interactions.push(new ol.interaction.TouchZoom());
  }

  var dragPan = goog.isDef(options.dragPan) ?
      options.dragPan : true;
  if (dragPan) {
    interactions.push(
        new ol.interaction.DragPan(ol.interaction.condition.noModifierKeys,
            new ol.Kinetic(-0.005, 0.05, 100)));
  }

  var keyboard = goog.isDef(options.keyboard) ?
      options.keyboard : true;
  var keyboardPanOffset = goog.isDef(options.keyboardPanOffset) ?
      options.keyboardPanOffset : 80;
  if (keyboard) {
    interactions.push(new ol.interaction.KeyboardPan(keyboardPanOffset));
    interactions.push(new ol.interaction.KeyboardZoom());
  }

  var mouseWheelZoom = goog.isDef(options.mouseWheelZoom) ?
      options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(new ol.interaction.MouseWheelZoom());
  }

  var shiftDragZoom = goog.isDef(options.shiftDragZoom) ?
      options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(
        new ol.interaction.DragZoom(ol.interaction.condition.shiftKeyOnly));
  }

  var i;
  for (i = 1; i < arguments.length; ++i) {
    interactions.push(arguments[i]);
  }

  return interactions;

};
