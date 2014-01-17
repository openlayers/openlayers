goog.provide('ol.parser.ogc.SLD_v1_0_0');

goog.require('ol.parser.ogc.SLD_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.SLD_v1}
 */
ol.parser.ogc.SLD_v1_0_0 = function() {
  goog.base(this);
  this.version = '1.0.0';
  this.schemaLocation = 'http://www.opengis.net/sld ' +
      'http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd';
};
goog.inherits(ol.parser.ogc.SLD_v1_0_0,
    ol.parser.ogc.SLD_v1);
