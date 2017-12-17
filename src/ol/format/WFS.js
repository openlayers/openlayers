/**
 * @module ol/format/WFS
 */
import {inherits} from '../index.js';
import _ol_asserts_ from '../asserts.js';
import _ol_format_GML2_ from '../format/GML2.js';
import GML3 from '../format/GML3.js';
import _ol_format_GMLBase_ from '../format/GMLBase.js';
import _ol_format_filter_ from '../format/filter.js';
import _ol_format_XMLFeature_ from '../format/XMLFeature.js';
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
var _ol_format_WFS_ = function(opt_options) {
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
    _ol_format_WFS_.SCHEMA_LOCATIONS[_ol_format_WFS_.DEFAULT_VERSION];

  _ol_format_XMLFeature_.call(this);
};

inherits(_ol_format_WFS_, _ol_format_XMLFeature_);


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.FEATURE_PREFIX = 'feature';


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.XMLNS = 'http://www.w3.org/2000/xmlns/';


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.OGCNS = 'http://www.opengis.net/ogc';


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.WFSNS = 'http://www.opengis.net/wfs';


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.FESNS = 'http://www.opengis.net/fes';


/**
 * @const
 * @type {Object.<string, string>}
 */
_ol_format_WFS_.SCHEMA_LOCATIONS = {
  '1.1.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
  '1.0.0': 'http://www.opengis.net/wfs ' +
      'http://schemas.opengis.net/wfs/1.0.0/wfs.xsd'
};


/**
 * @const
 * @type {string}
 */
_ol_format_WFS_.DEFAULT_VERSION = '1.1.0';


/**
 * @return {Array.<string>|string|undefined} featureType
 */
_ol_format_WFS_.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @param {Array.<string>|string|undefined} featureType Feature type(s) to parse.
 */
