goog.provide('ol.proj.Simple');

goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {ol.proj.SimpleOptions=} opt_options Options.
 */
ol.proj.Simple = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var extent;
  if (goog.isDef(options.extent)) {
    extent = options.extent;
  } else if (goog.isDef(options.size)) {
    extent = [0, options.size[0], 0, options.size[1]];
  } else {
    extent = [0, 1, 0, 1];
  }

  // FIXME generate a suitable URN
  // FIXME maybe use on urn:ogc:def:derivedCRSType:OGC:1.0:image somehow ?
  var code = goog.getUid(this).toString();

  goog.base(this, {
    code: code,
    extent: extent,
    global: options.global,
    units: goog.isDef(options.units) ? options.units : ol.ProjectionUnits.PIXELS
  });

};
goog.inherits(ol.proj.Simple, ol.Projection);


/**
 * @inheritDoc
 */
ol.proj.Simple.prototype.getPointResolution = function(resolution, point) {
  return resolution;
};
