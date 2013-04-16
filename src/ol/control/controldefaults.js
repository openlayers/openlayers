goog.provide('ol.control.defaults');

goog.require('goog.array');
goog.require('ol.control.Attribution');
goog.require('ol.control.Logo');
goog.require('ol.control.Zoom');


/**
 * @param {ol.control.DefaultsOptions=} opt_options Defaults options.
 * @param {Array.<ol.control.Control>=} opt_controls Additional controls.
 * @return {Array.<ol.control.Control>} Controls.
 */
ol.control.defaults = function(opt_options, opt_controls) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /** @type {Array.<ol.control.Control>} */
  var controls = [];

  var attributionControl = goog.isDef(options.attribution) ?
      options.attribution : true;
  if (attributionControl) {
    var attributionControlOptions = goog.isDef(options.attributionOptions) ?
        options.attributionOptions : undefined;
    controls.push(new ol.control.Attribution(attributionControlOptions));
  }

  var logoControl = goog.isDef(options.logo) ?
      options.logo : true;
  if (logoControl) {
    var logoControlOptions = goog.isDef(options.logoOptions) ?
        options.logoOptions : undefined;
    controls.push(new ol.control.Logo(logoControlOptions));
  }

  var zoomControl = goog.isDef(options.zoom) ?
      options.zoom : true;
  if (zoomControl) {
    var zoomControlOptions = goog.isDef(options.zoomControlOptions) ?
        options.zoomControlOptions : undefined;
    controls.push(new ol.control.Zoom(zoomControlOptions));
  }

  if (goog.isDef(opt_controls)) {
    goog.array.extend(controls, opt_controls);
  }

  return controls;

};
