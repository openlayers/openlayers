goog.provide('ol.format.WFS');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.format.GML2');
goog.require('ol.format.GML3');
goog.require('ol.format.GMLBase');
goog.require('ol.format.filter');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.obj');
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
 * @api
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
    options.schemaLocation :
    ol.format.WFS.SCHEMA_LOCATIONS[ol.format.WFS.DEFAULT_VERSION];

  ol.format.XMLFeature.call(this);
};
ol.inherits(ol.format.WFS, ol.format.XMLFeature);


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
 * @const
 * @type {string}
 */
ol.format.WFS.OGCNS = 'http://www.opengis.net/ogc';


/**
 * @const
 * @type {string}
 */
ol.format.WFS.WFSNS = 'http://www.opengis.net/wfs';


/**
 * @const
 * @type {string}
 */
ol.format.WFS.FESNS = 'http://www.opengis.net/fes';


/**
 * @const
 * @type {Object.<string, string>}
 */
ol.format.WFS.SCHEMA_LOCATIONS = {
  '1.1.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
  '1.0.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.0.0/wfs.xsd'
};


/**
 * @const
 * @type {string}
 */
ol.format.WFS.DEFAULT_VERSION = '1.1.0';


/**
 * Read all features from a WFS FeatureCollection.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
ol.format.WFS.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readFeaturesFromNode = function(node, opt_options) {
  var context = /** @type {ol.XmlNodeStackItem} */ ({
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  });
  ol.obj.assign(context, this.getReadOptions(node,
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
 * @return {ol.WFSTransactionResponse|undefined} Transaction response.
 * @api
 */
ol.format.WFS.prototype.readTransactionResponse = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readTransactionResponseFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    return this.readTransactionResponseFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * Read feature collection metadata of the source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.WFSFeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 * @api
 */
ol.format.WFS.prototype.readFeatureCollectionMetadata = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFeatureCollectionMetadataFromNode(
        /** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    return this.readFeatureCollectionMetadataFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.WFSFeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromDocument = function(doc) {
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFeatureCollectionMetadataFromNode(n);
    }
  }
  return undefined;
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @return {ol.WFSFeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
ol.format.WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  var result = {};
  var value = ol.format.XSD.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  result['numberOfFeatures'] = value;
  return ol.xml.pushParseAndPop(
      /** @type {ol.WFSFeatureCollectionMetadata} */ (result),
      ol.format.WFS.FEATURE_COLLECTION_PARSERS_, node, [], this.gmlFormat_);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @return {ol.WFSTransactionResponse|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromDocument = function(doc) {
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readTransactionResponseFromNode(n);
    }
  }
  return undefined;
};


/**
 * @param {Node} node Node.
 * @return {ol.WFSTransactionResponse|undefined} Transaction response.
 */
ol.format.WFS.prototype.readTransactionResponseFromNode = function(node) {
  return ol.xml.pushParseAndPop(
      /** @type {ol.WFSTransactionResponse} */({}),
      ol.format.WFS.TRANSACTION_RESPONSE_PARSERS_, node, []);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
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
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var gmlVersion = context['gmlVersion'];
  var child = ol.xml.createElementNS(featureNS, featureType);
  node.appendChild(child);
  if (gmlVersion === 2) {
    ol.format.GML2.prototype.writeFeatureElement(child, feature, objectStack);
  } else {
    ol.format.GML3.prototype.writeFeatureElement(child, feature, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {number|string} fid Feature identifier.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeOgcFidFilter_ = function(node, fid, objectStack) {
  var filter = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'Filter');
  var child = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'FeatureId');
  filter.appendChild(child);
  child.setAttribute('fid', fid);
  node.appendChild(filter);
};


/**
 * @param {string|undefined} featurePrefix The prefix of the feature.
 * @param {string} featureType The type of the feature.
 * @returns {string} The value of the typeName property.
 * @private
 */
ol.format.WFS.getTypeName_ = function(featurePrefix, featureType) {
  featurePrefix = featurePrefix ? featurePrefix :
    ol.format.WFS.FEATURE_PREFIX;
  var prefix = featurePrefix + ':';
  // The featureType already contains the prefix.
  if (featureType.indexOf(prefix) === 0) {
    return featureType;
  } else {
    return prefix + featureType;
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeDelete_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  ol.asserts.assert(feature.getId() !== undefined, 26); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = ol.format.WFS.getTypeName_(featurePrefix, featureType);
  node.setAttribute('typeName', typeName);
  ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid !== undefined) {
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
  ol.asserts.assert(feature.getId() !== undefined, 27); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = ol.format.WFS.getTypeName_(featurePrefix, featureType);
  var geometryName = feature.getGeometryName();
  node.setAttribute('typeName', typeName);
  ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid !== undefined) {
    var keys = feature.getKeys();
    var values = [];
    for (var i = 0, ii = keys.length; i < ii; i++) {
      var value = feature.get(keys[i]);
      if (value !== undefined) {
        var name = keys[i];
        if (value instanceof ol.geom.Geometry) {
          name = geometryName;
        }
        values.push({name: name, value: value});
      }
    }
    ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */ (
      {'gmlVersion': context['gmlVersion'], node: node,
        'hasZ': context['hasZ'], 'srsName': context['srsName']}),
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
  var name = ol.xml.createElementNS(ol.format.WFS.WFSNS, 'Name');
  var context = objectStack[objectStack.length - 1];
  var gmlVersion = context['gmlVersion'];
  node.appendChild(name);
  ol.format.XSD.writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    var value = ol.xml.createElementNS(ol.format.WFS.WFSNS, 'Value');
    node.appendChild(value);
    if (pair.value instanceof ol.geom.Geometry) {
      if (gmlVersion === 2) {
        ol.format.GML2.prototype.writeGeometryElement(value,
            pair.value, objectStack);
      } else {
        ol.format.GML3.prototype.writeGeometryElement(value,
            pair.value, objectStack);
      }
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
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
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
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var propertyNames = context['propertyNames'];
  var srsName = context['srsName'];
  var typeName;
  // If feature prefix is not defined, we must not use the default prefix.
  if (featurePrefix) {
    typeName = ol.format.WFS.getTypeName_(featurePrefix, featureType);
  } else {
    typeName = featureType;
  }
  node.setAttribute('typeName', typeName);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    ol.xml.setAttributeNS(node, ol.format.WFS.XMLNS, 'xmlns:' + featurePrefix,
        featureNS);
  }
  var item = /** @type {ol.XmlNodeStackItem} */ (ol.obj.assign({}, context));
  item.node = node;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.QUERY_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
  var filter = context['filter'];
  if (filter) {
    var child = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'Filter');
    node.appendChild(child);
    ol.format.WFS.writeFilterCondition_(child, filter, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Filter} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeFilterCondition_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory(filter.getTagName()),
      [filter], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Bbox} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeBboxFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  ol.format.WFS.writeOgcPropertyName_(node, filter.geometryName);
  ol.format.GML3.prototype.writeGeometryElement(node, filter.extent, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Intersects} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeIntersectsFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  ol.format.WFS.writeOgcPropertyName_(node, filter.geometryName);
  ol.format.GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Within} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeWithinFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  ol.format.WFS.writeOgcPropertyName_(node, filter.geometryName);
  ol.format.GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.During} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeDuringFilter_ = function(node, filter, objectStack) {

  var valueReference = ol.xml.createElementNS(ol.format.WFS.FESNS, 'ValueReference');
  ol.format.XSD.writeStringTextNode(valueReference, filter.propertyName);
  node.appendChild(valueReference);

  var timePeriod = ol.xml.createElementNS(ol.format.GMLBase.GMLNS, 'TimePeriod');

  node.appendChild(timePeriod);

  var begin = ol.xml.createElementNS(ol.format.GMLBase.GMLNS, 'begin');
  timePeriod.appendChild(begin);
  ol.format.WFS.writeTimeInstant_(begin, filter.begin);

  var end = ol.xml.createElementNS(ol.format.GMLBase.GMLNS, 'end');
  timePeriod.appendChild(end);
  ol.format.WFS.writeTimeInstant_(end, filter.end);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.LogicalNary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeLogicalFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var conditions = filter.conditions;
  for (var i = 0, ii = conditions.length; i < ii; ++i) {
    var condition = conditions[i];
    ol.xml.pushSerializeAndPop(item,
        ol.format.WFS.GETFEATURE_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory(condition.getTagName()),
        [condition], objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Not} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeNotFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var condition = filter.condition;
  ol.xml.pushSerializeAndPop(item,
      ol.format.WFS.GETFEATURE_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory(condition.getTagName()),
      [condition], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.ComparisonBinary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeComparisonFilter_ = function(node, filter, objectStack) {
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  ol.format.WFS.writeOgcPropertyName_(node, filter.propertyName);
  ol.format.WFS.writeOgcLiteral_(node, '' + filter.expression);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsNull} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeIsNullFilter_ = function(node, filter, objectStack) {
  ol.format.WFS.writeOgcPropertyName_(node, filter.propertyName);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsBetween} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeIsBetweenFilter_ = function(node, filter, objectStack) {
  ol.format.WFS.writeOgcPropertyName_(node, filter.propertyName);

  var lowerBoundary = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'LowerBoundary');
  node.appendChild(lowerBoundary);
  ol.format.WFS.writeOgcLiteral_(lowerBoundary, '' + filter.lowerBoundary);

  var upperBoundary = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'UpperBoundary');
  node.appendChild(upperBoundary);
  ol.format.WFS.writeOgcLiteral_(upperBoundary, '' + filter.upperBoundary);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsLike} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeIsLikeFilter_ = function(node, filter, objectStack) {
  node.setAttribute('wildCard', filter.wildCard);
  node.setAttribute('singleChar', filter.singleChar);
  node.setAttribute('escapeChar', filter.escapeChar);
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  ol.format.WFS.writeOgcPropertyName_(node, filter.propertyName);
  ol.format.WFS.writeOgcLiteral_(node, '' + filter.pattern);
};


/**
 * @param {string} tagName Tag name.
 * @param {Node} node Node.
 * @param {string} value Value.
 * @private
 */
ol.format.WFS.writeOgcExpression_ = function(tagName, node, value) {
  var property = ol.xml.createElementNS(ol.format.WFS.OGCNS, tagName);
  ol.format.XSD.writeStringTextNode(property, value);
  node.appendChild(property);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
ol.format.WFS.writeOgcPropertyName_ = function(node, value) {
  ol.format.WFS.writeOgcExpression_('PropertyName', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
ol.format.WFS.writeOgcLiteral_ = function(node, value) {
  ol.format.WFS.writeOgcExpression_('Literal', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} time PropertyName value.
 * @private
 */
ol.format.WFS.writeTimeInstant_ = function(node, time) {
  var timeInstant = ol.xml.createElementNS(ol.format.GMLBase.GMLNS, 'TimeInstant');
  node.appendChild(timeInstant);

  var timePosition = ol.xml.createElementNS(ol.format.GMLBase.GMLNS, 'timePosition');
  timeInstant.appendChild(timePosition);
  ol.format.XSD.writeStringTextNode(timePosition, time);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.WFS.GETFEATURE_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Query': ol.xml.makeChildAppender(ol.format.WFS.writeQuery_)
  },
  'http://www.opengis.net/ogc': {
    'During': ol.xml.makeChildAppender(ol.format.WFS.writeDuringFilter_),
    'And': ol.xml.makeChildAppender(ol.format.WFS.writeLogicalFilter_),
    'Or': ol.xml.makeChildAppender(ol.format.WFS.writeLogicalFilter_),
    'Not': ol.xml.makeChildAppender(ol.format.WFS.writeNotFilter_),
    'BBOX': ol.xml.makeChildAppender(ol.format.WFS.writeBboxFilter_),
    'Intersects': ol.xml.makeChildAppender(ol.format.WFS.writeIntersectsFilter_),
    'Within': ol.xml.makeChildAppender(ol.format.WFS.writeWithinFilter_),
    'PropertyIsEqualTo': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsNotEqualTo': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsLessThan': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsLessThanOrEqualTo': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsGreaterThan': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsGreaterThanOrEqualTo': ol.xml.makeChildAppender(ol.format.WFS.writeComparisonFilter_),
    'PropertyIsNull': ol.xml.makeChildAppender(ol.format.WFS.writeIsNullFilter_),
    'PropertyIsBetween': ol.xml.makeChildAppender(ol.format.WFS.writeIsBetweenFilter_),
    'PropertyIsLike': ol.xml.makeChildAppender(ol.format.WFS.writeIsLikeFilter_)
  }
};


/**
 * Encode filter as WFS `Filter` and return the Node.
 *
 * @param {ol.format.filter.Filter} filter Filter.
 * @return {Node} Result.
 * @api
 */
ol.format.WFS.writeFilter = function(filter) {
  var child = ol.xml.createElementNS(ol.format.WFS.OGCNS, 'Filter');
  ol.format.WFS.writeFilterCondition_(child, filter, []);
  return child;
};


/**
 * @param {Node} node Node.
 * @param {Array.<string>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.WFS.writeGetFeature_ = function(node, featureTypes, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var item = /** @type {ol.XmlNodeStackItem} */ (ol.obj.assign({}, context));
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
 * @api
 */
ol.format.WFS.prototype.writeGetFeature = function(options) {
  var node = ol.xml.createElementNS(ol.format.WFS.WFSNS, 'GetFeature');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
  var filter;
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
    filter = options.filter;
    if (options.bbox) {
      ol.asserts.assert(options.geometryName,
          12); // `options.geometryName` must also be provided when `options.bbox` is set
      var bbox = ol.format.filter.bbox(
          /** @type {string} */ (options.geometryName), options.bbox, options.srsName);
      if (filter) {
        // if bbox and filter are both set, combine the two into a single filter
        filter = ol.format.filter.and(filter, bbox);
      } else {
        filter = bbox;
      }
    }
  }
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation_);
  /** @type {ol.XmlNodeStackItem} */
  var context = {
    node: node,
    'srsName': options.srsName,
    'featureNS': options.featureNS ? options.featureNS : this.featureNS_,
    'featurePrefix': options.featurePrefix,
    'geometryName': options.geometryName,
    'filter': filter,
    'propertyNames': options.propertyNames ? options.propertyNames : []
  };
  ol.asserts.assert(Array.isArray(options.featureTypes),
      11); // `options.featureTypes` should be an Array
  ol.format.WFS.writeGetFeature_(node, /** @type {!Array.<string>} */ (options.featureTypes), [context]);
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
 * @api
 */
ol.format.WFS.prototype.writeTransaction = function(inserts, updates, deletes,
    options) {
  var objectStack = [];
  var node = ol.xml.createElementNS(ol.format.WFS.WFSNS, 'Transaction');
  var version = options.version ?
    options.version : ol.format.WFS.DEFAULT_VERSION;
  var gmlVersion = version === '1.0.0' ? 2 : 3;
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', version);
  var baseObj;
  /** @type {ol.XmlNodeStackItem} */
  var obj;
  if (options) {
    baseObj = options.gmlOptions ? options.gmlOptions : {};
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
  }
  var schemaLocation = ol.format.WFS.SCHEMA_LOCATIONS[version];
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', schemaLocation);
  var featurePrefix = options.featurePrefix ? options.featurePrefix : ol.format.WFS.FEATURE_PREFIX;
  if (inserts) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    ol.obj.assign(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Insert'), inserts,
        objectStack);
  }
  if (updates) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    ol.obj.assign(obj, baseObj);
    ol.xml.pushSerializeAndPop(obj,
        ol.format.WFS.TRANSACTION_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory('Update'), updates,
        objectStack);
  }
  if (deletes) {
    ol.xml.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    ol.format.WFS.TRANSACTION_SERIALIZERS_,
    ol.xml.makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (options.nativeElements) {
    ol.xml.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
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
 * @api
 */
ol.format.WFS.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readProjectionFromDocument = function(doc) {
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readProjectionFromNode(n);
    }
  }
  return null;
};


/**
 * @inheritDoc
 */
ol.format.WFS.prototype.readProjectionFromNode = function(node) {
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
