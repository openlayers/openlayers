goog.provide('ol.control.defaults');

goog.require('ol.control.Attribution');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.Zoom');


/**
 * @param {ol.control.DefaultsOptions=} opt_options Options.
 * @param {...ol.control.Control} var_args Further controls.
 * @return {Array.<ol.control.Control>} Controls.
 */
ol.control.defaults = function(opt_options, var_args) {

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

  var scaleLineControl = goog.isDef(options.scaleLine) ?
      options.scaleLine : false;
  if (scaleLineControl) {
    var scaleLineOptions = goog.isDef(options.scaleLineOptions) ?
        options.scaleLineOptions : undefined;
    controls.push(new ol.control.ScaleLine(scaleLineOptions));
  }

  var zoomControl = goog.isDef(options.zoom) ?
      options.zoom : true;
  if (zoomControl) {
    var zoomControlOptions = goog.isDef(options.zoomControlOptions) ?
        options.zoomControlOptions : undefined;
    controls.push(new ol.control.Zoom(zoomControlOptions));
  }

  var i;
  for (i = 1; i < arguments.length; ++i) {
    controls.push(arguments[i]);
  }

  return controls;

};
