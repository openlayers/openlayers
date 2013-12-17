goog.provide('ol.parser.ogc.Filter');
goog.require('ol.parser.ogc.Filter_v1_0_0');
goog.require('ol.parser.ogc.Filter_v1_1_0');
goog.require('ol.parser.ogc.Versioned');


/**
 * @define {boolean} Whether to enable OGC Filter version 1.0.0.
 */
ol.ENABLE_OGCFILTER_1_0_0 = true;


/**
 * @define {boolean} Whether to enable OGC Filter version 1.1.0.
 */
ol.ENABLE_OGCFILTER_1_1_0 = true;



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 * @extends {ol.parser.ogc.Versioned}
 */
ol.parser.ogc.Filter = function(opt_options) {
  opt_options = opt_options || {};
  opt_options['defaultVersion'] = '1.0.0';
  this.parsers = {};
  if (ol.ENABLE_OGCFILTER_1_0_0) {
    this.parsers['v1_0_0'] = ol.parser.ogc.Filter_v1_0_0;
  }
  if (ol.ENABLE_OGCFILTER_1_1_0) {
    this.parsers['v1_1_0'] = ol.parser.ogc.Filter_v1_1_0;
  }
  goog.base(this, opt_options);
};
goog.inherits(ol.parser.ogc.Filter, ol.parser.ogc.Versioned);
