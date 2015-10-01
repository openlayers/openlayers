goog.provide('ol.format.WFS');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.format.GML3');
goog.require('ol.format.GMLBase');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @classdesc
 * Feature format for reading and writing data in the WFS format.
 * By default, supports WFS version 1.1.0. You can pass a GML format
 * as option if you want to read a WFS that contains GML2 (WFS 1.0.0).
 * Also see {@link ol.format.GMLBase} which is used by this format.
 *
 * @constructor
 * @param {olx.format.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 * @api stable
 */
ol.format.WFS = function(opt_options) {
  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {Array.<string>|string|undefined}
   */
  this.featureType_ = options.featureType;

  /**
   * @private
   * @type {Object.<string, string>|string|undefined}
   */
  this.featureNS_ = options.featureNS;

  /**
   * @private
   * @type {ol.format.GMLBase}
   */
  this.gmlFormat_ = options.gmlFormat ?
      options.gmlFormat : new ol.format.GML3();

  /**
   * @private
   * @type {string}
   */
  this.schemaLocation_ = options.schemaLocation ?
      options.schemaLocation : ol.format.WFS.SCHEMA_LOCATION;

  goog.base(this);
};
goog.inherits(ol.format.WFS, ol.format.XMLFeature);


/**
 * @const
 * @type {string}
 */
ol.format.WFS.FEATURE_PREFIX = 'feature';


/**
 * @const
 * @type {string}
 */
ol.format.WFS.XMLNS = 'http://www.w3.org/2000/xmlns/';


/**
 * Number of features; bounds/extent.
 * @typedef {{numberOfFeatures: number,
 *            bounds: ol.Extent}}
 * @api stable
 */
ol.format.WFS.FeatureCollectionMetadata;


/**
 * Total deleted; total inserted; total updated; array of insert ids.
 * @typedef {{totalDeleted: number,
 *            totalInserted: number,
 *            totalUpdated: number,
 *            insertIds: Array.<string>}}
 * @api stable
 */
ol.format.WFS.TransactionResponse;


/**
 * @const
 * @type {string}
 */
ol.format.WFS.SCHEMA_LOCATION = 'http://www.opengis.net/wfs ' +
    'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd';


/**
 * Read all features from a WFS FeatureCollection.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.WFS.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readFeaturesFromNode = function(node, opt_options) {
  var context = {
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  };
  goog.object.extend(context, this.getReadOptions(node,
      opt_options ? opt_options : {}));
  var objectStack = [context];
  this.gmlFormat_.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS][
      'featureMember'] =
      ol.xml.makeArrayPusher(ol.format.GMLBase.prototype.readFeaturesInternal);
  var features = ol.xml.pushParseAndPop([],
      this.gmlFormat_.FEATURE_COLLECTION_PARSERS, node,
      objectStack, this.gmlFormat_);
  if (!features) {
    features = [];
  }
  return features;
};


/**
 * Read transaction response of the source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.format.WFS.TransactionResponse|undefined} Transaction response.
 * @api stable
 */
ol.format.WFS.prototype.readTransactionResponse = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readTransactionResponseFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.parse(source);
    return this.readTransactionResponseFromDocument(doc);
  } else {
    goog.asserts.fail('Unknown source type');
    return undefined;
  }
};


/**
 * Read feature collection metadata of the source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.format.WFS.FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 * @api stable
 */
ol.format.WFS.prototype.readFeatureCollectionMetadata = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFeatureCollectionMetadataFromNode(
        /** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.parse(source);
    return this.readFeatureCollectionMetadataFromDocument(doc);
  } else {
    goog.asserts.fail('Unknown source type');
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.format.WFS.FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromDocument =
    function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT,
      'doc.nodeType should be DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFeatureCollectionMetadataFromNode(n);
    }
  }
  return undefined;
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.FEATURE_COLLECTION_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'boundedBy': ol.xml.makeObjectPropertySetter(
        ol.format.GMLBase.prototype.readGeometryElement, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {ol.format.WFS.FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'FeatureCollection',
      'localName should be FeatureCollection');
  var result = {};
  var value = ol.format.XSD.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  result['numberOfFeatures'] = value;
  return ol.xml.pushParseAndPop(
      /** @type {ol.format.WFS.FeatureCollectionMetadata} */ (result),
      ol.format.WFS.FEATURE_COLLECTION_PARSERS_, node, [], this.gmlFormat_);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.TRANSACTION_SUMMARY_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'totalInserted': ol.xml.makeObjectPropertySetter(
        ol.format.XSD.readNonNegativeInteger),
    'totalUpdated': ol.xml.makeObjectPropertySetter(
        ol.format.XSD.readNonNegativeInteger),
    'totalDeleted': ol.xml.makeObjectPropertySetter(
        ol.format.XSD.readNonNegativeInteger)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Transaction Summary.
 * @private
 */
