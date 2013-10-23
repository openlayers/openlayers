goog.provide('ol.parser.ogc.WFS_v1_1_0');

goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.parser.ogc.Filter_v1_1_0');
goog.require('ol.parser.ogc.WFS_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WFS_v1}
 */
ol.parser.ogc.WFS_v1_1_0 = function() {
  goog.base(this);
  this.version = '1.1.0';
  this.schemaLocation = this.defaultNamespaceURI + ' ' +
      'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd';
  goog.object.extend(this.readers[this.defaultNamespaceURI], {
    'FeatureCollection': goog.functions.sequence(
        function(node, obj) {
          var numberOfFeatures = node.getAttribute('numberOfFeatures');
          if (!goog.isNull(numberOfFeatures)) {
            obj.numberOfFeatures = parseInt(numberOfFeatures, 10);
          }
        },
        this.readers['http://www.opengis.net/wfs']['FeatureCollection']
    ),
    'TransactionResponse': function(node, obj) {
      obj.insertIds = [];
      obj.success = false;
      this.readChildNodes(node, obj);
    },
    'TransactionSummary': function(node, obj) {
      // this is a limited test of success
      obj.success = true;
    },
    'InsertResults': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'Feature': function(node, container) {
      var obj = {};
      this.readChildNodes(node, obj);
      for (var key in obj.fids) {
        container.insertIds.push(key);
      }
    }
  });
  goog.object.extend(this.writers[this.defaultNamespaceURI], {
    'GetFeature': function(options) {
      var node = this.writers['http://www.opengis.net/wfs']['GetFeature'].
          apply(this, arguments);
      if (goog.isDef(options)) {
        node.setAttribute('resultType', options.resultType);
        if (goog.isDef(options.startIndex)) {
          node.setAttribute('startIndex', options.startIndex);
        }
        node.setAttribute('count', options.count);
      }
      return node;
    },
    'Query': function(options) {
      var prefix = goog.isDef(options.featurePrefix) ? options.featurePrefix +
          ':' : '';
      var node = this.createElementNS('wfs:Query');
      node.setAttribute('typeName', prefix + options.featureType);
      node.setAttribute('srsName', options.srsName);
      if (goog.isDef(options.featureNS)) {
        node.setAttribute('xmlns:' + options.featurePrefix, options.featureNS);
      }
      if (goog.isDef(options.propertyNames)) {
        for (var i = 0, ii = options.propertyNames.length; i < ii; i++) {
          this.writeNode('wfs:PropertyName', {
            property: options.propertyNames[i]
          }, null, node);
        }
      }
      if (goog.isDef(options.filter)) {
        this.writeNode('Filter', options.filter,
            'http://www.opengis.net/ogc', node);
      }
      return node;
    },
    'PropertyName': function(obj) {
      var node = this.createElementNS('wfs:PropertyName');
      node.appendChild(this.createTextNode(obj.property));
      return node;
    }
  });
  this.setFilterParser(new ol.parser.ogc.Filter_v1_1_0());
};
goog.inherits(ol.parser.ogc.WFS_v1_1_0,
    ol.parser.ogc.WFS_v1);
