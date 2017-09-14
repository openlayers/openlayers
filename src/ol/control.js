goog.provide('ol.control');

goog.require('ol.Collection');
goog.require('ol.control.Attribution');
goog.require('ol.control.Rotate');
goog.require('ol.control.Zoom');


/**
 * Set of controls included in maps by default. Unless configured otherwise,
 * this returns a collection containing an instance of each of the following
 * controls:
 * * {@link ol.control.Zoom}
 * * {@link ol.control.Rotate}
 * * {@link ol.control.Attribution}
 *
 * @param {olx.control.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api
 */
ol.control.defaults = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var controls = new ol.Collection();

  var zoomControl = options.zoom !== undefined ? options.zoom : true;
  if (zoomControl) {
    controls.push(new ol.control.Zoom(options.zoomOptions));
  }

  var rotateControl = options.rotate !== undefined ? options.rotate : true;
  if (rotateControl) {
    controls.push(new ol.control.Rotate(options.rotateOptions));
  }

  var attributionControl = options.attribution !== undefined ?
    options.attribution : true;
  if (attributionControl) {
    controls.push(new ol.control.Attribution(options.attributionOptions));
  }

  return controls;

};
