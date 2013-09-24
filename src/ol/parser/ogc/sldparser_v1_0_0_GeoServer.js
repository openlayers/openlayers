goog.provide('ol.parser.ogc.SLD_v1_0_0_GeoServer');

goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.parser.ogc.SLD_v1_0_0');



/**
 * @constructor
 * @extends {ol.parser.ogc.SLD_v1_0_0}
 */
ol.parser.ogc.SLD_v1_0_0_GeoServer = function() {
  goog.base(this);
  this.profile = 'GeoServer';
  goog.object.extend(this.readers['http://www.opengis.net/sld'], {
    'Priority': function(node, obj) {
      var ogcreaders = this.readers['http://www.opengis.net/ogc'];
      var value = ogcreaders._expression.call(this, node);
      if (value) {
        obj.priority = value;
      }
    },
    'VendorOption': function(node, obj) {
      if (!goog.isDef(obj.vendorOptions)) {
        obj.vendorOptions = {};
      }
      obj.vendorOptions[node.getAttribute('name')] =
          this.getChildValue(node);
    },
    'TextSymbolizer': goog.functions.sequence(
        this.readers['http://www.opengis.net/sld']['TextSymbolizer'],
        function(node, rule) {
          var symbolizer = rule.symbolizers[rule.symbolizers.length - 1];
          if (!goog.isDef(symbolizer.graphic)) {
            symbolizer.graphic = false;
          }
        }
    )
  });
};
goog.inherits(ol.parser.ogc.SLD_v1_0_0_GeoServer,
    ol.parser.ogc.SLD_v1_0_0);
