goog.provide('ol.parser.ogc.WMSCapabilities_v1_1_0');

goog.require('goog.object');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1_1}
 */
ol.parser.ogc.WMSCapabilities_v1_1_0 = function() {
  goog.base(this);
  this.version = '1.1.0';
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'SRS': function(node, obj) {
      var srs = this.getChildValue(node);
      var values = srs.split(/ +/);
      for (var i = 0, ii = values.length; i < ii; i++) {
        obj['srs'][values[i]] = true;
      }
    }
  });
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_0,
    ol.parser.ogc.WMSCapabilities_v1_1);
