goog.provide('ol.source.Element');

goog.require('ol.source.Source');



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {olx.source.ElementOptions=} opt_options Options.
 */
ol.source.Element = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection
  });

};
goog.inherits(ol.source.Element, ol.source.Source);


/**
 * @param {ol.Size} size Size.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.proj.Projection} projection Projection.
 * @return {Element} Element.
 */
ol.source.Element.prototype.getElement = goog.abstractMethod;
