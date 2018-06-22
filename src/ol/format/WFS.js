/**
 * @module ol/format/WFS
 */
import {inherits} from '../util.js';
import {assert} from '../asserts.js';
import GML2 from '../format/GML2.js';
import GML3 from '../format/GML3.js';
import GMLBase, {GMLNS} from '../format/GMLBase.js';
import {and as andFilter, bbox as bboxFilter} from '../format/filter.js';
import XMLFeature from '../format/XMLFeature.js';
import {readNonNegativeIntegerString, readNonNegativeInteger, writeStringTextNode} from '../format/xsd.js';
import Geometry from '../geom/Geometry.js';
import {assign} from '../obj.js';
import {get as getProjection} from '../proj.js';
import {createElementNS, isDocument, isNode, makeArrayPusher, makeChildAppender,
  makeObjectPropertySetter, makeSimpleNodeFactory, parse, parseNode,
  pushParseAndPop, pushSerializeAndPop, XML_SCHEMA_INSTANCE_URI} from '../xml.js';


/**
 * @typedef {Object} Options
 * @property {Object.<string, string>|string} [featureNS] The namespace URI used for features.
 * @property {Array.<string>|string} [featureType] The feature type to parse. Only used for read operations.
 * @property {module:ol/format/GMLBase} [gmlFormat] The GML format to use to parse the response. Default is `ol/format/GML3`.
 * @property {string} [schemaLocation] Optional schemaLocation to use for serialization, this will override the default.
 */


/**
 * @typedef {Object} WriteGetFeatureOptions
 * @property {string} featureNS The namespace URI used for features.
 * @property {string} featurePrefix The prefix for the feature namespace.
 * @property {Array.<string>} featureTypes The feature type names.
 * @property {string} [srsName] SRS name. No srsName attribute will be set on
 * geometries when this is not provided.
 * @property {string} [handle] Handle.
 * @property {string} [outputFormat] Output format.
 * @property {number} [maxFeatures] Maximum number of features to fetch.
 * @property {string} [geometryName] Geometry name to use in a BBOX filter.
 * @property {Array.<string>} [propertyNames] Optional list of property names to serialize.
 * @property {number} [startIndex] Start index to use for WFS paging. This is a
 * WFS 2.0 feature backported to WFS 1.1.0 by some Web Feature Services.
 * @property {number} [count] Number of features to retrieve when paging. This is a
 * WFS 2.0 feature backported to WFS 1.1.0 by some Web Feature Services. Please note that some
 * Web Feature Services have repurposed `maxfeatures` instead.
 * @property {module:ol/extent~Extent} [bbox] Extent to use for the BBOX filter.
 * @property {module:ol/format/filter/Filter} [filter] Filter condition. See
 * {@link module:ol/format/Filter} for more information.
 * @property {string} [resultType] Indicates what response should be returned,
 * E.g. `hits` only includes the `numberOfFeatures` attribute in the response and no features.
 */


/**
 * @typedef {Object} WriteTransactionOptions
 * @property {string} featureNS The namespace URI used for features.
 * @property {string} featurePrefix The prefix for the feature namespace.
 * @property {string} featureType The feature type name.
 * @property {string} [srsName] SRS name. No srsName attribute will be set on
 * geometries when this is not provided.
 * @property {string} [handle] Handle.
 * @property {boolean} [hasZ] Must be set to true if the transaction is for
 * a 3D layer. This will allow the Z coordinate to be included in the transaction.
 * @property {Array.<Object>} nativeElements Native elements. Currently not supported.
 * @property {module:ol/format/GMLBase~Options} [gmlOptions] GML options for the WFS transaction writer.
 * @property {string} [version='1.1.0'] WFS version to use for the transaction. Can be either `1.0.0` or `1.1.0`.
 */


/**
 * Number of features; bounds/extent.
 * @typedef {Object} FeatureCollectionMetadata
 * @property {number} numberOfFeatures
 * @property {module:ol/extent~Extent} bounds
 */


/**
 * Total deleted; total inserted; total updated; array of insert ids.
 * @typedef {Object} TransactionResponse
 * @property {number} totalDeleted
 * @property {number} totalInserted
 * @property {number} totalUpdated
 * @property {Array.<string>} insertIds
 */


/**
 * @type {string}
 */
const FEATURE_PREFIX = 'feature';


/**
 * @type {string}
 */
const XMLNS = 'http://www.w3.org/2000/xmlns/';


