goog.provide('ol.parser.ogc.OWSCommon_v1_1_0');
goog.require('goog.object');
goog.require('ol.parser.ogc.OWSCommon_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.OWSCommon_v1}
 */
ol.parser.ogc.OWSCommon_v1_1_0 = function() {
  goog.base(this);
  this.readers['http://www.opengis.net/ows/1.1'] =
      this.readers['http://www.opengis.net/ows'];
  goog.object.extend(this.readers['http://www.opengis.net/ows/1.1'], {
    'AllowedValues': function(node, parameter) {
      parameter['allowedValues'] = {};
      this.readChildNodes(node, parameter['allowedValues']);
    },
    'AnyValue': function(node, parameter) {
      parameter['anyValue'] = true;
    },
    'DataType': function(node, parameter) {
      parameter['dataType'] = this.getChildValue(node);
    },
    'Range': function(node, allowedValues) {
      allowedValues['range'] = {};
      this.readChildNodes(node, allowedValues['range']);
    },
    'MinimumValue': function(node, range) {
      range['minValue'] = this.getChildValue(node);
    },
    'MaximumValue': function(node, range) {
      range['maxValue'] = this.getChildValue(node);
    },
    'Identifier': function(node, obj) {
      obj['identifier'] = this.getChildValue(node);
    },
    'SupportedCRS': function(node, obj) {
      obj['supportedCRS'] = this.getChildValue(node);
    }
  });
};
goog.inherits(ol.parser.ogc.OWSCommon_v1_1_0,
    ol.parser.ogc.OWSCommon_v1);
