goog.provide('ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC');

goog.require('goog.object');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1_1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1_1_1}
 */
ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC = function() {
  goog.base(this);
  this.profile = 'WMSC';
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'VendorSpecificCapabilities': function(node, obj) {
      obj['vendorSpecific'] = {'tileSets': []};
      this.readChildNodes(node, obj['vendorSpecific']);
    },
    'TileSet': function(node, vendorSpecific) {
      var tileset = {'srs': {}, 'bbox': {}, 'resolutions': []};
      this.readChildNodes(node, tileset);
      vendorSpecific.tileSets.push(tileset);
    },
    'Resolutions': function(node, tileset) {
      var res = this.getChildValue(node).split(' ');
      for (var i = 0, ii = res.length; i < ii; i++) {
        if (res[i] !== '') {
          tileset['resolutions'].push(parseFloat(res[i]));
        }
      }
    },
    'Width': function(node, tileset) {
      tileset['width'] = parseInt(this.getChildValue(node), 10);
    },
    'Height': function(node, tileset) {
      tileset['height'] = parseInt(this.getChildValue(node), 10);
    },
    'Layers': function(node, tileset) {
      tileset['layers'] = this.getChildValue(node);
    },
    'Styles': function(node, tileset) {
      tileset['styles'] = this.getChildValue(node);
    }
  });
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC,
    ol.parser.ogc.WMSCapabilities_v1_1_1);
