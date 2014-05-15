goog.provide('ol.control');

goog.require('ol.Collection');
goog.require('ol.control.Attribution');
goog.require('ol.control.Logo');
goog.require('ol.control.Rotate');
goog.require('ol.control.Zoom');


/**
 * Set of default controls. Unless configured otherwise, this returns a
 * collection containing an instance of each of the following controls:
 * * {@link ol.control.Zoom}
 * * {@link ol.control.Rotate}
 * * {@link ol.control.Attribution}
 * * {@link ol.control.Logo}
 * @param {olx.control.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection} Controls.
 * @todo api
 */
ol.control.defaults = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var controls = new ol.Collection();

  var zoomControl = goog.isDef(options.zoom) ?
      options.zoom : true;
  if (zoomControl) {
    controls.push(new ol.control.Zoom(options.zoomOptions));
  }

  var rotateControl = goog.isDef(options.rotate) ?
      options.rotate : true;
  if (rotateControl) {
    controls.push(new ol.control.Rotate(options.rotateOptions));
  }

  var attributionControl = goog.isDef(options.attribution) ?
      options.attribution : true;
  if (attributionControl) {
    controls.push(new ol.control.Attribution(options.attributionOptions));
  }

  var logoControl = goog.isDef(options.logo) ?
      options.logo : true;
  if (logoControl) {
    controls.push(new ol.control.Logo(options.logoOptions));
  }

  return controls;

};
