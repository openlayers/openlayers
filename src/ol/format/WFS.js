/**
 * @module ol/format/WFS
 */
import {inherits} from '../index.js';
import _ol_asserts_ from '../asserts.js';
import GML2 from '../format/GML2.js';
import GML3 from '../format/GML3.js';
import GMLBase from '../format/GMLBase.js';
import _ol_format_filter_ from '../format/filter.js';
import XMLFeature from '../format/XMLFeature.js';
import _ol_format_XSD_ from '../format/XSD.js';
import Geometry from '../geom/Geometry.js';
import _ol_obj_ from '../obj.js';
import {get as getProjection} from '../proj.js';
import _ol_xml_ from '../xml.js';

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
var WFS = function(opt_options) {
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
    options.gmlFormat : new GML3();

  /**
   * @private
   * @type {string}
   */
  this.schemaLocation_ = options.schemaLocation ?
    options.schemaLocation :
    WFS.SCHEMA_LOCATIONS[WFS.DEFAULT_VERSION];

  XMLFeature.call(this);
};

inherits(WFS, XMLFeature);


/**
 * @const
 * @type {string}
 */
WFS.FEATURE_PREFIX = 'feature';


/**
 * @const
 * @type {string}
 */
WFS.XMLNS = 'http://www.w3.org/2000/xmlns/';


/**
 * @const
 * @type {string}
 */
WFS.OGCNS = 'http://www.opengis.net/ogc';


/**
 * @const
 * @type {string}
 */
WFS.WFSNS = 'http://www.opengis.net/wfs';


/**
 * @const
 * @type {string}
 */
WFS.FESNS = 'http://www.opengis.net/fes';


/**
 * @const
 * @type {Object.<string, string>}
 */
WFS.SCHEMA_LOCATIONS = {
  '1.1.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
  '1.0.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.0.0/wfs.xsd'
};


/**
 * @const
 * @type {string}
 */
WFS.DEFAULT_VERSION = '1.1.0';


/**
 * @return {Array.<string>|string|undefined} featureType
 */
WFS.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @param {Array.<string>|string|undefined} featureType Feature type(s) to parse.
 */
WFS.prototype.setFeatureType = function(featureType) {
  this.featureType_ = featureType;
};


/**
 * Read all features from a WFS FeatureCollection.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
WFS.prototype.readFeatures;


/**
 * @inheritDoc
 */
