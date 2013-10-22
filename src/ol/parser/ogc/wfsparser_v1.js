goog.provide('ol.parser.ogc.WFS_v1');
goog.require('goog.dom.xml');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @param {ol.parser.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.WFS_v1 = function(opt_options) {
  if (goog.isDef(opt_options)) {
    this.featureTypes = opt_options.featureTypes;
    this.featurePrefix = opt_options.featurePrefix;
    this.featureNS = opt_options.featureNS;
  }
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
      for (var i = 0, ii = this.featureTypes.length; i < ii; i++) {
        options.featureType = this.featureTypes[i];
        this.writeNode('Query', options, null, node);
      }
      this.setAttributeNS(
          node, 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation', this.schemaLocation);
      return node;
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.WFS_v1, ol.parser.XML);


/**
 * @param {ol.parser.ogc.Filter_v1_0_0|ol.parser.ogc.Filter_v1_1_0} filter The
 *     Filter parser to use.
 * @protected
 */
ol.parser.ogc.WFS_v1.prototype.setFilterParser = function(filter) {
  this.filter_ = filter;
  for (var uri in this.filter_.readers) {
    for (var key in this.filter_.readers[uri]) {
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
 * @param {Object} options Write options.
 * @return {string} A serialized WFS transaction.
 */
ol.parser.ogc.WFS_v1.prototype.write = function(features, options) {
  var root = this.writeNode('wfs:Transaction', {features: features,
    options: options});
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};
