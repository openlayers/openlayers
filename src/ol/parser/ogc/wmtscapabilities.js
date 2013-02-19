goog.provide('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.parser.ogc.Versioned');
goog.require('ol.parser.ogc.WMTSCapabilities_v1_0_0');



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 * @extends {ol.parser.ogc.Versioned}
 */
ol.parser.ogc.WMTSCapabilities = function(opt_options) {
  opt_options = opt_options || {};
  opt_options['defaultVersion'] = '1.0.0';
  this.parsers = {};
  this.parsers['v1_0_0'] = ol.parser.ogc.WMTSCapabilities_v1_0_0;
  goog.base(this, opt_options);
};
goog.inherits(ol.parser.ogc.WMTSCapabilities, ol.parser.ogc.Versioned);
