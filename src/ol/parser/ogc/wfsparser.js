goog.require('ol.parser.ogc.Versioned');
goog.provide('ol.parser.ogc.WFS');
goog.require('ol.parser.ogc.WFS_v1_0_0');
goog.require('ol.parser.ogc.WFS_v1_1_0');


/**
 * @define {boolean} Whether to enable OGC WFS version 1.0.0.
 */
ol.ENABLE_WFS_1_0_0 = true;


/**
 * @define {boolean} Whether to enable OGC WFS version 1.1.0.
 */
ol.ENABLE_WFS_1_1_0 = true;



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 * @extends {ol.parser.ogc.Versioned}
 */
ol.parser.ogc.WFS = function(opt_options) {
  var options = opt_options || {};
  options['defaultVersion'] = '1.0.0';
  this.parsers = {};
  if (ol.ENABLE_WFS_1_0_0) {
    this.parsers['v1_0_0'] = ol.parser.ogc.WFS_v1_0_0;
  }
  if (ol.ENABLE_WFS_1_1_0) {
    this.parsers['v1_1_0'] = ol.parser.ogc.WFS_v1_1_0;
  }
  goog.base(this, options);
};
goog.inherits(ol.parser.ogc.WFS, ol.parser.ogc.Versioned);
