goog.provide('ol.parser.ogc.SLD');
goog.require('ol.parser.ogc.SLD_v1_0_0');
goog.require('ol.parser.ogc.SLD_v1_0_0_GeoServer');
goog.require('ol.parser.ogc.Versioned');


/**
 * @define {boolean} Whether to enable SLD version 1.0.0.
 */
ol.ENABLE_SLD_1_0_0 = true;


/**
 * @define {boolean} Whether to enable SLD version 1.0.0.
 * GeoServer profile.
 */
ol.ENABLE_SLD_1_0_0_GEOSERVER = true;



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 * @extends {ol.parser.ogc.Versioned}
 */
ol.parser.ogc.SLD = function(opt_options) {
  opt_options = opt_options || {};
  opt_options['defaultVersion'] = '1.0.0';
  this.parsers = {};
  if (ol.ENABLE_SLD_1_0_0) {
    this.parsers['v1_0_0'] = ol.parser.ogc.SLD_v1_0_0;
  }
  if (ol.ENABLE_SLD_1_0_0_GEOSERVER) {
    this.parsers['v1_0_0_GEOSERVER'] = ol.parser.ogc.SLD_v1_0_0_GeoServer;
  }
  goog.base(this, opt_options);
};
goog.inherits(ol.parser.ogc.SLD, ol.parser.ogc.Versioned);