/**
 * @type {string}
 */
const OGCNS = 'http://www.opengis.net/ogc';


/**
 * @type {string}
 */
const WFSNS = 'http://www.opengis.net/wfs';


/**
 * @type {string}
 */
const FESNS = 'http://www.opengis.net/fes';


/**
 * @type {Object.<string, string>}
 */
const SCHEMA_LOCATIONS = {
  '1.1.0': 'http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
  '1.0.0': 'http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/wfs.xsd'
};


/**
 * @const
 * @type {string}
 */
const DEFAULT_VERSION = '1.1.0';


/**
 * @classdesc
 * Feature format for reading and writing data in the WFS format.
 * By default, supports WFS version 1.1.0. You can pass a GML format
 * as option if you want to read a WFS that contains GML2 (WFS 1.0.0).
 * Also see {@link module:ol/format/GMLBase~GMLBase} which is used by this format.
 *
 * @constructor
 * @param {module:ol/format/WFS~Options=} opt_options Optional configuration object.
 * @extends {module:ol/format/XMLFeature}
 * @api
 */
const WFS = function(opt_options) {
  const options = opt_options ? opt_options : {};

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
   * @type {module:ol/format/GMLBase}
   */
  this.gmlFormat_ = options.gmlFormat ?
    options.gmlFormat : new GML3();

  /**
   * @private
   * @type {string}
   */
  this.schemaLocation_ = options.schemaLocation ?
    options.schemaLocation : SCHEMA_LOCATIONS[DEFAULT_VERSION];

  XMLFeature.call(this);
};

inherits(WFS, XMLFeature);


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
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
WFS.prototype.readFeatures;


/**
 * @inheritDoc
 */