ol.format.WFS.readTransactionSummary_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(
      {}, ol.format.WFS.TRANSACTION_SUMMARY_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.OGC_FID_PARSERS_ = {
  'http://www.opengis.net/ogc': {
    'FeatureId': ol.xml.makeArrayPusher(function(node, objectStack) {
      return node.getAttribute('fid');
    })
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.WFS.fidParser_ = function(node, objectStack) {
  ol.xml.parseNode(ol.format.WFS.OGC_FID_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.INSERT_RESULTS_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'Feature': ol.format.WFS.fidParser_
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Insert results.
 * @private
 */
ol.format.WFS.readInsertResults_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(
      [], ol.format.WFS.INSERT_RESULTS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.TRANSACTION_RESPONSE_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'TransactionSummary': ol.xml.makeObjectPropertySetter(
        ol.format.WFS.readTransactionSummary_, 'transactionSummary'),
    'InsertResults': ol.xml.makeObjectPropertySetter(
        ol.format.WFS.readInsertResults_, 'insertIds')
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.format.WFS.TransactionResponse|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT,
      'doc.nodeType should be DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readTransactionResponseFromNode(n);
    }
  }
  return undefined;
};


/**
 * @param {Node} node Node.
 * @return {ol.format.WFS.TransactionResponse|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should  be ELEMENT');
  goog.asserts.assert(node.localName == 'TransactionResponse',
      'localName should be TransactionResponse');
  return ol.xml.pushParseAndPop(
      /** @type {ol.format.WFS.TransactionResponse} */({}),
      ol.format.WFS.TRANSACTION_RESPONSE_PARSERS_, node, []);
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.WFS.QUERY_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'PropertyName': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeFeature_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var child = ol.xml.createElementNS(featureNS, featureType);
  node.appendChild(child);
  ol.format.GML3.prototype.writeFeatureElement(child, feature, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {number|string} fid Feature identifier.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeOgcFidFilter_ = function(node, fid, objectStack) {
  var filter = ol.xml.createElementNS('http://www.opengis.net/ogc', 'Filter');
  var child = ol.xml.createElementNS('http://www.opengis.net/ogc', 'FeatureId');
  filter.appendChild(child);
  child.setAttribute('fid', fid);
  node.appendChild(filter);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeDelete_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  featurePrefix = featurePrefix ? featurePrefix :
      ol.format.WFS.FEATURE_PREFIX;
  var featureNS = context['featureNS'];
  node.setAttribute('typeName', featurePrefix + ':' + featureType);
  ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid) {
    ol.format.WFS.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeUpdate_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  featurePrefix = featurePrefix ? featurePrefix :
      ol.format.WFS.FEATURE_PREFIX;
  var featureNS = context['featureNS'];
  node.setAttribute('typeName', featurePrefix + ':' + featureType);
  ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid) {
    var keys = feature.getKeys();
    var values = [];
    for (var i = 0, ii = keys.length; i < ii; i++) {
      var value = feature.get(keys[i]);
      if (value !== undefined) {
        values.push({name: keys[i], value: value});
      }
    }
    ol.xml.pushSerializeAndPop({node: node, srsName:
          context['srsName']},
    ol.format.WFS.TRANSACTION_SERIALIZERS_,
    ol.xml.makeSimpleNodeFactory('Property'), values,
    objectStack);
    ol.format.WFS.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} pair Property name and value.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeProperty_ = function(node, pair, objectStack) {
  var name = ol.xml.createElementNS('http://www.opengis.net/wfs', 'Name');
  node.appendChild(name);
  ol.format.XSD.writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    var value = ol.xml.createElementNS('http://www.opengis.net/wfs', 'Value');
    node.appendChild(value);
    if (pair.value instanceof ol.geom.Geometry) {
      ol.format.GML3.prototype.writeGeometryElement(value,
          pair.value, objectStack);
    } else {
      ol.format.XSD.writeStringTextNode(value, pair.value);
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {{vendorId: string, safeToIgnore: boolean, value: string}}
 *     nativeElement The native element.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeNative_ = function(node, nativeElement, objectStack) {
  if (nativeElement.vendorId) {
    node.setAttribute('vendorId', nativeElement.vendorId);
  }
  if (nativeElement.safeToIgnore !== undefined) {
    node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
  }
  if (nativeElement.value !== undefined) {
    ol.format.XSD.writeStringTextNode(node, nativeElement.value);
  }
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.WFS.TRANSACTION_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Insert': ol.xml.makeChildAppender(ol.format.WFS.writeFeature_),
    'Update': ol.xml.makeChildAppender(ol.format.WFS.writeUpdate_),
    'Delete': ol.xml.makeChildAppender(ol.format.WFS.writeDelete_),
    'Property': ol.xml.makeChildAppender(ol.format.WFS.writeProperty_),
    'Native': ol.xml.makeChildAppender(ol.format.WFS.writeNative_)
  }
};


/**
 * @param {Node} node Node.
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeQuery_ = function(node, featureType, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var propertyNames = context['propertyNames'];
  var srsName = context['srsName'];
  var prefix = featurePrefix ? featurePrefix + ':' : '';
  node.setAttribute('typeName', prefix + featureType);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
        featureNS);
  }
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.QUERY_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
  var bbox = context['bbox'];
  if (bbox) {
    var child = ol.xml.createElementNS('http://www.opengis.net/ogc', 'Filter');
    ol.format.WFS.writeOgcBBOX_(child, bbox, objectStack);
    node.appendChild(child);
  }
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeOgcPropertyName_ = function(node, value, objectStack) {
  var property = ol.xml.createElementNS('http://www.opengis.net/ogc',
      'PropertyName');
  ol.format.XSD.writeStringTextNode(property, value);
  node.appendChild(property);
};


/**
 * @param {Node} node Node.
 * @param {ol.Extent} bbox Bounding box.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeOgcBBOX_ = function(node, bbox, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var geometryName = context['geometryName'];
  var bboxNode = ol.xml.createElementNS('http://www.opengis.net/ogc', 'BBOX');
  node.appendChild(bboxNode);
  ol.format.WFS.writeOgcPropertyName_(bboxNode, geometryName, objectStack);
  ol.format.GML3.prototype.writeGeometryElement(bboxNode, bbox, objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.WFS.GETFEATURE_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Query': ol.xml.makeChildAppender(
        ol.format.WFS.writeQuery_)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<{string}>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeGetFeature_ = function(node, featureTypes, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('Query'), featureTypes,
      objectStack);
};


/**
 * Encode format as WFS `GetFeature` and return the Node.
 *
 * @param {olx.format.WFSWriteGetFeatureOptions} options Options.
 * @return {Node} Result.
 * @api stable
 */
ol.format.WFS.prototype.writeGetFeature = function(options) {
  var node = ol.xml.createElementNS('http://www.opengis.net/wfs',
      'GetFeature');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
  if (options) {
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
    if (options.outputFormat) {
      node.setAttribute('outputFormat', options.outputFormat);
    }
    if (options.maxFeatures !== undefined) {
      node.setAttribute('maxFeatures', options.maxFeatures);
    }
    if (options.resultType) {
      node.setAttribute('resultType', options.resultType);
    }
    if (options.startIndex !== undefined) {
      node.setAttribute('startIndex', options.startIndex);
    }
    if (options.count !== undefined) {
      node.setAttribute('count', options.count);
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  var context = {
    node: node,
    srsName: options.srsName,
    featureNS: options.featureNS ? options.featureNS : this.featureNS_,
    featurePrefix: options.featurePrefix,
    geometryName: options.geometryName,
    bbox: options.bbox,
    propertyNames: options.propertyNames ? options.propertyNames : []
  };
  goog.asserts.assert(goog.isArray(options.featureTypes),
      'options.featureTypes should be an array');
  ol.format.WFS.writeGetFeature_(node, options.featureTypes, [context]);
  return node;
};


/**
 * Encode format as WFS `Transaction` and return the Node.
 *
 * @param {Array.<ol.Feature>} inserts The features to insert.
 * @param {Array.<ol.Feature>} updates The features to update.
 * @param {Array.<ol.Feature>} deletes The features to delete.
 * @param {olx.format.WFSWriteTransactionOptions} options Write options.
 * @return {Node} Result.
 * @api stable
 */
ol.format.WFS.prototype.writeTransaction = function(inserts, updates, deletes,
    options) {
  var objectStack = [];
  var node = ol.xml.createElementNS('http://www.opengis.net/wfs',
      'Transaction');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
  var baseObj, obj;
  if (options) {
    baseObj = options.gmlOptions ? options.gmlOptions : {};
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  if (inserts) {
    obj = {node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix};
    goog.object.extend(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Insert'), inserts,
        objectStack);
  }
  if (updates) {
    obj = {node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix};
    goog.object.extend(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Update'), updates,
        objectStack);
  }
  if (deletes) {
    ol.xml.pushSerializeAndPop({node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix},
    ol.format.WFS.TRANSACTION_SERIALIZERS_,
    ol.xml.makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (options.nativeElements) {
    ol.xml.pushSerializeAndPop({node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix},
    ol.format.WFS.TRANSACTION_SERIALIZERS_,
    ol.xml.makeSimpleNodeFactory('Native'), options.nativeElements,
    objectStack);
  }
  return node;
};


/**
 * Read the projection from a WFS source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {?ol.proj.Projection} Projection.
 * @api stable
 */
ol.format.WFS.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readProjectionFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT,
      'doc.nodeType should be a DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readProjectionFromNode(n);
    }
  }
  return null;
};


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readProjectionFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'FeatureCollection',
      'localName should be FeatureCollection');

  if (node.firstElementChild &&
      node.firstElementChild.firstElementChild) {
    node = node.firstElementChild.firstElementChild;
    for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (!(n.childNodes.length === 0 ||
          (n.childNodes.length === 1 &&
          n.firstChild.nodeType === 3))) {
        var objectStack = [{}];
        this.gmlFormat_.readGeometryElement(n, objectStack);
        return ol.proj.get(objectStack.pop().srsName);
      }
    }
  }

  return null;
};