WFS.prototype.readFeaturesFromNode = function(node, opt_options) {
  var context = /** @type {ol.XmlNodeStackItem} */ ({
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  });
  _ol_obj_.assign(context, this.getReadOptions(node,
      opt_options ? opt_options : {}));
  var objectStack = [context];
  this.gmlFormat_.FEATURE_COLLECTION_PARSERS[GMLBase.GMLNS][
      'featureMember'] =
      _ol_xml_.makeArrayPusher(GMLBase.prototype.readFeaturesInternal);
  var features = _ol_xml_.pushParseAndPop([],
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
WFS.prototype.readTransactionResponse = function(source) {
  if (_ol_xml_.isDocument(source)) {
    return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source));
  } else if (_ol_xml_.isNode(source)) {
    return this.readTransactionResponseFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
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
WFS.prototype.readFeatureCollectionMetadata = function(source) {
  if (_ol_xml_.isDocument(source)) {
    return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source));
  } else if (_ol_xml_.isNode(source)) {
    return this.readFeatureCollectionMetadataFromNode(
        /** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
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
WFS.prototype.readFeatureCollectionMetadataFromDocument = function(doc) {
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
WFS.FEATURE_COLLECTION_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'boundedBy': _ol_xml_.makeObjectPropertySetter(
        GMLBase.prototype.readGeometryElement, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {ol.WFSFeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  var result = {};
  var value = _ol_format_XSD_.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  result['numberOfFeatures'] = value;
  return _ol_xml_.pushParseAndPop(
      /** @type {ol.WFSFeatureCollectionMetadata} */ (result),
      WFS.FEATURE_COLLECTION_PARSERS_, node, [], this.gmlFormat_);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WFS.TRANSACTION_SUMMARY_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'totalInserted': _ol_xml_.makeObjectPropertySetter(
        _ol_format_XSD_.readNonNegativeInteger),
    'totalUpdated': _ol_xml_.makeObjectPropertySetter(
        _ol_format_XSD_.readNonNegativeInteger),
    'totalDeleted': _ol_xml_.makeObjectPropertySetter(
        _ol_format_XSD_.readNonNegativeInteger)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Transaction Summary.
 * @private
 */
WFS.readTransactionSummary_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WFS.TRANSACTION_SUMMARY_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WFS.OGC_FID_PARSERS_ = {
  'http://www.opengis.net/ogc': {
    'FeatureId': _ol_xml_.makeArrayPusher(function(node, objectStack) {
      return node.getAttribute('fid');
    })
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
WFS.fidParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(WFS.OGC_FID_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WFS.INSERT_RESULTS_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'Feature': WFS.fidParser_
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Insert results.
 * @private
 */
WFS.readInsertResults_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], WFS.INSERT_RESULTS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WFS.TRANSACTION_RESPONSE_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'TransactionSummary': _ol_xml_.makeObjectPropertySetter(
        WFS.readTransactionSummary_, 'transactionSummary'),
    'InsertResults': _ol_xml_.makeObjectPropertySetter(
        WFS.readInsertResults_, 'insertIds')
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.WFSTransactionResponse|undefined} Transaction response.
 */
WFS.prototype.readTransactionResponseFromDocument = function(doc) {
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
WFS.prototype.readTransactionResponseFromNode = function(node) {
  return _ol_xml_.pushParseAndPop(
      /** @type {ol.WFSTransactionResponse} */({}),
      WFS.TRANSACTION_RESPONSE_PARSERS_, node, []);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
WFS.QUERY_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'PropertyName': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeFeature_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var gmlVersion = context['gmlVersion'];
  var child = _ol_xml_.createElementNS(featureNS, featureType);
  node.appendChild(child);
  if (gmlVersion === 2) {
    GML2.prototype.writeFeatureElement(child, feature, objectStack);
  } else {
    GML3.prototype.writeFeatureElement(child, feature, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {number|string} fid Feature identifier.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeOgcFidFilter_ = function(node, fid, objectStack) {
  var filter = _ol_xml_.createElementNS(WFS.OGCNS, 'Filter');
  var child = _ol_xml_.createElementNS(WFS.OGCNS, 'FeatureId');
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
WFS.getTypeName_ = function(featurePrefix, featureType) {
  featurePrefix = featurePrefix ? featurePrefix :
    WFS.FEATURE_PREFIX;
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
WFS.writeDelete_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  _ol_asserts_.assert(feature.getId() !== undefined, 26); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = WFS.getTypeName_(featurePrefix, featureType);
  node.setAttribute('typeName', typeName);
  _ol_xml_.setAttributeNS(node, WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid !== undefined) {
    WFS.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeUpdate_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  _ol_asserts_.assert(feature.getId() !== undefined, 27); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = WFS.getTypeName_(featurePrefix, featureType);
  var geometryName = feature.getGeometryName();
  node.setAttribute('typeName', typeName);
  _ol_xml_.setAttributeNS(node, WFS.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid !== undefined) {
    var keys = feature.getKeys();
    var values = [];
    for (var i = 0, ii = keys.length; i < ii; i++) {
      var value = feature.get(keys[i]);
      if (value !== undefined) {
        var name = keys[i];
        if (value instanceof Geometry) {
          name = geometryName;
        }
        values.push({name: name, value: value});
      }
    }
    _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */ (
      {'gmlVersion': context['gmlVersion'], node: node,
        'hasZ': context['hasZ'], 'srsName': context['srsName']}),
    WFS.TRANSACTION_SERIALIZERS_,
    _ol_xml_.makeSimpleNodeFactory('Property'), values,
    objectStack);
    WFS.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} pair Property name and value.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeProperty_ = function(node, pair, objectStack) {
  var name = _ol_xml_.createElementNS(WFS.WFSNS, 'Name');
  var context = objectStack[objectStack.length - 1];
  var gmlVersion = context['gmlVersion'];
  node.appendChild(name);
  _ol_format_XSD_.writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    var value = _ol_xml_.createElementNS(WFS.WFSNS, 'Value');
    node.appendChild(value);
    if (pair.value instanceof Geometry) {
      if (gmlVersion === 2) {
        GML2.prototype.writeGeometryElement(value,
            pair.value, objectStack);
      } else {
        GML3.prototype.writeGeometryElement(value,
            pair.value, objectStack);
      }
    } else {
      _ol_format_XSD_.writeStringTextNode(value, pair.value);
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
WFS.writeNative_ = function(node, nativeElement, objectStack) {
  if (nativeElement.vendorId) {
    node.setAttribute('vendorId', nativeElement.vendorId);
  }
  if (nativeElement.safeToIgnore !== undefined) {
    node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
  }
  if (nativeElement.value !== undefined) {
    _ol_format_XSD_.writeStringTextNode(node, nativeElement.value);
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
WFS.TRANSACTION_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Insert': _ol_xml_.makeChildAppender(WFS.writeFeature_),
    'Update': _ol_xml_.makeChildAppender(WFS.writeUpdate_),
    'Delete': _ol_xml_.makeChildAppender(WFS.writeDelete_),
    'Property': _ol_xml_.makeChildAppender(WFS.writeProperty_),
    'Native': _ol_xml_.makeChildAppender(WFS.writeNative_)
  }
};


/**
 * @param {Node} node Node.
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeQuery_ = function(node, featureType, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var propertyNames = context['propertyNames'];
  var srsName = context['srsName'];
  var typeName;
  // If feature prefix is not defined, we must not use the default prefix.
  if (featurePrefix) {
    typeName = WFS.getTypeName_(featurePrefix, featureType);
  } else {
    typeName = featureType;
  }
  node.setAttribute('typeName', typeName);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    _ol_xml_.setAttributeNS(node, WFS.XMLNS, 'xmlns:' + featurePrefix,
        featureNS);
  }
  var item = /** @type {ol.XmlNodeStackItem} */ (_ol_obj_.assign({}, context));
  item.node = node;
  _ol_xml_.pushSerializeAndPop(item,
      WFS.QUERY_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
  var filter = context['filter'];
  if (filter) {
    var child = _ol_xml_.createElementNS(WFS.OGCNS, 'Filter');
    node.appendChild(child);
    WFS.writeFilterCondition_(child, filter, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Filter} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeFilterCondition_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  _ol_xml_.pushSerializeAndPop(item,
      WFS.GETFEATURE_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory(filter.getTagName()),
      [filter], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Bbox} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeBboxFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  WFS.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.extent, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Contains} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeContainsFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  WFS.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Intersects} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeIntersectsFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  WFS.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Within} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeWithinFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  WFS.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.During} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeDuringFilter_ = function(node, filter, objectStack) {

  var valueReference = _ol_xml_.createElementNS(WFS.FESNS, 'ValueReference');
  _ol_format_XSD_.writeStringTextNode(valueReference, filter.propertyName);
  node.appendChild(valueReference);

  var timePeriod = _ol_xml_.createElementNS(GMLBase.GMLNS, 'TimePeriod');

  node.appendChild(timePeriod);

  var begin = _ol_xml_.createElementNS(GMLBase.GMLNS, 'begin');
  timePeriod.appendChild(begin);
  WFS.writeTimeInstant_(begin, filter.begin);

  var end = _ol_xml_.createElementNS(GMLBase.GMLNS, 'end');
  timePeriod.appendChild(end);
  WFS.writeTimeInstant_(end, filter.end);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.LogicalNary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeLogicalFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var conditions = filter.conditions;
  for (var i = 0, ii = conditions.length; i < ii; ++i) {
    var condition = conditions[i];
    _ol_xml_.pushSerializeAndPop(item,
        WFS.GETFEATURE_SERIALIZERS_,
        _ol_xml_.makeSimpleNodeFactory(condition.getTagName()),
        [condition], objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Not} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeNotFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var condition = filter.condition;
  _ol_xml_.pushSerializeAndPop(item,
      WFS.GETFEATURE_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory(condition.getTagName()),
      [condition], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.ComparisonBinary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeComparisonFilter_ = function(node, filter, objectStack) {
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  WFS.writeOgcPropertyName_(node, filter.propertyName);
  WFS.writeOgcLiteral_(node, '' + filter.expression);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsNull} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeIsNullFilter_ = function(node, filter, objectStack) {
  WFS.writeOgcPropertyName_(node, filter.propertyName);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsBetween} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeIsBetweenFilter_ = function(node, filter, objectStack) {
  WFS.writeOgcPropertyName_(node, filter.propertyName);

  var lowerBoundary = _ol_xml_.createElementNS(WFS.OGCNS, 'LowerBoundary');
  node.appendChild(lowerBoundary);
  WFS.writeOgcLiteral_(lowerBoundary, '' + filter.lowerBoundary);

  var upperBoundary = _ol_xml_.createElementNS(WFS.OGCNS, 'UpperBoundary');
  node.appendChild(upperBoundary);
  WFS.writeOgcLiteral_(upperBoundary, '' + filter.upperBoundary);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsLike} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeIsLikeFilter_ = function(node, filter, objectStack) {
  node.setAttribute('wildCard', filter.wildCard);
  node.setAttribute('singleChar', filter.singleChar);
  node.setAttribute('escapeChar', filter.escapeChar);
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  WFS.writeOgcPropertyName_(node, filter.propertyName);
  WFS.writeOgcLiteral_(node, '' + filter.pattern);
};


/**
 * @param {string} tagName Tag name.
 * @param {Node} node Node.
 * @param {string} value Value.
 * @private
 */
WFS.writeOgcExpression_ = function(tagName, node, value) {
  var property = _ol_xml_.createElementNS(WFS.OGCNS, tagName);
  _ol_format_XSD_.writeStringTextNode(property, value);
  node.appendChild(property);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
WFS.writeOgcPropertyName_ = function(node, value) {
  WFS.writeOgcExpression_('PropertyName', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
WFS.writeOgcLiteral_ = function(node, value) {
  WFS.writeOgcExpression_('Literal', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} time PropertyName value.
 * @private
 */
WFS.writeTimeInstant_ = function(node, time) {
  var timeInstant = _ol_xml_.createElementNS(GMLBase.GMLNS, 'TimeInstant');
  node.appendChild(timeInstant);

  var timePosition = _ol_xml_.createElementNS(GMLBase.GMLNS, 'timePosition');
  timeInstant.appendChild(timePosition);
  _ol_format_XSD_.writeStringTextNode(timePosition, time);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
WFS.GETFEATURE_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Query': _ol_xml_.makeChildAppender(WFS.writeQuery_)
  },
  'http://www.opengis.net/ogc': {
    'During': _ol_xml_.makeChildAppender(WFS.writeDuringFilter_),
    'And': _ol_xml_.makeChildAppender(WFS.writeLogicalFilter_),
    'Or': _ol_xml_.makeChildAppender(WFS.writeLogicalFilter_),
    'Not': _ol_xml_.makeChildAppender(WFS.writeNotFilter_),
    'BBOX': _ol_xml_.makeChildAppender(WFS.writeBboxFilter_),
    'Contains': _ol_xml_.makeChildAppender(WFS.writeContainsFilter_),
    'Intersects': _ol_xml_.makeChildAppender(WFS.writeIntersectsFilter_),
    'Within': _ol_xml_.makeChildAppender(WFS.writeWithinFilter_),
    'PropertyIsEqualTo': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsNotEqualTo': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsLessThan': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsLessThanOrEqualTo': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsGreaterThan': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsGreaterThanOrEqualTo': _ol_xml_.makeChildAppender(WFS.writeComparisonFilter_),
    'PropertyIsNull': _ol_xml_.makeChildAppender(WFS.writeIsNullFilter_),
    'PropertyIsBetween': _ol_xml_.makeChildAppender(WFS.writeIsBetweenFilter_),
    'PropertyIsLike': _ol_xml_.makeChildAppender(WFS.writeIsLikeFilter_)
  }
};


/**
 * Encode filter as WFS `Filter` and return the Node.
 *
 * @param {ol.format.filter.Filter} filter Filter.
 * @return {Node} Result.
 * @api
 */
WFS.writeFilter = function(filter) {
  var child = _ol_xml_.createElementNS(WFS.OGCNS, 'Filter');
  WFS.writeFilterCondition_(child, filter, []);
  return child;
};


/**
 * @param {Node} node Node.
 * @param {Array.<string>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
WFS.writeGetFeature_ = function(node, featureTypes, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var item = /** @type {ol.XmlNodeStackItem} */ (_ol_obj_.assign({}, context));
  item.node = node;
  _ol_xml_.pushSerializeAndPop(item,
      WFS.GETFEATURE_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory('Query'), featureTypes,
      objectStack);
};


/**
 * Encode format as WFS `GetFeature` and return the Node.
 *
 * @param {olx.format.WFSWriteGetFeatureOptions} options Options.
 * @return {Node} Result.
 * @api
 */
WFS.prototype.writeGetFeature = function(options) {
  var node = _ol_xml_.createElementNS(WFS.WFSNS, 'GetFeature');
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
      _ol_asserts_.assert(options.geometryName,
          12); // `options.geometryName` must also be provided when `options.bbox` is set
      var bbox = _ol_format_filter_.bbox(
          /** @type {string} */ (options.geometryName), options.bbox, options.srsName);
      if (filter) {
        // if bbox and filter are both set, combine the two into a single filter
        filter = _ol_format_filter_.and(filter, bbox);
      } else {
        filter = bbox;
      }
    }
  }
  _ol_xml_.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
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
  _ol_asserts_.assert(Array.isArray(options.featureTypes),
      11); // `options.featureTypes` should be an Array
  WFS.writeGetFeature_(node, /** @type {!Array.<string>} */ (options.featureTypes), [context]);
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
WFS.prototype.writeTransaction = function(inserts, updates, deletes,
    options) {
  var objectStack = [];
  var node = _ol_xml_.createElementNS(WFS.WFSNS, 'Transaction');
  var version = options.version ?
    options.version : WFS.DEFAULT_VERSION;
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
  var schemaLocation = WFS.SCHEMA_LOCATIONS[version];
  _ol_xml_.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', schemaLocation);
  var featurePrefix = options.featurePrefix ? options.featurePrefix : WFS.FEATURE_PREFIX;
  if (inserts) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    _ol_obj_.assign(obj, baseObj);
    _ol_xml_.pushSerializeAndPop(obj,
        WFS.TRANSACTION_SERIALIZERS_,
        _ol_xml_.makeSimpleNodeFactory('Insert'), inserts,
        objectStack);
  }
  if (updates) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    _ol_obj_.assign(obj, baseObj);
    _ol_xml_.pushSerializeAndPop(obj,
        WFS.TRANSACTION_SERIALIZERS_,
        _ol_xml_.makeSimpleNodeFactory('Update'), updates,
        objectStack);
  }
  if (deletes) {
    _ol_xml_.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    WFS.TRANSACTION_SERIALIZERS_,
    _ol_xml_.makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (options.nativeElements) {
    _ol_xml_.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    WFS.TRANSACTION_SERIALIZERS_,
    _ol_xml_.makeSimpleNodeFactory('Native'), options.nativeElements,
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
WFS.prototype.readProjection;


/**
 * @inheritDoc
 */
WFS.prototype.readProjectionFromDocument = function(doc) {
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
WFS.prototype.readProjectionFromNode = function(node) {
  if (node.firstElementChild &&
      node.firstElementChild.firstElementChild) {
    node = node.firstElementChild.firstElementChild;
    for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (!(n.childNodes.length === 0 ||
          (n.childNodes.length === 1 &&
          n.firstChild.nodeType === 3))) {
        var objectStack = [{}];
        this.gmlFormat_.readGeometryElement(n, objectStack);
        return getProjection(objectStack.pop().srsName);
      }
    }
  }

  return null;
};
export default WFS;