_ol_format_WFS_.prototype.setFeatureType = function(featureType) {
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
_ol_format_WFS_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_WFS_.prototype.readFeaturesFromNode = function(node, opt_options) {
  var context = /** @type {ol.XmlNodeStackItem} */ ({
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  });
  _ol_obj_.assign(context, this.getReadOptions(node,
      opt_options ? opt_options : {}));
  var objectStack = [context];
  this.gmlFormat_.FEATURE_COLLECTION_PARSERS[_ol_format_GMLBase_.GMLNS][
      'featureMember'] =
      _ol_xml_.makeArrayPusher(_ol_format_GMLBase_.prototype.readFeaturesInternal);
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
_ol_format_WFS_.prototype.readTransactionResponse = function(source) {
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
_ol_format_WFS_.prototype.readFeatureCollectionMetadata = function(source) {
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
_ol_format_WFS_.prototype.readFeatureCollectionMetadataFromDocument = function(doc) {
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
_ol_format_WFS_.FEATURE_COLLECTION_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'boundedBy': _ol_xml_.makeObjectPropertySetter(
        _ol_format_GMLBase_.prototype.readGeometryElement, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {ol.WFSFeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
_ol_format_WFS_.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  var result = {};
  var value = _ol_format_XSD_.readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures'));
  result['numberOfFeatures'] = value;
  return _ol_xml_.pushParseAndPop(
      /** @type {ol.WFSFeatureCollectionMetadata} */ (result),
      _ol_format_WFS_.FEATURE_COLLECTION_PARSERS_, node, [], this.gmlFormat_);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WFS_.TRANSACTION_SUMMARY_PARSERS_ = {
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
_ol_format_WFS_.readTransactionSummary_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WFS_.TRANSACTION_SUMMARY_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WFS_.OGC_FID_PARSERS_ = {
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
_ol_format_WFS_.fidParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(_ol_format_WFS_.OGC_FID_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WFS_.INSERT_RESULTS_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'Feature': _ol_format_WFS_.fidParser_
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Insert results.
 * @private
 */
_ol_format_WFS_.readInsertResults_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], _ol_format_WFS_.INSERT_RESULTS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WFS_.TRANSACTION_RESPONSE_PARSERS_ = {
  'http://www.opengis.net/wfs': {
    'TransactionSummary': _ol_xml_.makeObjectPropertySetter(
        _ol_format_WFS_.readTransactionSummary_, 'transactionSummary'),
    'InsertResults': _ol_xml_.makeObjectPropertySetter(
        _ol_format_WFS_.readInsertResults_, 'insertIds')
  }
};


/**
 * @param {Document} doc Document.
 * @return {ol.WFSTransactionResponse|undefined} Transaction response.
 */
_ol_format_WFS_.prototype.readTransactionResponseFromDocument = function(doc) {
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
_ol_format_WFS_.prototype.readTransactionResponseFromNode = function(node) {
  return _ol_xml_.pushParseAndPop(
      /** @type {ol.WFSTransactionResponse} */({}),
      _ol_format_WFS_.TRANSACTION_RESPONSE_PARSERS_, node, []);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_WFS_.QUERY_SERIALIZERS_ = {
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
_ol_format_WFS_.writeFeature_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var gmlVersion = context['gmlVersion'];
  var child = _ol_xml_.createElementNS(featureNS, featureType);
  node.appendChild(child);
  if (gmlVersion === 2) {
    _ol_format_GML2_.prototype.writeFeatureElement(child, feature, objectStack);
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
_ol_format_WFS_.writeOgcFidFilter_ = function(node, fid, objectStack) {
  var filter = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'Filter');
  var child = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'FeatureId');
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
_ol_format_WFS_.getTypeName_ = function(featurePrefix, featureType) {
  featurePrefix = featurePrefix ? featurePrefix :
    _ol_format_WFS_.FEATURE_PREFIX;
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
_ol_format_WFS_.writeDelete_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  _ol_asserts_.assert(feature.getId() !== undefined, 26); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = _ol_format_WFS_.getTypeName_(featurePrefix, featureType);
  node.setAttribute('typeName', typeName);
  _ol_xml_.setAttributeNS(node, _ol_format_WFS_.XMLNS, 'xmlns:' + featurePrefix,
      featureNS);
  var fid = feature.getId();
  if (fid !== undefined) {
    _ol_format_WFS_.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeUpdate_ = function(node, feature, objectStack) {
  var context = objectStack[objectStack.length - 1];
  _ol_asserts_.assert(feature.getId() !== undefined, 27); // Features must have an id set
  var featureType = context['featureType'];
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var typeName = _ol_format_WFS_.getTypeName_(featurePrefix, featureType);
  var geometryName = feature.getGeometryName();
  node.setAttribute('typeName', typeName);
  _ol_xml_.setAttributeNS(node, _ol_format_WFS_.XMLNS, 'xmlns:' + featurePrefix,
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
    _ol_format_WFS_.TRANSACTION_SERIALIZERS_,
    _ol_xml_.makeSimpleNodeFactory('Property'), values,
    objectStack);
    _ol_format_WFS_.writeOgcFidFilter_(node, fid, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} pair Property name and value.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeProperty_ = function(node, pair, objectStack) {
  var name = _ol_xml_.createElementNS(_ol_format_WFS_.WFSNS, 'Name');
  var context = objectStack[objectStack.length - 1];
  var gmlVersion = context['gmlVersion'];
  node.appendChild(name);
  _ol_format_XSD_.writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    var value = _ol_xml_.createElementNS(_ol_format_WFS_.WFSNS, 'Value');
    node.appendChild(value);
    if (pair.value instanceof Geometry) {
      if (gmlVersion === 2) {
        _ol_format_GML2_.prototype.writeGeometryElement(value,
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
_ol_format_WFS_.writeNative_ = function(node, nativeElement, objectStack) {
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
_ol_format_WFS_.TRANSACTION_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Insert': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeFeature_),
    'Update': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeUpdate_),
    'Delete': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeDelete_),
    'Property': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeProperty_),
    'Native': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeNative_)
  }
};


/**
 * @param {Node} node Node.
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeQuery_ = function(node, featureType, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featurePrefix = context['featurePrefix'];
  var featureNS = context['featureNS'];
  var propertyNames = context['propertyNames'];
  var srsName = context['srsName'];
  var typeName;
  // If feature prefix is not defined, we must not use the default prefix.
  if (featurePrefix) {
    typeName = _ol_format_WFS_.getTypeName_(featurePrefix, featureType);
  } else {
    typeName = featureType;
  }
  node.setAttribute('typeName', typeName);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    _ol_xml_.setAttributeNS(node, _ol_format_WFS_.XMLNS, 'xmlns:' + featurePrefix,
        featureNS);
  }
  var item = /** @type {ol.XmlNodeStackItem} */ (_ol_obj_.assign({}, context));
  item.node = node;
  _ol_xml_.pushSerializeAndPop(item,
      _ol_format_WFS_.QUERY_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory('PropertyName'), propertyNames,
      objectStack);
  var filter = context['filter'];
  if (filter) {
    var child = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'Filter');
    node.appendChild(child);
    _ol_format_WFS_.writeFilterCondition_(child, filter, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Filter} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeFilterCondition_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  _ol_xml_.pushSerializeAndPop(item,
      _ol_format_WFS_.GETFEATURE_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory(filter.getTagName()),
      [filter], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Bbox} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeBboxFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  _ol_format_WFS_.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.extent, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Contains} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeContainsFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  _ol_format_WFS_.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Intersects} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeIntersectsFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  _ol_format_WFS_.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.Within} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeWithinFilter_ = function(node, filter, objectStack) {
  var context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  _ol_format_WFS_.writeOgcPropertyName_(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.During} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeDuringFilter_ = function(node, filter, objectStack) {

  var valueReference = _ol_xml_.createElementNS(_ol_format_WFS_.FESNS, 'ValueReference');
  _ol_format_XSD_.writeStringTextNode(valueReference, filter.propertyName);
  node.appendChild(valueReference);

  var timePeriod = _ol_xml_.createElementNS(_ol_format_GMLBase_.GMLNS, 'TimePeriod');

  node.appendChild(timePeriod);

  var begin = _ol_xml_.createElementNS(_ol_format_GMLBase_.GMLNS, 'begin');
  timePeriod.appendChild(begin);
  _ol_format_WFS_.writeTimeInstant_(begin, filter.begin);

  var end = _ol_xml_.createElementNS(_ol_format_GMLBase_.GMLNS, 'end');
  timePeriod.appendChild(end);
  _ol_format_WFS_.writeTimeInstant_(end, filter.end);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.LogicalNary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeLogicalFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var conditions = filter.conditions;
  for (var i = 0, ii = conditions.length; i < ii; ++i) {
    var condition = conditions[i];
    _ol_xml_.pushSerializeAndPop(item,
        _ol_format_WFS_.GETFEATURE_SERIALIZERS_,
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
_ol_format_WFS_.writeNotFilter_ = function(node, filter, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var item = {node: node};
  var condition = filter.condition;
  _ol_xml_.pushSerializeAndPop(item,
      _ol_format_WFS_.GETFEATURE_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory(condition.getTagName()),
      [condition], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.ComparisonBinary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeComparisonFilter_ = function(node, filter, objectStack) {
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  _ol_format_WFS_.writeOgcPropertyName_(node, filter.propertyName);
  _ol_format_WFS_.writeOgcLiteral_(node, '' + filter.expression);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsNull} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeIsNullFilter_ = function(node, filter, objectStack) {
  _ol_format_WFS_.writeOgcPropertyName_(node, filter.propertyName);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsBetween} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeIsBetweenFilter_ = function(node, filter, objectStack) {
  _ol_format_WFS_.writeOgcPropertyName_(node, filter.propertyName);

  var lowerBoundary = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'LowerBoundary');
  node.appendChild(lowerBoundary);
  _ol_format_WFS_.writeOgcLiteral_(lowerBoundary, '' + filter.lowerBoundary);

  var upperBoundary = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'UpperBoundary');
  node.appendChild(upperBoundary);
  _ol_format_WFS_.writeOgcLiteral_(upperBoundary, '' + filter.upperBoundary);
};


/**
 * @param {Node} node Node.
 * @param {ol.format.filter.IsLike} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeIsLikeFilter_ = function(node, filter, objectStack) {
  node.setAttribute('wildCard', filter.wildCard);
  node.setAttribute('singleChar', filter.singleChar);
  node.setAttribute('escapeChar', filter.escapeChar);
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  _ol_format_WFS_.writeOgcPropertyName_(node, filter.propertyName);
  _ol_format_WFS_.writeOgcLiteral_(node, '' + filter.pattern);
};


/**
 * @param {string} tagName Tag name.
 * @param {Node} node Node.
 * @param {string} value Value.
 * @private
 */
_ol_format_WFS_.writeOgcExpression_ = function(tagName, node, value) {
  var property = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, tagName);
  _ol_format_XSD_.writeStringTextNode(property, value);
  node.appendChild(property);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
_ol_format_WFS_.writeOgcPropertyName_ = function(node, value) {
  _ol_format_WFS_.writeOgcExpression_('PropertyName', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 * @private
 */
_ol_format_WFS_.writeOgcLiteral_ = function(node, value) {
  _ol_format_WFS_.writeOgcExpression_('Literal', node, value);
};


/**
 * @param {Node} node Node.
 * @param {string} time PropertyName value.
 * @private
 */
_ol_format_WFS_.writeTimeInstant_ = function(node, time) {
  var timeInstant = _ol_xml_.createElementNS(_ol_format_GMLBase_.GMLNS, 'TimeInstant');
  node.appendChild(timeInstant);

  var timePosition = _ol_xml_.createElementNS(_ol_format_GMLBase_.GMLNS, 'timePosition');
  timeInstant.appendChild(timePosition);
  _ol_format_XSD_.writeStringTextNode(timePosition, time);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_WFS_.GETFEATURE_SERIALIZERS_ = {
  'http://www.opengis.net/wfs': {
    'Query': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeQuery_)
  },
  'http://www.opengis.net/ogc': {
    'During': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeDuringFilter_),
    'And': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeLogicalFilter_),
    'Or': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeLogicalFilter_),
    'Not': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeNotFilter_),
    'BBOX': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeBboxFilter_),
    'Contains': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeContainsFilter_),
    'Intersects': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeIntersectsFilter_),
    'Within': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeWithinFilter_),
    'PropertyIsEqualTo': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsNotEqualTo': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsLessThan': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsLessThanOrEqualTo': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsGreaterThan': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsGreaterThanOrEqualTo': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeComparisonFilter_),
    'PropertyIsNull': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeIsNullFilter_),
    'PropertyIsBetween': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeIsBetweenFilter_),
    'PropertyIsLike': _ol_xml_.makeChildAppender(_ol_format_WFS_.writeIsLikeFilter_)
  }
};


/**
 * Encode filter as WFS `Filter` and return the Node.
 *
 * @param {ol.format.filter.Filter} filter Filter.
 * @return {Node} Result.
 * @api
 */
_ol_format_WFS_.writeFilter = function(filter) {
  var child = _ol_xml_.createElementNS(_ol_format_WFS_.OGCNS, 'Filter');
  _ol_format_WFS_.writeFilterCondition_(child, filter, []);
  return child;
};


/**
 * @param {Node} node Node.
 * @param {Array.<string>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_WFS_.writeGetFeature_ = function(node, featureTypes, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var item = /** @type {ol.XmlNodeStackItem} */ (_ol_obj_.assign({}, context));
  item.node = node;
  _ol_xml_.pushSerializeAndPop(item,
      _ol_format_WFS_.GETFEATURE_SERIALIZERS_,
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
_ol_format_WFS_.prototype.writeGetFeature = function(options) {
  var node = _ol_xml_.createElementNS(_ol_format_WFS_.WFSNS, 'GetFeature');
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
  _ol_format_WFS_.writeGetFeature_(node, /** @type {!Array.<string>} */ (options.featureTypes), [context]);
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
_ol_format_WFS_.prototype.writeTransaction = function(inserts, updates, deletes,
    options) {
  var objectStack = [];
  var node = _ol_xml_.createElementNS(_ol_format_WFS_.WFSNS, 'Transaction');
  var version = options.version ?
    options.version : _ol_format_WFS_.DEFAULT_VERSION;
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
  var schemaLocation = _ol_format_WFS_.SCHEMA_LOCATIONS[version];
  _ol_xml_.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', schemaLocation);
  var featurePrefix = options.featurePrefix ? options.featurePrefix : _ol_format_WFS_.FEATURE_PREFIX;
  if (inserts) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    _ol_obj_.assign(obj, baseObj);
    _ol_xml_.pushSerializeAndPop(obj,
        _ol_format_WFS_.TRANSACTION_SERIALIZERS_,
        _ol_xml_.makeSimpleNodeFactory('Insert'), inserts,
        objectStack);
  }
  if (updates) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    _ol_obj_.assign(obj, baseObj);
    _ol_xml_.pushSerializeAndPop(obj,
        _ol_format_WFS_.TRANSACTION_SERIALIZERS_,
        _ol_xml_.makeSimpleNodeFactory('Update'), updates,
        objectStack);
  }
  if (deletes) {
    _ol_xml_.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    _ol_format_WFS_.TRANSACTION_SERIALIZERS_,
    _ol_xml_.makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (options.nativeElements) {
    _ol_xml_.pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    _ol_format_WFS_.TRANSACTION_SERIALIZERS_,
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
_ol_format_WFS_.prototype.readProjection;


/**
 * @inheritDoc
 */
_ol_format_WFS_.prototype.readProjectionFromDocument = function(doc) {
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
_ol_format_WFS_.prototype.readProjectionFromNode = function(node) {
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
export default _ol_format_WFS_;
