goog.provide('ol.control');

goog.require('ol.Collection');
goog.require('ol.control.Attribution');
goog.require('ol.control.Logo');
goog.require('ol.control.Zoom');


/**
 * @param {ol.control.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection} Controls.
 * @todo stability experimental
 */
ol.control.defaults = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var controls = new ol.Collection();

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
    var zoomControlOptions = goog.isDef(options.zoomOptions) ?
        options.zoomOptions : undefined;
    controls.push(new ol.control.Zoom(zoomControlOptions));
  }

  return controls;

};
