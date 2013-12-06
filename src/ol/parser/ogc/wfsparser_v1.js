goog.provide('ol.parser.ogc.WFS_v1');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('ol.expr.Call');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.geom.Geometry');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @extends {ol.parser.XML}
 * @param {Object=} opt_options Options which will be set on this object.
 */
ol.parser.ogc.WFS_v1 = function(opt_options) {
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
    /**
     * @param {ol.parser.WFSWriteGetFeatureOptions} options Options.
     * @return {{node: Node,
     *           options: ol.parser.WFSWriteGetFeatureOptions}} Object.
     * @this {ol.parser.XML}
     */
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
      for (var i = 0, ii = options.featureTypes.length; i < ii; i++) {
        options.featureType = options.featureTypes[i];
        this.writeNode('Query', options, null, node);
      }
      this.setAttributeNS(
          node, 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation', this.schemaLocation);
      return {node: node, options: options};
    },
    /**
     * @param {{inserts: Array.<ol.Feature>,
     *          updates: Array.<ol.Feature>,
     *          deletes: Array.<ol.Feature>,
     *          options: ol.parser.WFSWriteTransactionOptions}} obj Object.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Transaction': function(obj) {
      var options = obj.options;
      this.setFeatureType(options.featureType);
      this.setFeatureNS(options.featureNS);
      if (goog.isDef(options.srsName)) {
        this.setSrsName(options.srsName);
      }
      var node = this.createElementNS('wfs:Transaction');
      node.setAttribute('service', 'WFS');
      node.setAttribute('version', this.version);
      if (goog.isDef(options.handle)) {
        node.setAttribute('handle', options.handle);
      }
      var i, ii, features, feature;
      var operations = {
        'Insert': obj.inserts,
        'Update': obj.updates,
        'Delete': obj.deletes
      };
      for (var name in operations) {
        features = operations[name];
        if (!goog.isNull(features)) {
          // TODO implement multi option for geometry types
          for (i = 0, ii = features.length; i < ii; ++i) {
            feature = features[i];
            this.writeNode(name, {feature: feature, options: options}, null,
                node);
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
    /**
     * @param {{vendorId: string, safeToIgnore: boolean, value: string}}
     * nativeElement Native element.
     * @return {Node} Node.
     * @this {ol.parser.XML}
     */
    'Native': function(nativeElement) {
      var node = this.createElementNS('wfs:Native');
      node.setAttribute('vendorId', nativeElement.vendorId);
      node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
      node.appendChild(this.createTextNode(nativeElement.value));
      return node;
    },
    /**
     * @param {{feature: ol.Feature,
     *          options: ol.parser.WFSWriteTransactionOptions}} obj Object.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Insert': function(obj) {
      var feature = obj.feature;
      var options = obj.options;
      var node = this.createElementNS('wfs:Insert');
      if (goog.isDef(options) && goog.isDef(options.handle)) {
        this.setAttributeNS(node, this.defaultNamespaceURI, 'handle',
            options.handle);
      }
      if (goog.isDef(options.srsName)) {
        this.setSrsName(options.srsName);
      }
      this.writeNode('_typeName', feature, options.featureNS, node);
      return node;
    },
    /**
     * @param {{feature: ol.Feature,
     *          options: ol.parser.WFSWriteTransactionOptions}} obj Object.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Update': function(obj) {
      var feature = obj.feature;
      var options = obj.options;
      var node = this.createElementNS('wfs:Update');
      this.setAttributeNS(node, this.defaultNamespaceURI, 'typeName',
          (goog.isDef(options.featureNS) ? options.featurePrefix + ':' : '') +
          options.featureType);
      if (goog.isDef(options.handle)) {
        this.setAttributeNS(node, this.defaultNamespaceURI, 'handle',
            options.handle);
      }

      // add in fields
      var original = feature.getOriginal();
      var originalAttributes = goog.isNull(original) ?
          undefined : original.getAttributes();
      var attributes = feature.getAttributes();
      var attribute;
      for (var key in attributes) {
        attribute = attributes[key];
        // TODO Only add geometries whose values have changed
        if (goog.isDef(attribute) && (attribute instanceof ol.geom.Geometry ||
            (!goog.isDef(originalAttributes) ||
            attribute != originalAttributes[key]))) {
          this.writeNode('Property', {name: key, value: attribute}, null, node);
        }
      }

      // add feature id filter
      var fid = feature.getId();
      goog.asserts.assert(goog.isDef(fid));
      this.writeNode('Filter', new ol.expr.Call(new ol.expr.Identifier(
          ol.expr.functions.FID), [new ol.expr.Literal(fid)]),
          'http://www.opengis.net/ogc', node);

      return node;
    },
    'Property': function(obj) {
      var node = this.createElementNS('wfs:Property');
      this.writeNode('Name', obj.name, null, node);
      if (!goog.isNull(obj.value)) {
        this.writeNode('Value', obj.value, null, node);
      }
      return node;
    },
    /**
     * @param {string} name Name.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Name': function(name) {
      var node = this.createElementNS('wfs:Name');
      node.appendChild(this.createTextNode(name));
      return node;
    },
    /**
     * @param {string|number|ol.geom.Geometry} obj Object.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Value': function(obj) {
      var node;
      if (obj instanceof ol.geom.Geometry) {
        node = this.createElementNS('wfs:Value');
        node.appendChild(
            this.getFilterParser().getGmlParser().writeGeometry(obj));
      } else {
        node = this.createElementNS('wfs:Value');
        node.appendChild(this.createTextNode(/** @type {string} */ (obj)));
      }
      return node;
    },
    /**
     * @param {{feature: ol.Feature,
     *          options: ol.parser.WFSWriteTransactionOptions}} obj Object.
     * @return {Element} Node.
     * @this {ol.parser.XML}
     */
    'Delete': function(obj) {
      var feature = obj.feature;
      var options = obj.options;
      var node = this.createElementNS('wfs:Delete');
      this.setAttributeNS(node, this.defaultNamespaceURI, 'typeName',
          (goog.isDef(options.featureNS) ? options.featurePrefix + ':' : '') +
          options.featureType);
      if (goog.isDef(options.handle)) {
        this.setAttributeNS(node, this.defaultNamespaceURI, 'handle',
            options.handle);
      }
      var fid = feature.getId();
      goog.asserts.assert(goog.isDef(fid));
      this.writeNode('Filter', new ol.expr.Call(new ol.expr.Identifier(
          ol.expr.functions.FID), [new ol.expr.Literal(fid)]),
          'http://www.opengis.net/ogc', node);
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
 * @param {ol.parser.WFSWriteGetFeatureOptions} options Options.
 * @return {string} A serialized WFS GetFeature query.
 */
ol.parser.ogc.WFS_v1.prototype.writeGetFeature = function(options) {
  var root = this.writers[this.defaultNamespaceURI]['GetFeature']
      .call(this, options);
  return this.serialize(root);
};


/**
 * @param {Array.<ol.Feature>} inserts The features to insert.
 * @param {Array.<ol.Feature>} updates The features to update.
 * @param {Array.<ol.Feature>} deletes The features to delete.
 * @param {ol.parser.WFSWriteTransactionOptions} options Write options.
 * @return {string} A serialized WFS transaction.
 */
ol.parser.ogc.WFS_v1.prototype.writeTransaction =
    function(inserts, updates, deletes, options) {
  var root = this.writeNode('Transaction', {inserts: inserts,
    updates: updates, deletes: deletes, options: options});
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};
