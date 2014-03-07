goog.provide('ol.format.WFS');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol.format.GML');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @constructor
 * @param {olx.format.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 * @todo stability experimental
 */
ol.format.WFS = function(opt_options) {
  var options = /** @type {olx.format.WFSOptions} */
      (goog.isDef(opt_options) ? opt_options : {});

  /**
   * @private
   * @type {string}
   */
  this.featureType_ = options.featureType;

  /**
   * @private
   * @type {string}
   */
  this.featureNS_ = options.featureNS;

  /**
   * @private
   * @type {string}
   */
  this.schemaLocation_ = goog.isDef(options.schemaLocation) ?
      options.schemaLocation : ol.format.WFS.schemaLocation_;

  goog.base(this);
};
goog.inherits(ol.format.WFS, ol.format.XMLFeature);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.WFS.schemaLocation_ = 'http://www.opengis.net/wfs ' +
    'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd';


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readFeaturesFromNode = function(node) {
  var objectStack = [{
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  }];
  var features = ol.xml.pushParseAndPop(null,
      ol.format.GML.FEATURE_COLLECTION_PARSERS, node, objectStack);
  if (!goog.isDef(features)) {
    features = [];
  }
  return features;
};


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Object|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponse = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readTransactionResponseFromNode(/** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readTransactionResponseFromDocument(doc);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Object|undefined} FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadata = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFeatureCollectionMetadataFromNode(
        /** @type {Node} */ (source));
  } else if (goog.isString(source)) {
    var doc = ol.xml.load(source);
    return this.readFeatureCollectionMetadataFromDocument(doc);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @return {Object|undefined} FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromDocument =
    function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFeatureCollectionMetadataFromNode(n);
    }
  }
  return null;
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WFS.FEATURE_COLLECTION_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'boundedBy': ol.xml.makeObjectPropertySetter(
        ol.format.GML.readGeometry, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {Object|undefined} FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'FeatureCollection');
  var result = {};
  var value = ol.format.XSD.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  goog.object.set(result, 'numberOfFeatures', value);
  return ol.xml.pushParseAndPop(
      result, ol.format.WFS.FEATURE_COLLECTION_PARSERS_, node, []);
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
  ol.xml.parse(ol.format.WFS.OGC_FID_PARSERS_, node, objectStack);
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
 * @return {Object|undefined} Insert results.
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
 * @return {Object|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readTransactionResponseFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Object|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'TransactionResponse');
  return ol.xml.pushParseAndPop({},
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
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeQuery_ = function(node, featureType, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var featurePrefix = goog.object.get(context, 'featurePrefix');
  var featureNS = goog.object.get(context, 'featureNS');
  var propertyNames = goog.object.get(context, 'propertyNames');
  var srsName = goog.object.get(context, 'srsName');
  var prefix = goog.isDef(featurePrefix) ? featurePrefix + ':' : '';
  node.setAttribute('typeName', prefix + featureType);
  node.setAttribute('srsName', srsName);
  if (goog.isDef(featureNS)) {
    node.setAttribute('xmlns:' + featurePrefix, featureNS);
  }
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.QUERY_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
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
  goog.asserts.assert(goog.isObject(context));
  var item = goog.object.clone(context);
  goog.object.set(item, 'node', node);
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('Query'), featureTypes,
      objectStack);
};


/**
 * @param {olx.format.WFSWriteGetFeatureOptions} options Options.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.WFS.prototype.writeGetFeature = function(options) {
  var node = ol.xml.createElementNS('http://www.opengis.net/wfs',
      'GetFeature');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
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
    if (goog.isDef(options.resultType)) {
      node.setAttribute('resultType', options.resultType);
    }
    if (goog.isDef(options.startIndex)) {
      node.setAttribute('startIndex', options.startIndex);
    }
    if (goog.isDef(options.count)) {
      node.setAttribute('count', options.count);
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  var context = {
    node: node,
    srsName: options.srsName,
    featureNS: goog.isDef(options.featureNS) ?
        options.featureNS : this.featureNS_,
    featurePrefix: options.featurePrefix,
    propertyNames: goog.isDef(options.propertyNames) ?
        options.propertyNames : []
  };
  goog.asserts.assert(goog.isArray(options.featureTypes));
  ol.format.WFS.writeGetFeature_(node, options.featureTypes, [context]);
  return node;
};
