goog.provide('ol.format.WFS');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol.format.GML');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @classdesc
 * Feature format for reading and writing data in the WFS format.
 * Currently only supports WFS version 1.1.0.
 * Also see {@link ol.format.GML} which is used by this format.
 *
 * @constructor
 * @param {olx.format.WFSOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 * @api stable
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
 */
ol.format.WFS.featurePrefix = 'feature';


/**
 * @const
 * @type {string}
 */
ol.format.WFS.xmlns = 'http://www.w3.org/2000/xmlns/';


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
 * @private
 */
ol.format.WFS.schemaLocation_ = 'http://www.opengis.net/wfs ' +
    'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd';


/**
 * Read all features from a WFS FeatureCollection.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
      goog.isDef(opt_options) ? opt_options : {}));
  var objectStack = [context];
  var features = ol.xml.pushParseAndPop([],
      ol.format.GML.FEATURE_COLLECTION_PARSERS, node, objectStack);
  if (!goog.isDef(features)) {
    features = [];
  }
  return features;
};


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
    var doc = ol.xml.load(source);
    return this.readTransactionResponseFromDocument(doc);
  } else {
    goog.asserts.fail();
    return undefined;
  }
};


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
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
    var doc = ol.xml.load(source);
    return this.readFeatureCollectionMetadataFromDocument(doc);
  } else {
    goog.asserts.fail();
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
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
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
        ol.format.GML.readGeometry, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {ol.format.WFS.FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'FeatureCollection');
  var result = {};
  var value = ol.format.XSD.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  goog.object.set(result, 'numberOfFeatures', value);
  return ol.xml.pushParseAndPop(
      /** @type {ol.format.WFS.FeatureCollectionMetadata} */ (result),
      ol.format.WFS.FEATURE_COLLECTION_PARSERS_, node, []);
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
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'TransactionResponse');
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
  goog.asserts.assert(goog.isObject(context));
  var featureType = goog.object.get(context, 'featureType');
  var featureNS = goog.object.get(context, 'featureNS');
  var child = ol.xml.createElementNS(featureNS, featureType);
  node.appendChild(child);
  ol.format.GML.writeFeature(child, feature, objectStack);
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
  goog.asserts.assert(goog.isObject(context));
  var featureType = goog.object.get(context, 'featureType');
  var featurePrefix = goog.object.get(context, 'featurePrefix');
  featurePrefix = goog.isDef(featurePrefix) ? featurePrefix :
      ol.format.WFS.featurePrefix;
  var featureNS = goog.object.get(context, 'featureNS');
  node.setAttribute('typeName', featurePrefix + ':' + featureType);
  ol.xml.setAttributeNS(node, ol.format.WFS.xmlns, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (goog.isDef(fid)) {
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
  goog.asserts.assert(goog.isObject(context));
  var featureType = goog.object.get(context, 'featureType');
  var featurePrefix = goog.object.get(context, 'featurePrefix');
  featurePrefix = goog.isDef(featurePrefix) ? featurePrefix :
      ol.format.WFS.featurePrefix;
  var featureNS = goog.object.get(context, 'featureNS');
  node.setAttribute('typeName', featurePrefix + ':' + featureType);
  ol.xml.setAttributeNS(node, ol.format.WFS.xmlns, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (goog.isDef(fid)) {
    var keys = feature.getKeys();
    var values = [];
    for (var i = 0, ii = keys.length; i < ii; i++) {
      var value = feature.get(keys[i]);
      if (goog.isDef(value)) {
        values.push({name: keys[i], value: value});
      }
    }
    ol.xml.pushSerializeAndPop({node: node, srsName:
          goog.object.get(context, 'srsName')},
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
  if (goog.isDefAndNotNull(pair.value)) {
    var value = ol.xml.createElementNS('http://www.opengis.net/wfs', 'Value');
    node.appendChild(value);
    if (pair.value instanceof ol.geom.Geometry) {
      ol.format.GML.writeGeometry(value, pair.value, objectStack);
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
  if (goog.isDef(nativeElement.vendorId)) {
    node.setAttribute('vendorId', nativeElement.vendorId);
  }
  if (goog.isDef(nativeElement.safeToIgnore)) {
    node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
  }
  if (goog.isDef(nativeElement.value)) {
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
  goog.asserts.assert(goog.isObject(context));
  var featurePrefix = goog.object.get(context, 'featurePrefix');
  var featureNS = goog.object.get(context, 'featureNS');
  var propertyNames = goog.object.get(context, 'propertyNames');
  var srsName = goog.object.get(context, 'srsName');
  var prefix = goog.isDef(featurePrefix) ? featurePrefix + ':' : '';
  node.setAttribute('typeName', prefix + featureType);
  if (goog.isDef(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  if (goog.isDef(featureNS)) {
    ol.xml.setAttributeNS(node, ol.format.WFS.xmlns, 'xmlns:' + featurePrefix,
        featureNS);
  }
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.QUERY_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
  var bbox = goog.object.get(context, 'bbox');
  if (goog.isDef(bbox)) {
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
  goog.asserts.assert(goog.isObject(context));
  var geometryName = goog.object.get(context, 'geometryName');
  var bboxNode = ol.xml.createElementNS('http://www.opengis.net/ogc', 'BBOX');
  node.appendChild(bboxNode);
  ol.format.WFS.writeOgcPropertyName_(bboxNode, geometryName, objectStack);
  ol.format.GML.writeGeometry(bboxNode, bbox, objectStack);
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
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('Query'), featureTypes,
      objectStack);
};


/**
 * @param {olx.format.WFSWriteGetFeatureOptions} options Options.
 * @return {Node} Result.
 * @api stable
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
    geometryName: options.geometryName,
    bbox: options.bbox,
    propertyNames: goog.isDef(options.propertyNames) ?
        options.propertyNames : []
  };
  goog.asserts.assert(goog.isArray(options.featureTypes));
  ol.format.WFS.writeGetFeature_(node, options.featureTypes, [context]);
  return node;
};


/**
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
  if (goog.isDef(options)) {
    baseObj = goog.isDef(options.gmlOptions) ? options.gmlOptions : {};
    if (goog.isDef(options.handle)) {
      node.setAttribute('handle', options.handle);
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  if (goog.isDefAndNotNull(inserts)) {
    obj = {node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix};
    goog.object.extend(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Insert'), inserts,
        objectStack);
  }
  if (goog.isDefAndNotNull(updates)) {
    obj = {node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix};
    goog.object.extend(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Update'), updates,
        objectStack);
  }
  if (goog.isDefAndNotNull(deletes)) {
    ol.xml.pushSerializeAndPop({node: node, featureNS: options.featureNS,
      featureType: options.featureType, featurePrefix: options.featurePrefix},
    ol.format.WFS.TRANSACTION_SERIALIZERS_,
    ol.xml.makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (goog.isDef(options.nativeElements)) {
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
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {?ol.proj.Projection} Projection.
 * @api stable
 */
ol.format.WFS.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readProjectionFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'FeatureCollection');
  node = node.firstElementChild.firstElementChild;
  if (goog.isDefAndNotNull(node)) {
    for (var n = node.firstElementChild; !goog.isNull(n);
        n = n.nextElementSibling) {
      if (!(n.childNodes.length === 0 ||
          (n.childNodes.length === 1 &&
          n.firstChild.nodeType === 3))) {
        var objectStack = [{}];
        ol.format.GML.readGeometry(n, objectStack);
        return ol.proj.get(objectStack.pop().srsName);
      }
    }
  }
  return null;
};