WFS.prototype.readFeaturesFromNode = function(node, opt_options) {
  const context = /** @type {module:ol/xml~NodeStackItem} */ ({
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  });
  assign(context, this.getReadOptions(node, opt_options ? opt_options : {}));
  const objectStack = [context];
  this.gmlFormat_.FEATURE_COLLECTION_PARSERS[GMLNS][
    'featureMember'] =
      makeArrayPusher(GMLBase.prototype.readFeaturesInternal);
  let features = pushParseAndPop([],
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
 * @return {module:ol/format/WFS~TransactionResponse|undefined} Transaction response.
 * @api
 */
WFS.prototype.readTransactionResponse = function(source) {
  if (isDocument(source)) {
    return this.readTransactionResponseFromDocument(
      /** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readTransactionResponseFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readTransactionResponseFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * Read feature collection metadata of the source.
 *
 * @param {Document|Node|Object|string} source Source.
 * @return {module:ol/format/WFS~FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 * @api
 */
WFS.prototype.readFeatureCollectionMetadata = function(source) {
  if (isDocument(source)) {
    return this.readFeatureCollectionMetadataFromDocument(
      /** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readFeatureCollectionMetadataFromNode(
      /** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readFeatureCollectionMetadataFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {module:ol/format/WFS~FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
WFS.prototype.readFeatureCollectionMetadataFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFeatureCollectionMetadataFromNode(n);
    }
  }
  return undefined;
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const FEATURE_COLLECTION_PARSERS = {
  'http://www.opengis.net/gml': {
    'boundedBy': makeObjectPropertySetter(
      GMLBase.prototype.readGeometryElement, 'bounds')
  }
};


/**
 * @param {Node} node Node.
 * @return {module:ol/format/WFS~FeatureCollectionMetadata|undefined}
 *     FeatureCollection metadata.
 */
WFS.prototype.readFeatureCollectionMetadataFromNode = function(node) {
  const result = {};
  const value = readNonNegativeIntegerString(
    node.getAttribute('numberOfFeatures'));
  result['numberOfFeatures'] = value;
  return pushParseAndPop(
    /** @type {module:ol/format/WFS~FeatureCollectionMetadata} */ (result),
    FEATURE_COLLECTION_PARSERS, node, [], this.gmlFormat_);
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const TRANSACTION_SUMMARY_PARSERS = {
  'http://www.opengis.net/wfs': {
    'totalInserted': makeObjectPropertySetter(readNonNegativeInteger),
    'totalUpdated': makeObjectPropertySetter(readNonNegativeInteger),
    'totalDeleted': makeObjectPropertySetter(readNonNegativeInteger)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Transaction Summary.
 */
function readTransactionSummary(node, objectStack) {
  return pushParseAndPop(
    {}, TRANSACTION_SUMMARY_PARSERS, node, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const OGC_FID_PARSERS = {
  'http://www.opengis.net/ogc': {
    'FeatureId': makeArrayPusher(function(node, objectStack) {
      return node.getAttribute('fid');
    })
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function fidParser(node, objectStack) {
  parseNode(OGC_FID_PARSERS, node, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const INSERT_RESULTS_PARSERS = {
  'http://www.opengis.net/wfs': {
    'Feature': fidParser
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Insert results.
 */
function readInsertResults(node, objectStack) {
  return pushParseAndPop(
    [], INSERT_RESULTS_PARSERS, node, objectStack);
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const TRANSACTION_RESPONSE_PARSERS = {
  'http://www.opengis.net/wfs': {
    'TransactionSummary': makeObjectPropertySetter(
      readTransactionSummary, 'transactionSummary'),
    'InsertResults': makeObjectPropertySetter(
      readInsertResults, 'insertIds')
  }
};


/**
 * @param {Document} doc Document.
 * @return {module:ol/format/WFS~TransactionResponse|undefined} Transaction response.
 */
WFS.prototype.readTransactionResponseFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readTransactionResponseFromNode(n);
    }
  }
  return undefined;
};


/**
 * @param {Node} node Node.
 * @return {module:ol/format/WFS~TransactionResponse|undefined} Transaction response.
 */
WFS.prototype.readTransactionResponseFromNode = function(node) {
  return pushParseAndPop(
    /** @type {module:ol/format/WFS~TransactionResponse} */({}),
    TRANSACTION_RESPONSE_PARSERS, node, []);
};


/**
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const QUERY_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'PropertyName': makeChildAppender(writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeFeature(node, feature, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const featureType = context['featureType'];
  const featureNS = context['featureNS'];
  const gmlVersion = context['gmlVersion'];
  const child = createElementNS(featureNS, featureType);
  node.appendChild(child);
  if (gmlVersion === 2) {
    GML2.prototype.writeFeatureElement(child, feature, objectStack);
  } else {
    GML3.prototype.writeFeatureElement(child, feature, objectStack);
  }
}


/**
 * @param {Node} node Node.
 * @param {number|string} fid Feature identifier.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeOgcFidFilter(node, fid, objectStack) {
  const filter = createElementNS(OGCNS, 'Filter');
  const child = createElementNS(OGCNS, 'FeatureId');
  filter.appendChild(child);
  child.setAttribute('fid', fid);
  node.appendChild(filter);
}


/**
 * @param {string|undefined} featurePrefix The prefix of the feature.
 * @param {string} featureType The type of the feature.
 * @returns {string} The value of the typeName property.
 */
function getTypeName(featurePrefix, featureType) {
  featurePrefix = featurePrefix ? featurePrefix : FEATURE_PREFIX;
  const prefix = featurePrefix + ':';
  // The featureType already contains the prefix.
  if (featureType.indexOf(prefix) === 0) {
    return featureType;
  } else {
    return prefix + featureType;
  }
}


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeDelete(node, feature, objectStack) {
  const context = objectStack[objectStack.length - 1];
  assert(feature.getId() !== undefined, 26); // Features must have an id set
  const featureType = context['featureType'];
  const featurePrefix = context['featurePrefix'];
  const featureNS = context['featureNS'];
  const typeName = getTypeName(featurePrefix, featureType);
  node.setAttribute('typeName', typeName);
  node.setAttributeNS(XMLNS, 'xmlns:' + featurePrefix, featureNS);
  const fid = feature.getId();
  if (fid !== undefined) {
    writeOgcFidFilter(node, fid, objectStack);
  }
}


/**
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const TRANSACTION_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'Insert': makeChildAppender(writeFeature),
    'Update': makeChildAppender(writeUpdate),
    'Delete': makeChildAppender(writeDelete),
    'Property': makeChildAppender(writeProperty),
    'Native': makeChildAppender(writeNative)
  }
};


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeUpdate(node, feature, objectStack) {
  const context = objectStack[objectStack.length - 1];
  assert(feature.getId() !== undefined, 27); // Features must have an id set
  const featureType = context['featureType'];
  const featurePrefix = context['featurePrefix'];
  const featureNS = context['featureNS'];
  const typeName = getTypeName(featurePrefix, featureType);
  const geometryName = feature.getGeometryName();
  node.setAttribute('typeName', typeName);
  node.setAttributeNS(XMLNS, 'xmlns:' + featurePrefix, featureNS);
  const fid = feature.getId();
  if (fid !== undefined) {
    const keys = feature.getKeys();
    const values = [];
    for (let i = 0, ii = keys.length; i < ii; i++) {
      const value = feature.get(keys[i]);
      if (value !== undefined) {
        let name = keys[i];
        if (value instanceof Geometry) {
          name = geometryName;
        }
        values.push({name: name, value: value});
      }
    }
    pushSerializeAndPop(/** @type {module:ol/xml~NodeStackItem} */ (
      {'gmlVersion': context['gmlVersion'], node: node,
        'hasZ': context['hasZ'], 'srsName': context['srsName']}),
    TRANSACTION_SERIALIZERS,
    makeSimpleNodeFactory('Property'), values,
    objectStack);
    writeOgcFidFilter(node, fid, objectStack);
  }
}


/**
 * @param {Node} node Node.
 * @param {Object} pair Property name and value.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeProperty(node, pair, objectStack) {
  const name = createElementNS(WFSNS, 'Name');
  const context = objectStack[objectStack.length - 1];
  const gmlVersion = context['gmlVersion'];
  node.appendChild(name);
  writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    const value = createElementNS(WFSNS, 'Value');
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
      writeStringTextNode(value, pair.value);
    }
  }
}


/**
 * @param {Node} node Node.
 * @param {{vendorId: string, safeToIgnore: boolean, value: string}}
 *     nativeElement The native element.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeNative(node, nativeElement, objectStack) {
  if (nativeElement.vendorId) {
    node.setAttribute('vendorId', nativeElement.vendorId);
  }
  if (nativeElement.safeToIgnore !== undefined) {
    node.setAttribute('safeToIgnore', nativeElement.safeToIgnore);
  }
  if (nativeElement.value !== undefined) {
    writeStringTextNode(node, nativeElement.value);
  }
}


/**
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const GETFEATURE_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'Query': makeChildAppender(writeQuery)
  },
  'http://www.opengis.net/ogc': {
    'During': makeChildAppender(writeDuringFilter),
    'And': makeChildAppender(writeLogicalFilter),
    'Or': makeChildAppender(writeLogicalFilter),
    'Not': makeChildAppender(writeNotFilter),
    'BBOX': makeChildAppender(writeBboxFilter),
    'Contains': makeChildAppender(writeContainsFilter),
    'Intersects': makeChildAppender(writeIntersectsFilter),
    'Within': makeChildAppender(writeWithinFilter),
    'PropertyIsEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNotEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNull': makeChildAppender(writeIsNullFilter),
    'PropertyIsBetween': makeChildAppender(writeIsBetweenFilter),
    'PropertyIsLike': makeChildAppender(writeIsLikeFilter)
  }
};


/**
 * @param {Node} node Node.
 * @param {string} featureType Feature type.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeQuery(node, featureType, objectStack) {
  const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const featurePrefix = context['featurePrefix'];
  const featureNS = context['featureNS'];
  const propertyNames = context['propertyNames'];
  const srsName = context['srsName'];
  let typeName;
  // If feature prefix is not defined, we must not use the default prefix.
  if (featurePrefix) {
    typeName = getTypeName(featurePrefix, featureType);
  } else {
    typeName = featureType;
  }
  node.setAttribute('typeName', typeName);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    node.setAttributeNS(XMLNS, 'xmlns:' + featurePrefix, featureNS);
  }
  const item = /** @type {module:ol/xml~NodeStackItem} */ (assign({}, context));
  item.node = node;
  pushSerializeAndPop(item,
    QUERY_SERIALIZERS,
    makeSimpleNodeFactory('PropertyName'), propertyNames,
    objectStack);
  const filter = context['filter'];
  if (filter) {
    const child = createElementNS(OGCNS, 'Filter');
    node.appendChild(child);
    writeFilterCondition(child, filter, objectStack);
  }
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Filter} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeFilterCondition(node, filter, objectStack) {
  /** @type {module:ol/xml~NodeStackItem} */
  const item = {node: node};
  pushSerializeAndPop(item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory(filter.getTagName()),
    [filter], objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Bbox} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeBboxFilter(node, filter, objectStack) {
  const context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  writeOgcPropertyName(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.extent, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Contains} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeContainsFilter(node, filter, objectStack) {
  const context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  writeOgcPropertyName(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Intersects} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeIntersectsFilter(node, filter, objectStack) {
  const context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  writeOgcPropertyName(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Within} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeWithinFilter(node, filter, objectStack) {
  const context = objectStack[objectStack.length - 1];
  context['srsName'] = filter.srsName;

  writeOgcPropertyName(node, filter.geometryName);
  GML3.prototype.writeGeometryElement(node, filter.geometry, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/During} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeDuringFilter(node, filter, objectStack) {

  const valueReference = createElementNS(FESNS, 'ValueReference');
  writeStringTextNode(valueReference, filter.propertyName);
  node.appendChild(valueReference);

  const timePeriod = createElementNS(GMLNS, 'TimePeriod');

  node.appendChild(timePeriod);

  const begin = createElementNS(GMLNS, 'begin');
  timePeriod.appendChild(begin);
  writeTimeInstant(begin, filter.begin);

  const end = createElementNS(GMLNS, 'end');
  timePeriod.appendChild(end);
  writeTimeInstant(end, filter.end);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/LogicalNary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeLogicalFilter(node, filter, objectStack) {
  /** @type {module:ol/xml~NodeStackItem} */
  const item = {node: node};
  const conditions = filter.conditions;
  for (let i = 0, ii = conditions.length; i < ii; ++i) {
    const condition = conditions[i];
    pushSerializeAndPop(item,
      GETFEATURE_SERIALIZERS,
      makeSimpleNodeFactory(condition.getTagName()),
      [condition], objectStack);
  }
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/Not} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeNotFilter(node, filter, objectStack) {
  /** @type {module:ol/xml~NodeStackItem} */
  const item = {node: node};
  const condition = filter.condition;
  pushSerializeAndPop(item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory(condition.getTagName()),
    [condition], objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/ComparisonBinary} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeComparisonFilter(node, filter, objectStack) {
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  writeOgcPropertyName(node, filter.propertyName);
  writeOgcLiteral(node, '' + filter.expression);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/IsNull} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeIsNullFilter(node, filter, objectStack) {
  writeOgcPropertyName(node, filter.propertyName);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/IsBetween} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeIsBetweenFilter(node, filter, objectStack) {
  writeOgcPropertyName(node, filter.propertyName);

  const lowerBoundary = createElementNS(OGCNS, 'LowerBoundary');
  node.appendChild(lowerBoundary);
  writeOgcLiteral(lowerBoundary, '' + filter.lowerBoundary);

  const upperBoundary = createElementNS(OGCNS, 'UpperBoundary');
  node.appendChild(upperBoundary);
  writeOgcLiteral(upperBoundary, '' + filter.upperBoundary);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/format/filter/IsLike} filter Filter.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeIsLikeFilter(node, filter, objectStack) {
  node.setAttribute('wildCard', filter.wildCard);
  node.setAttribute('singleChar', filter.singleChar);
  node.setAttribute('escapeChar', filter.escapeChar);
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  writeOgcPropertyName(node, filter.propertyName);
  writeOgcLiteral(node, '' + filter.pattern);
}


/**
 * @param {string} tagName Tag name.
 * @param {Node} node Node.
 * @param {string} value Value.
 */
function writeOgcExpression(tagName, node, value) {
  const property = createElementNS(OGCNS, tagName);
  writeStringTextNode(property, value);
  node.appendChild(property);
}


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 */
function writeOgcPropertyName(node, value) {
  writeOgcExpression('PropertyName', node, value);
}


/**
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 */
function writeOgcLiteral(node, value) {
  writeOgcExpression('Literal', node, value);
}


/**
 * @param {Node} node Node.
 * @param {string} time PropertyName value.
 */
function writeTimeInstant(node, time) {
  const timeInstant = createElementNS(GMLNS, 'TimeInstant');
  node.appendChild(timeInstant);

  const timePosition = createElementNS(GMLNS, 'timePosition');
  timeInstant.appendChild(timePosition);
  writeStringTextNode(timePosition, time);
}


/**
 * Encode filter as WFS `Filter` and return the Node.
 *
 * @param {module:ol/format/filter/Filter} filter Filter.
 * @return {Node} Result.
 * @api
 */
export function writeFilter(filter) {
  const child = createElementNS(OGCNS, 'Filter');
  writeFilterCondition(child, filter, []);
  return child;
}


/**
 * @param {Node} node Node.
 * @param {Array.<string>} featureTypes Feature types.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeGetFeature(node, featureTypes, objectStack) {
  const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const item = /** @type {module:ol/xml~NodeStackItem} */ (assign({}, context));
  item.node = node;
  pushSerializeAndPop(item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory('Query'), featureTypes,
    objectStack);
}


/**
 * Encode format as WFS `GetFeature` and return the Node.
 *
 * @param {module:ol/format/WFS~WriteGetFeatureOptions} options Options.
 * @return {Node} Result.
 * @api
 */
WFS.prototype.writeGetFeature = function(options) {
  const node = createElementNS(WFSNS, 'GetFeature');
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', '1.1.0');
  let filter;
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
      assert(options.geometryName,
        12); // `options.geometryName` must also be provided when `options.bbox` is set
      const bbox = bboxFilter(
        /** @type {string} */ (options.geometryName), options.bbox, options.srsName);
      if (filter) {
        // if bbox and filter are both set, combine the two into a single filter
        filter = andFilter(filter, bbox);
      } else {
        filter = bbox;
      }
    }
  }
  node.setAttributeNS(XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', this.schemaLocation_);
  /** @type {module:ol/xml~NodeStackItem} */
  const context = {
    node: node,
    'srsName': options.srsName,
    'featureNS': options.featureNS ? options.featureNS : this.featureNS_,
    'featurePrefix': options.featurePrefix,
    'geometryName': options.geometryName,
    'filter': filter,
    'propertyNames': options.propertyNames ? options.propertyNames : []
  };
  assert(Array.isArray(options.featureTypes),
    11); // `options.featureTypes` should be an Array
  writeGetFeature(node, /** @type {!Array.<string>} */ (options.featureTypes), [context]);
  return node;
};


/**
 * Encode format as WFS `Transaction` and return the Node.
 *
 * @param {Array.<module:ol/Feature>} inserts The features to insert.
 * @param {Array.<module:ol/Feature>} updates The features to update.
 * @param {Array.<module:ol/Feature>} deletes The features to delete.
 * @param {module:ol/format/WFS~WriteTransactionOptions} options Write options.
 * @return {Node} Result.
 * @api
 */
WFS.prototype.writeTransaction = function(inserts, updates, deletes, options) {
  const objectStack = [];
  const node = createElementNS(WFSNS, 'Transaction');
  const version = options.version ? options.version : DEFAULT_VERSION;
  const gmlVersion = version === '1.0.0' ? 2 : 3;
  node.setAttribute('service', 'WFS');
  node.setAttribute('version', version);
  let baseObj;
  /** @type {module:ol/xml~NodeStackItem} */
  let obj;
  if (options) {
    baseObj = options.gmlOptions ? options.gmlOptions : {};
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
  }
  const schemaLocation = SCHEMA_LOCATIONS[version];
  node.setAttributeNS(XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', schemaLocation);
  const featurePrefix = options.featurePrefix ? options.featurePrefix : FEATURE_PREFIX;
  if (inserts) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    assign(obj, baseObj);
    pushSerializeAndPop(obj,
      TRANSACTION_SERIALIZERS,
      makeSimpleNodeFactory('Insert'), inserts,
      objectStack);
  }
  if (updates) {
    obj = {node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'hasZ': options.hasZ, 'srsName': options.srsName};
    assign(obj, baseObj);
    pushSerializeAndPop(obj,
      TRANSACTION_SERIALIZERS,
      makeSimpleNodeFactory('Update'), updates,
      objectStack);
  }
  if (deletes) {
    pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    TRANSACTION_SERIALIZERS,
    makeSimpleNodeFactory('Delete'), deletes,
    objectStack);
  }
  if (options.nativeElements) {
    pushSerializeAndPop({node: node, 'featureNS': options.featureNS,
      'featureType': options.featureType, 'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion, 'srsName': options.srsName},
    TRANSACTION_SERIALIZERS,
    makeSimpleNodeFactory('Native'), options.nativeElements,
    objectStack);
  }
  return node;
};


/**
 * Read the projection from a WFS source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {?module:ol/proj/Projection} Projection.
 * @api
 */
WFS.prototype.readProjection;


/**
 * @inheritDoc
 */
WFS.prototype.readProjectionFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
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
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (!(n.childNodes.length === 0 ||
          (n.childNodes.length === 1 &&
          n.firstChild.nodeType === 3))) {
        const objectStack = [{}];
        this.gmlFormat_.readGeometryElement(n, objectStack);
        return getProjection(objectStack.pop().srsName);
      }
    }
  }

  return null;
};
export default WFS;
