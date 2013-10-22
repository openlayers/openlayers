goog.provide('ol.parser.ogc.WFS_v1_0_0');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.parser.ogc.Filter_v1_0_0');
goog.require('ol.parser.ogc.WFS_v1');



/**
 * @constructor
 * @param {ol.parser.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.parser.ogc.WFS_v1}
 */
ol.parser.ogc.WFS_v1_0_0 = function(opt_options) {
  goog.base(this, opt_options);
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
    'Query': function(options) {
      // TODO see if we really need properties on the instance
      /*goog.object.extend(options, {
        featureNS: this.featureNS,
        featurePrefix: this.featurePrefix,
        featureType: this.featureType,
        srsName: this.srsName,
        srsNameInQuery: this.srsNameInQuery
      });*/
      var prefix = goog.isDef(this.featurePrefix) ? this.featurePrefix +
          ':' : '';
      var node = this.createElementNS('wfs:Query');
      node.setAttribute('typeName', prefix + options.featureType);
      if (goog.isDef(options.srsNameInQuery) && goog.isDef(options.srsName)) {
        node.setAttribute('srsName', options.srsName);
      }
      if (goog.isDef(this.featureNS)) {
        node.setAttribute('xmlns:' + this.featurePrefix, this.featureNS);
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
  this.filter_ = new ol.parser.ogc.Filter_v1_0_0();
  for (var uri in this.filter_.readers) {
    for (var key in this.filter_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      this.readers[uri][key] = goog.bind(this.filter_.readers[uri][key],
          this.filter_);
    }
  }
  for (uri in this.filter_.writers) {
    for (key in this.filter_.writers[uri]) {
      if (!goog.isDef(this.writers[uri])) {
        this.writers[uri] = {};
      }
      this.writers[uri][key] = goog.bind(this.filter_.writers[uri][key],
          this.filter_);
    }
  }
};
goog.inherits(ol.parser.ogc.WFS_v1_0_0,
    ol.parser.ogc.WFS_v1);
