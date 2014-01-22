goog.provide('ol.parser.ogc.WFS_v1_0_0');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.parser.ogc.Filter_v1_0_0');
goog.require('ol.parser.ogc.WFS_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WFS_v1}
 */
ol.parser.ogc.WFS_v1_0_0 = function() {
  goog.base(this);
  this.version = '1.0.0';
  this.schemaLocation = this.defaultNamespaceURI + ' ' +
      'http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd';
  goog.object.extend(this.readers[this.defaultNamespaceURI], {
    'WFS_TransactionResponse': function(node, obj) {
      obj.insertIds = [];
      obj.success = false;
      this.readChildNodes(node, obj);
    },
    'InsertResult': function(node, container) {
      var obj = {fids: []};
      this.readChildNodes(node, obj);
      for (var key in obj.fids) {
        container.insertIds.push(key);
      }
    },
    'TransactionResult': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'Status': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'SUCCESS': function(node, obj) {
      obj.success = true;
    }
  });
  goog.object.extend(this.writers[this.defaultNamespaceURI], {
    'GetFeature': goog.functions.compose(
        function(obj) {
          return obj.node;
        },
        this.writers['http://www.opengis.net/wfs']['GetFeature']
    ),
    'Query': function(options) {
      var prefix = goog.isDef(options.featurePrefix) ? options.featurePrefix +
          ':' : '';
      var node = this.createElementNS('wfs:Query');
      node.setAttribute('typeName', prefix + options.featureType);
      if (goog.isDef(options.srsNameInQuery) && goog.isDef(options.srsName)) {
        node.setAttribute('srsName', options.srsName);
      }
      if (goog.isDef(options.featureNS)) {
        node.setAttribute('xmlns:' + options.featurePrefix, options.featureNS);
      }
      if (goog.isDef(options.propertyNames)) {
        for (var i = 0, ii = options.propertyNames.length; i < ii; i++) {
          this.writeNode('PropertyName', options.propertyNames[i],
              'http://www.opengis.net/ogc', node);
        }
      }
      if (goog.isDef(options.filter)) {
        this.writeNode('Filter', options.filter,
            'http://www.opengis.net/ogc', node);
      }
      return node;
    }
  });
  var filter = new ol.parser.ogc.Filter_v1_0_0();
  this.setFilterParser(filter);
};
goog.inherits(ol.parser.ogc.WFS_v1_0_0,
    ol.parser.ogc.WFS_v1);
