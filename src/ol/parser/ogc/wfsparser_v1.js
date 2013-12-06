goog.provide('ol.parser.ogc.WFS_v1');
goog.require('goog.dom.xml');
goog.require('ol.parser.XML');


/**
 * @typedef {{featureNS: string,
              featurePrefix: string,
              featureTypes: Array.<string>,
              handle: string,
              outputFormat: string,
              nativeElements: Array.<{
                vendorId: string,
                safeToIgnore: boolean,
                value: string
              }>,
              maxFeatures: number}}
 */
ol.parser.WFSWriteOptions;



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.WFS_v1 = function() {
  this.defaultNamespaceURI = 'http://www.opengis.net/wfs';
  // TODO set errorProperty
  this.readers = {};
  this.readers[this.defaultNamespaceURI] = {
    'FeatureCollection': function(node, obj) {
      obj.features = [];
      this.readChildNodes(node, obj);
    }
  };
  this.writers = {};
  this.writers[this.defaultNamespaceURI] = {
    'GetFeature': function(options) {
      options = /** @type {ol.parser.WFSWriteOptions} */(options);
      var node = this.createElementNS('wfs:GetFeature');
      node.setAttribute('service', 'WFS');
      node.setAttribute('version', this.version);
      if (goog.isDef(options)) {
        if (goog.isDef(options.handle)) {
          node.setAttribute('handle', options.handle);
        }
        if (goog.isDef(options.outputFormat)) {
          node.setAttribute('outputFormat', options.outputFormat);
        }
        if (goog.isDef(options.maxFeatures)) {
          node.setAttribute('maxFeatures', options.maxFeatures);
        }
      }
      for (var i = 0, ii = options.featureTypes.length; i < ii; i++) {
        options.featureType = options.featureTypes[i];
        this.writeNode('Query', options, null, node);
      }
      this.setAttributeNS(
          node, 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation', this.schemaLocation);
      return {node: node, options: options};
    },
    'Transaction': function(obj) {
      obj = obj || {};
      var options = /** {ol.parser.WFSWriteOptions} */(obj.options || {});
      var node = this.createElementNS('wfs:Transaction');
      node.setAttribute('service', 'WFS');
      node.setAttribute('version', this.version);
      if (goog.isDef(options.handle)) {
        node.setAttribute('handle', options.handle);
      }
      var i, ii;
      var features = obj.features;
      if (goog.isDefAndNotNull(features)) {
        // TODO implement multi option for geometry types
        var name, feature;
        for (i = 0, ii = features.length; i < ii; ++i) {
          feature = features[i];
          // TODO Update (use feature.getOriginal())
          // TODO Insert and Delete
          if (goog.isDef(name)) {
            this.writeNode(name, {
              feature: feature,
              options: options
            }, null, node);
          }
        }
      }
      if (goog.isDef(options.nativeElements)) {
        for (i = 0, ii = options.nativeElements.length; i < ii; ++i) {
          this.writeNode('Native', options.nativeElements[i], null, node);
        }
      }
      return node;
    },
    'Native': function(nativeElement) {
      var node = this.createElementNS('wfs:Native');
      node.setAttribute('vendorId', nativeElement.vendorId);
      node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
      node.appendChild(this.createTextNode(nativeElement.value));
      return node;
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.WFS_v1, ol.parser.XML);


/**
 * @return {ol.parser.ogc.Filter_v1_0_0|ol.parser.ogc.Filter_v1_1_0}
 */
ol.parser.ogc.WFS_v1.prototype.getFilterParser = function() {
  return this.filter_;
};


/**
 * @param {ol.parser.ogc.Filter_v1_0_0|ol.parser.ogc.Filter_v1_1_0} filter The
 *     Filter parser to use.
 * @protected
 */
ol.parser.ogc.WFS_v1.prototype.setFilterParser = function(filter) {
  this.filter_ = filter;
  if (goog.isDefAndNotNull(this.featureNS)) {
    filter.setFeatureNS(this.featureNS);
  }
  var uri, key;
  for (uri in this.filter_.readers) {
    for (key in this.filter_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      // do not overwrite any readers
      if (!goog.isDef(this.readers[uri][key])) {
        this.readers[uri][key] = goog.bind(this.filter_.readers[uri][key],
            this.filter_);
      }
    }
  }
  for (uri in this.filter_.writers) {
    for (key in this.filter_.writers[uri]) {
      if (!goog.isDef(this.writers[uri])) {
        this.writers[uri] = {};
      }
      // do not overwrite any writers
      if (!goog.isDef(this.writers[uri][key])) {
        this.writers[uri][key] = goog.bind(this.filter_.writers[uri][key],
            this.filter_);
      }
    }
  }
};


/**
 * @param {string} featureType Feature type.
 */
ol.parser.ogc.WFS_v1.prototype.setFeatureType = function(featureType) {
  this.featureType = featureType;
  if (goog.isDefAndNotNull(this.filter_)) {
    this.filter_.setFeatureType(featureType);
  }
};


/**
 * @param {string} featureNS Feature namespace.
 */
ol.parser.ogc.WFS_v1.prototype.setFeatureNS = function(featureNS) {
  this.featureNS = featureNS;
  if (goog.isDefAndNotNull(this.filter_)) {
    this.setFilterParser(this.filter_);
  }
};


/**
 * @param {string} srsName SRS name.
 */
ol.parser.ogc.WFS_v1.prototype.setSrsName = function(srsName) {
  this.srsName = srsName;
  if (goog.isDefAndNotNull(this.filter_)) {
    this.filter_.setSrsName(this.srsName);
  }
};


/**
 * @param {string|Document|Element} data Data to read.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.WFS_v1.prototype.read = function(data) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {};
  this.readNode(data, obj);
  return obj;
};


/**
 * @param {Array.<ol.Feature>} features The features to write out.
 * @param {ol.parser.WFSWriteOptions} options Write options.
 * @return {string} A serialized WFS transaction.
 */
ol.parser.ogc.WFS_v1.prototype.write = function(features, options) {
  var root = this.writeNode('Transaction', {features: features,
    options: options});
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};
