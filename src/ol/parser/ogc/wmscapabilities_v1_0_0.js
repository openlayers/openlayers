goog.provide('ol.parser.ogc.WMSCapabilities_v1_0_0');

goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.parser.ogc.WMSCapabilities_v1_1_0');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1_1_0}
 */
ol.parser.ogc.WMSCapabilities_v1_0_0 = function() {
  goog.base(this);
  this.version = '1.0.0';
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'Format': function(node, obj) {
      for (var i = 0, ii = node.childNodes.length; i < ii; i++) {
        var child = node.childNodes[i];
        var local = child.localName || child.nodeName.split(':').pop();
        if (goog.isArray(obj['formats'])) {
          obj['formats'].push(local);
        } else {
          obj['format'] = local;
        }
      }
    },
    'Keywords': function(node, obj) {
      if (!goog.isDef(obj['keywords'])) {
        obj['keywords'] = [];
      }
      var keywords = this.getChildValue(node).split(/ +/);
      for (var i = 0, ii = keywords.length; i < ii; ++i) {
        if (!goog.string.isEmpty(keywords[i])) {
          obj['keywords'].push({'value': keywords[i]});
        }
      }
    },
    'OnlineResource': function(node, obj) {
      obj['href'] = this.getChildValue(node);
    },
    'Get': function(node, obj) {
      obj['get'] = {'href': node.getAttribute('onlineResource')};
    },
    'Post': function(node, obj) {
      obj['post'] = {'href': node.getAttribute('onlineResource')};
    },
    'Map': function(node, obj) {
      var reader = this.readers[this.defaultNamespaceURI]['GetMap'];
      reader.apply(this, arguments);
    },
    'Capabilities': function(node, obj) {
      var reader = this.readers[this.defaultNamespaceURI]['GetCapabilities'];
      reader.apply(this, arguments);
    },
    'FeatureInfo': function(node, obj) {
      var reader = this.readers[this.defaultNamespaceURI]['GetFeatureInfo'];
      reader.apply(this, arguments);
    }
  });
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_0_0,
    ol.parser.ogc.WMSCapabilities_v1_1_0);
