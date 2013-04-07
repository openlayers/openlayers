goog.provide('ol.parser.ogc.WMSCapabilities_v1_1_1');

goog.require('goog.object');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1_1}
 */
ol.parser.ogc.WMSCapabilities_v1_1_1 = function() {
  goog.base(this);
  this.version = '1.1.1';
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'SRS': function(node, obj) {
      obj['srs'][this.getChildValue(node)] = true;
    }
  });
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_1,
    ol.parser.ogc.WMSCapabilities_v1_1);
