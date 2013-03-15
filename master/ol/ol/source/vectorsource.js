goog.provide('ol.source.Vector');

goog.require('ol.source.Source');



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.SourceOptions} options Source options.
 */
ol.source.Vector = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.source.Vector, ol.source.Source);
