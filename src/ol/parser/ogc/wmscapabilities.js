goog.provide('ol.parser.ogc.WMSCapabilities');
goog.require('ol.parser.ogc.Versioned');
goog.require('ol.parser.ogc.WMSCapabilities_v1_0_0');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1_0');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1_1');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC');
goog.require('ol.parser.ogc.WMSCapabilities_v1_3_0');


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.0.0.
 */
ol.ENABLE_WMSCAPS_1_0_0 = false;


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.1.0.
 */
ol.ENABLE_WMSCAPS_1_1_0 = true;


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.1.1.
 */
ol.ENABLE_WMSCAPS_1_1_1 = true;


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.3.0.
 */
ol.ENABLE_WMSCAPS_1_3_0 = true;


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.1.1.
 * WMSC profile.
 */
ol.ENABLE_WMSCAPS_1_1_1_WMSC = true;



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 * @extends {ol.parser.ogc.Versioned}
 */
ol.parser.ogc.WMSCapabilities = function(opt_options) {
  opt_options = opt_options || {};
  opt_options['defaultVersion'] = '1.1.1';
  this.parsers = {};
  if (ol.ENABLE_WMSCAPS_1_0_0) {
    this.parsers['v1_0_0'] = ol.parser.ogc.WMSCapabilities_v1_0_0;
  }
  if (ol.ENABLE_WMSCAPS_1_1_0) {
    this.parsers['v1_1_0'] = ol.parser.ogc.WMSCapabilities_v1_1_0;
  }
  if (ol.ENABLE_WMSCAPS_1_1_1) {
    this.parsers['v1_1_1'] = ol.parser.ogc.WMSCapabilities_v1_1_1;
  }
  if (ol.ENABLE_WMSCAPS_1_1_1_WMSC) {
    this.parsers['v1_1_1_WMSC'] = ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC;
  }
  if (ol.ENABLE_WMSCAPS_1_3_0) {
    this.parsers['v1_3_0'] = ol.parser.ogc.WMSCapabilities_v1_3_0;
  }
  goog.base(this, opt_options);
};
goog.inherits(ol.parser.ogc.WMSCapabilities, ol.parser.ogc.Versioned);
