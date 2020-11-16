/**
 * @module ol/format/WFS
 */
import GML2 from './GML2.js';
import GML3 from './GML3.js';
import GML32 from './GML32.js';
import GMLBase, {GMLNS} from './GMLBase.js';
import XMLFeature from './XMLFeature.js';
import {
  XML_SCHEMA_INSTANCE_URI,
  createElementNS,
  isDocument,
  makeArrayPusher,
  makeChildAppender,
  makeObjectPropertySetter,
  makeSimpleNodeFactory,
  parse,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop,
} from '../xml.js';
import {and as andFilterFn, bbox as bboxFilterFn} from './filter.js';
import {assert} from '../asserts.js';
import {assign} from '../obj.js';
import {get as getProjection} from '../proj.js';
import {
  readNonNegativeInteger,
  readNonNegativeIntegerString,
  writeStringTextNode,
} from './xsd.js';

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const FEATURE_COLLECTION_PARSERS = {
  'http://www.opengis.net/gml': {
    'boundedBy': makeObjectPropertySetter(
      GMLBase.prototype.readGeometryElement,
      'bounds'
    ),
  },
  'http://www.opengis.net/wfs/2.0': {
    'member': makeArrayPusher(GMLBase.prototype.readFeaturesInternal),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const TRANSACTION_SUMMARY_PARSERS = {
  'http://www.opengis.net/wfs': {
    'totalInserted': makeObjectPropertySetter(readNonNegativeInteger),
    'totalUpdated': makeObjectPropertySetter(readNonNegativeInteger),
    'totalDeleted': makeObjectPropertySetter(readNonNegativeInteger),
  },
  'http://www.opengis.net/wfs/2.0': {
    'totalInserted': makeObjectPropertySetter(readNonNegativeInteger),
    'totalUpdated': makeObjectPropertySetter(readNonNegativeInteger),
    'totalDeleted': makeObjectPropertySetter(readNonNegativeInteger),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const TRANSACTION_RESPONSE_PARSERS = {
  'http://www.opengis.net/wfs': {
    'TransactionSummary': makeObjectPropertySetter(
      readTransactionSummary,
      'transactionSummary'
    ),
    'InsertResults': makeObjectPropertySetter(readInsertResults, 'insertIds'),
  },
  'http://www.opengis.net/wfs/2.0': {
    'TransactionSummary': makeObjectPropertySetter(
      readTransactionSummary,
      'transactionSummary'
    ),
    'InsertResults': makeObjectPropertySetter(readInsertResults, 'insertIds'),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
const QUERY_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'PropertyName': makeChildAppender(writeStringTextNode),
  },
  'http://www.opengis.net/wfs/2.0': {
    'PropertyName': makeChildAppender(writeStringTextNode),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
const TRANSACTION_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'Insert': makeChildAppender(writeFeature),
    'Update': makeChildAppender(writeUpdate),
    'Delete': makeChildAppender(writeDelete),
    'Property': makeChildAppender(writeProperty),
    'Native': makeChildAppender(writeNative),
  },
  'http://www.opengis.net/wfs/2.0': {
    'Insert': makeChildAppender(writeFeature),
    'Update': makeChildAppender(writeUpdate),
    'Delete': makeChildAppender(writeDelete),
    'Property': makeChildAppender(writeProperty),
    'Native': makeChildAppender(writeNative),
  },
};

/**
 * @typedef {Object} Options
 * @property {Object<string, string>|string} [featureNS] The namespace URI used for features.
 * @property {Array<string>|string} [featureType] The feature type to parse. Only used for read operations.
 * @property {GMLBase} [gmlFormat] The GML format to use to parse the response.
 * Default is `ol/format/GML2` for WFS 1.0.0, `ol/format/GML3` for WFS 1.1.0 and `ol/format/GML32` for WFS 2.0.0.
 * @property {string} [schemaLocation] Optional schemaLocation to use for serialization, this will override the default.
 * @property {string} [version='1.1.0'] WFS version to use. Can be either `1.0.0`, `1.1.0` or `2.0.0`.
 */

/**
 * @typedef {Object} WriteGetFeatureOptions
 * @property {string} featureNS The namespace URI used for features.
 * @property {string} featurePrefix The prefix for the feature namespace.
 * @property {Array<string|FeatureType>} featureTypes The feature type names or FeatureType objects to
 * define a unique bbox filter per feature type name (in this case, options `bbox` and `geometryName` are
 * ignored.).
 * @property {string} [srsName] SRS name. No srsName attribute will be set on
 * geometries when this is not provided.
 * @property {string} [handle] Handle.
 * @property {string} [outputFormat] Output format.
 * @property {number} [maxFeatures] Maximum number of features to fetch.
 * @property {string} [geometryName] Geometry name to use in a BBOX filter.
 * @property {Array<string>} [propertyNames] Optional list of property names to serialize.
 * @property {string} [viewParams] viewParams GeoServer vendor parameter.
 * @property {number} [startIndex] Start index to use for WFS paging. This is a
 * WFS 2.0 feature backported to WFS 1.1.0 by some Web Feature Services.
 * @property {number} [count] Number of features to retrieve when paging. This is a
 * WFS 2.0 feature backported to WFS 1.1.0 by some Web Feature Services. Please note that some
 * Web Feature Services have repurposed `maxfeatures` instead.
 * @property {import("../extent.js").Extent} [bbox] Extent to use for the BBOX filter. The `geometryName`
 * option must be set.
 * @property {import("./filter/Filter.js").default} [filter] Filter condition. See
 * {@link module:ol/format/Filter} for more information.
 * @property {string} [resultType] Indicates what response should be returned,
 * E.g. `hits` only includes the `numberOfFeatures` attribute in the response and no features.
 */

/**
 * @typedef {Object} FeatureType
 * @property {!string} name The feature type name.
 * @property {!import("../extent.js").Extent} bbox Extent to use for the BBOX filter.
 * @property {!string} geometryName Geometry name to use in the BBOX filter.
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
 * @property {Array<Object>} nativeElements Native elements. Currently not supported.
 * @property {import("./GMLBase.js").Options} [gmlOptions] GML options for the WFS transaction writer.
 * @property {string} [version='1.1.0'] WFS version to use for the transaction. Can be either `1.0.0`, `1.1.0` or `2.0.0`.
 */

/**
 * Number of features; bounds/extent.
 * @typedef {Object} FeatureCollectionMetadata
 * @property {number} numberOfFeatures
 * @property {import("../extent.js").Extent} bounds
 */

/**
 * Total deleted; total inserted; total updated; array of insert ids.
 * @typedef {Object} TransactionResponse
 * @property {number} totalDeleted
 * @property {number} totalInserted
 * @property {number} totalUpdated
 * @property {Array<string>} insertIds
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
 * @type {Object<string, string>}
 */
const OGCNS = {
  '2.0.0': 'http://www.opengis.net/ogc/1.1',
  '1.1.0': 'http://www.opengis.net/ogc',
  '1.0.0': 'http://www.opengis.net/ogc',
};

/**
 * @type {Object<string, string>}
 */
const WFSNS = {
  '2.0.0': 'http://www.opengis.net/wfs/2.0',
  '1.1.0': 'http://www.opengis.net/wfs',
  '1.0.0': 'http://www.opengis.net/wfs',
};

/**
 * @type {Object<string, string>}
 */
const FESNS = {
  '2.0.0': 'http://www.opengis.net/fes/2.0',
  '1.1.0': 'http://www.opengis.net/fes',
  '1.0.0': 'http://www.opengis.net/fes',
};

/**
 * @type {Object<string, string>}
 */
const SCHEMA_LOCATIONS = {
  '2.0.0':
    'http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd',
  '1.1.0':
    'http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
  '1.0.0':
    'http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/wfs.xsd',
};

/**
 * @type {Object<string, object>}
 */
const GML_FORMATS = {
  '2.0.0': GML32,
  '1.1.0': GML3,
  '1.0.0': GML2,
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
 * as option to override the default.
 * Also see {@link module:ol/format/GMLBase~GMLBase} which is used by this format.
 *
 * @api
 */
class WFS extends XMLFeature {
  /**
   * @param {Options=} opt_options Optional configuration object.
   */
  constructor(opt_options) {
    super();

    const options = opt_options ? opt_options : {};

    /**
     * @private
     * @type {string}
     */
    this.version_ = options.version ? options.version : DEFAULT_VERSION;

    /**
     * @private
     * @type {Array<string>|string|undefined}
     */
    this.featureType_ = options.featureType;

    /**
     * @private
     * @type {Object<string, string>|string|undefined}
     */
    this.featureNS_ = options.featureNS;

    /**
     * @private
     * @type {GMLBase}
     */
    this.gmlFormat_ = options.gmlFormat
      ? options.gmlFormat
      : new GML_FORMATS[this.version_]();

    /**
     * @private
     * @type {string}
     */
    this.schemaLocation_ = options.schemaLocation
      ? options.schemaLocation
      : SCHEMA_LOCATIONS[this.version_];
  }

  /**
   * @return {Array<string>|string|undefined} featureType
   */
  getFeatureType() {
    return this.featureType_;
  }

  /**
   * @param {Array<string>|string|undefined} featureType Feature type(s) to parse.
   */
  setFeatureType(featureType) {
    this.featureType_ = featureType;
  }

  /**
   * @protected
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions=} opt_options Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, opt_options) {
    /** @type {import("../xml.js").NodeStackItem} */
    const context = {
      node,
    };
    assign(context, {
      'featureType': this.featureType_,
      'featureNS': this.featureNS_,
    });

    assign(context, this.getReadOptions(node, opt_options ? opt_options : {}));
    const objectStack = [context];
    let featuresNS;
    if (this.version_ === '2.0.0') {
      featuresNS = FEATURE_COLLECTION_PARSERS;
    } else {
      featuresNS = this.gmlFormat_.FEATURE_COLLECTION_PARSERS;
    }
    let features = pushParseAndPop(
      [],
      featuresNS,
      node,
      objectStack,
      this.gmlFormat_
    );
    if (!features) {
      features = [];
    }
    return features;
  }

  /**
   * Read transaction response of the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {TransactionResponse|undefined} Transaction response.
   * @api
   */
  readTransactionResponse(source) {
    if (!source) {
      return undefined;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readTransactionResponseFromDocument(doc);
    } else if (isDocument(source)) {
      return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source)
      );
    } else {
      return this.readTransactionResponseFromNode(
        /** @type {Element} */ (source)
      );
    }
  }

  /**
   * Read feature collection metadata of the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   * @api
   */
  readFeatureCollectionMetadata(source) {
    if (!source) {
      return undefined;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeatureCollectionMetadataFromDocument(doc);
    } else if (isDocument(source)) {
      return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source)
      );
    } else {
      return this.readFeatureCollectionMetadataFromNode(
        /** @type {Element} */ (source)
      );
    }
  }

  /**
   * @param {Document} doc Document.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   */
  readFeatureCollectionMetadataFromDocument(doc) {
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readFeatureCollectionMetadataFromNode(
          /** @type {Element} */ (n)
        );
      }
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   */
  readFeatureCollectionMetadataFromNode(node) {
    const result = {};
    const value = readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures')
    );
    result['numberOfFeatures'] = value;
    return pushParseAndPop(
      /** @type {FeatureCollectionMetadata} */ (result),
      FEATURE_COLLECTION_PARSERS,
      node,
      [],
      this.gmlFormat_
    );
  }

  /**
   * @param {Document} doc Document.
   * @return {TransactionResponse|undefined} Transaction response.
   */
  readTransactionResponseFromDocument(doc) {
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readTransactionResponseFromNode(/** @type {Element} */ (n));
      }
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @return {TransactionResponse|undefined} Transaction response.
   */
  readTransactionResponseFromNode(node) {
    return pushParseAndPop(
      /** @type {TransactionResponse} */ ({}),
      TRANSACTION_RESPONSE_PARSERS,
      node,
      []
    );
  }

  /**
   * Encode format as WFS `GetFeature` and return the Node.
   *
   * @param {WriteGetFeatureOptions} options Options.
   * @return {Node} Result.
   * @api
   */
  writeGetFeature(options) {
    const node = createElementNS(WFSNS[this.version_], 'GetFeature');
    node.setAttribute('service', 'WFS');
    node.setAttribute('version', this.version_);
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
    if (options.outputFormat) {
      node.setAttribute('outputFormat', options.outputFormat);
    }
    if (options.maxFeatures !== undefined) {
      node.setAttribute('maxFeatures', String(options.maxFeatures));
    }
    if (options.resultType) {
      node.setAttribute('resultType', options.resultType);
    }
    if (options.startIndex !== undefined) {
      node.setAttribute('startIndex', String(options.startIndex));
    }
    if (options.count !== undefined) {
      node.setAttribute('count', String(options.count));
    }
    if (options.viewParams !== undefined) {
      node.setAttribute('viewParams', options.viewParams);
    }
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      this.schemaLocation_
    );
    /** @type {import("../xml.js").NodeStackItem} */
    const context = {
      node,
    };
    assign(context, {
      'version': this.version_,
      'srsName': options.srsName,
      'featureNS': options.featureNS ? options.featureNS : this.featureNS_,
      'featurePrefix': options.featurePrefix,
      'propertyNames': options.propertyNames ? options.propertyNames : [],
    });
    assert(Array.isArray(options.featureTypes), 11); // `options.featureTypes` must be an Array
    if (typeof options.featureTypes[0] === 'string') {
      let filter = options.filter;
      if (options.bbox) {
        assert(options.geometryName, 12); // `options.geometryName` must also be provided when `options.bbox` is set
        filter = this.combineBboxAndFilter(
          options.geometryName,
          options.bbox,
          options.srsName,
          filter
        );
      }
      assign(context, {
        'geometryName': options.geometryName,
        'filter': filter,
      });
      writeGetFeature(
        node,
        /** @type {!Array<string>} */ (options.featureTypes),
        [context]
      );
    } else {
      // Write one query node per element in featuresType.
      options.featureTypes.forEach((/** @type {FeatureType} */ featureType) => {
        const completeFilter = this.combineBboxAndFilter(
          featureType.geometryName,
          featureType.bbox,
          options.srsName,
          options.filter
        );
        assign(context, {
          'geometryName': featureType.geometryName,
          'filter': completeFilter,
        });
        writeGetFeature(node, [featureType.name], [context]);
      });
    }
    return node;
  }

  /**
   * Create a bbox filter and combine it with another optional filter.
   *
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../extent.js").Extent} extent Extent.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   * @param {import("./filter/Filter.js").default=} opt_filter Filter condition.
   * @return {import("./filter/Filter.js").default} The filter.
   */
  combineBboxAndFilter(geometryName, extent, opt_srsName, opt_filter) {
    const bboxFilter = bboxFilterFn(geometryName, extent, opt_srsName);
    if (opt_filter) {
      // if bbox and filter are both set, combine the two into a single filter
      return andFilterFn(opt_filter, bboxFilter);
    }
    return bboxFilter;
  }

  /**
   * Encode format as WFS `Transaction` and return the Node.
   *
   * @param {Array<import("../Feature.js").default>} inserts The features to insert.
   * @param {Array<import("../Feature.js").default>} updates The features to update.
   * @param {Array<import("../Feature.js").default>} deletes The features to delete.
   * @param {WriteTransactionOptions} options Write options.
   * @return {Node} Result.
   * @api
   */
  writeTransaction(inserts, updates, deletes, options) {
    const objectStack = [];
    const version = options.version ? options.version : this.version_;
    const node = createElementNS(WFSNS[version], 'Transaction');

    node.setAttribute('service', 'WFS');
    node.setAttribute('version', version);
    let baseObj;
    /** @type {import("../xml.js").NodeStackItem} */
    if (options) {
      baseObj = options.gmlOptions ? options.gmlOptions : {};
      if (options.handle) {
        node.setAttribute('handle', options.handle);
      }
    }
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      SCHEMA_LOCATIONS[version]
    );

    const request = createTransactionRequest(node, baseObj, version, options);
    if (inserts) {
      serializeTransactionRequest('Insert', inserts, objectStack, request);
    }
    if (updates) {
      serializeTransactionRequest('Update', updates, objectStack, request);
    }
    if (deletes) {
      serializeTransactionRequest('Delete', deletes, objectStack, request);
    }
    if (options.nativeElements) {
      serializeTransactionRequest(
        'Native',
        options.nativeElements,
        objectStack,
        request
      );
    }
    return node;
  }

  /**
   * @param {Document} doc Document.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromDocument(doc) {
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readProjectionFromNode(/** @type {Element} */ (n));
      }
    }
    return null;
  }

  /**
   * @param {Element} node Node.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromNode(node) {
    if (node.firstElementChild && node.firstElementChild.firstElementChild) {
      node = node.firstElementChild.firstElementChild;
      for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        if (
          !(
            n.childNodes.length === 0 ||
            (n.childNodes.length === 1 && n.firstChild.nodeType === 3)
          )
        ) {
          const objectStack = [{}];
          this.gmlFormat_.readGeometryElement(n, objectStack);
          return getProjection(objectStack.pop().srsName);
        }
      }
    }

    return null;
  }
}

/**
 * @param {Element} node Node.
 * @param {*} baseObj Base object.
 * @param {string} version Version.
 * @param {WriteTransactionOptions} options Options.
 * @return {Object} Request object.
 */
function createTransactionRequest(node, baseObj, version, options) {
  const featurePrefix = options.featurePrefix
    ? options.featurePrefix
    : FEATURE_PREFIX;
  let gmlVersion;
  if (version === '1.0.0') {
    gmlVersion = 2;
  } else if (version === '1.1.0') {
    gmlVersion = 3;
  } else if (version === '2.0.0') {
    gmlVersion = 3.2;
  }
  const obj = assign(
    {node},
    {
      version,
      'featureNS': options.featureNS,
      'featureType': options.featureType,
      'featurePrefix': featurePrefix,
      'gmlVersion': gmlVersion,
      'hasZ': options.hasZ,
      'srsName': options.srsName,
    },
    baseObj
  );
  return obj;
}

/**
 * @param {string} type Request type.
 * @param {Array<import("../Feature.js").default>} features Features.
 * @param {Array<*>} objectStack Object stack.
 * @param {Element} request Transaction Request.
 */
function serializeTransactionRequest(type, features, objectStack, request) {
  pushSerializeAndPop(
    request,
    TRANSACTION_SERIALIZERS,
    makeSimpleNodeFactory(type),
    features,
    objectStack
  );
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Transaction Summary.
 */
function readTransactionSummary(node, objectStack) {
  return pushParseAndPop({}, TRANSACTION_SUMMARY_PARSERS, node, objectStack);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const OGC_FID_PARSERS = {
  'http://www.opengis.net/ogc': {
    'FeatureId': makeArrayPusher(function (node, objectStack) {
      return node.getAttribute('fid');
    }),
  },
  'http://www.opengis.net/ogc/1.1': {
    'FeatureId': makeArrayPusher(function (node, objectStack) {
      return node.getAttribute('fid');
    }),
  },
};

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function fidParser(node, objectStack) {
  parseNode(OGC_FID_PARSERS, node, objectStack);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const INSERT_RESULTS_PARSERS = {
  'http://www.opengis.net/wfs': {
    'Feature': fidParser,
  },
  'http://www.opengis.net/wfs/2.0': {
    'Feature': fidParser,
  },
};

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<string>|undefined} Insert results.
 */
function readInsertResults(node, objectStack) {
  return pushParseAndPop([], INSERT_RESULTS_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {Array<*>} objectStack Node stack.
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
  } else if (gmlVersion === 3) {
    GML3.prototype.writeFeatureElement(child, feature, objectStack);
  } else {
    GML32.prototype.writeFeatureElement(child, feature, objectStack);
  }
}

/**
 * @param {Node} node Node.
 * @param {number|string} fid Feature identifier.
 * @param {Array<*>} objectStack Node stack.
 */
function writeOgcFidFilter(node, fid, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const version = context['version'];
  const ns = OGCNS[version];
  const filter = createElementNS(ns, 'Filter');
  const child = createElementNS(ns, 'FeatureId');
  filter.appendChild(child);
  child.setAttribute('fid', /** @type {string} */ (fid));
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
 * @param {Element} node Node.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {Array<*>} objectStack Node stack.
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
 * @param {Element} node Node.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {Array<*>} objectStack Node stack.
 */
function writeUpdate(node, feature, objectStack) {
  const context = objectStack[objectStack.length - 1];
  assert(feature.getId() !== undefined, 27); // Features must have an id set
  const version = context['version'];
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
        if (
          value &&
          typeof (/** @type {?} */ (value).getSimplifiedGeometry) === 'function'
        ) {
          name = geometryName;
        }
        values.push({name: name, value: value});
      }
    }
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */ ({
        version,
        'gmlVersion': context['gmlVersion'],
        node,
        'hasZ': context['hasZ'],
        'srsName': context['srsName'],
      }),
      TRANSACTION_SERIALIZERS,
      makeSimpleNodeFactory('Property'),
      values,
      objectStack
    );
    writeOgcFidFilter(node, fid, objectStack);
  }
}

/**
 * @param {Node} node Node.
 * @param {Object} pair Property name and value.
 * @param {Array<*>} objectStack Node stack.
 */
function writeProperty(node, pair, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const version = context['version'];
  const ns = WFSNS[version];
  const name = createElementNS(ns, 'Name');
  const gmlVersion = context['gmlVersion'];
  node.appendChild(name);
  writeStringTextNode(name, pair.name);
  if (pair.value !== undefined && pair.value !== null) {
    const value = createElementNS(ns, 'Value');
    node.appendChild(value);
    if (
      pair.value &&
      typeof (/** @type {?} */ (pair.value).getSimplifiedGeometry) ===
        'function'
    ) {
      if (gmlVersion === 2) {
        GML2.prototype.writeGeometryElement(value, pair.value, objectStack);
      } else if (gmlVersion === 3) {
        GML3.prototype.writeGeometryElement(value, pair.value, objectStack);
      } else {
        GML32.prototype.writeGeometryElement(value, pair.value, objectStack);
      }
    } else {
      writeStringTextNode(value, pair.value);
    }
  }
}

/**
 * @param {Element} node Node.
 * @param {{vendorId: string, safeToIgnore: boolean, value: string}} nativeElement The native element.
 * @param {Array<*>} objectStack Node stack.
 */
function writeNative(node, nativeElement, objectStack) {
  if (nativeElement.vendorId) {
    node.setAttribute('vendorId', nativeElement.vendorId);
  }
  if (nativeElement.safeToIgnore !== undefined) {
    node.setAttribute('safeToIgnore', String(nativeElement.safeToIgnore));
  }
  if (nativeElement.value !== undefined) {
    writeStringTextNode(node, nativeElement.value);
  }
}

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
const GETFEATURE_SERIALIZERS = {
  'http://www.opengis.net/wfs': {
    'Query': makeChildAppender(writeQuery),
  },
  'http://www.opengis.net/wfs/2.0': {
    'Query': makeChildAppender(writeQuery),
  },
  'http://www.opengis.net/ogc': {
    'During': makeChildAppender(writeDuringFilter),
    'And': makeChildAppender(writeLogicalFilter),
    'Or': makeChildAppender(writeLogicalFilter),
    'Not': makeChildAppender(writeNotFilter),
    'BBOX': makeChildAppender(writeBboxFilter),
    'Contains': makeChildAppender(writeSpatialFilter),
    'Intersects': makeChildAppender(writeSpatialFilter),
    'Within': makeChildAppender(writeSpatialFilter),
    'DWithin': makeChildAppender(writeDWithinFilter),
    'PropertyIsEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNotEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNull': makeChildAppender(writeIsNullFilter),
    'PropertyIsBetween': makeChildAppender(writeIsBetweenFilter),
    'PropertyIsLike': makeChildAppender(writeIsLikeFilter),
  },
  'http://www.opengis.net/fes/2.0': {
    'During': makeChildAppender(writeDuringFilter),
    'And': makeChildAppender(writeLogicalFilter),
    'Or': makeChildAppender(writeLogicalFilter),
    'Not': makeChildAppender(writeNotFilter),
    'BBOX': makeChildAppender(writeBboxFilter),
    'Contains': makeChildAppender(writeSpatialFilter),
    'Disjoint': makeChildAppender(writeSpatialFilter),
    'Intersects': makeChildAppender(writeSpatialFilter),
    'ResourceId': makeChildAppender(writeResourceIdFilter),
    'Within': makeChildAppender(writeSpatialFilter),
    'DWithin': makeChildAppender(writeDWithinFilter),
    'PropertyIsEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNotEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsLessThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThan': makeChildAppender(writeComparisonFilter),
    'PropertyIsGreaterThanOrEqualTo': makeChildAppender(writeComparisonFilter),
    'PropertyIsNull': makeChildAppender(writeIsNullFilter),
    'PropertyIsBetween': makeChildAppender(writeIsBetweenFilter),
    'PropertyIsLike': makeChildAppender(writeIsLikeFilter),
  },
};

/**
 * @param {Element} node Node.
 * @param {string} featureType Feature type.
 * @param {Array<*>} objectStack Node stack.
 */
function writeQuery(node, featureType, objectStack) {
  const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const version = context['version'];
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
  let typeNameAttr;
  if (version === '2.0.0') {
    typeNameAttr = 'typeNames';
  } else {
    typeNameAttr = 'typeName';
  }
  node.setAttribute(typeNameAttr, typeName);
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (featureNS) {
    node.setAttributeNS(XMLNS, 'xmlns:' + featurePrefix, featureNS);
  }
  const item = /** @type {import("../xml.js").NodeStackItem} */ (assign(
    {},
    context
  ));
  item.node = node;
  pushSerializeAndPop(
    item,
    QUERY_SERIALIZERS,
    makeSimpleNodeFactory('PropertyName'),
    propertyNames,
    objectStack
  );
  const filter = context['filter'];
  if (filter) {
    const child = createElementNS(getFilterNS(version), 'Filter');
    node.appendChild(child);
    writeFilterCondition(child, filter, objectStack);
  }
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/Filter.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeFilterCondition(node, filter, objectStack) {
  const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  /** @type {import("../xml.js").NodeStackItem} */
  const item = {node};
  assign(item, {context});
  pushSerializeAndPop(
    item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory(filter.getTagName()),
    [filter],
    objectStack
  );
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/Bbox.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeBboxFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  parent['srsName'] = filter.srsName;
  const format = GML_FORMATS[version];

  writePropertyName(version, node, filter.geometryName);
  format.prototype.writeGeometryElement(node, filter.extent, objectStack);
}

/**
 * @param {Element} node Element.
 * @param {import("./filter/ResourceId.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeResourceIdFilter(node, filter, objectStack) {
  node.setAttribute('rid', /** @type {string} */ (filter.rid));
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/Spatial.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeSpatialFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  parent['srsName'] = filter.srsName;
  const format = GML_FORMATS[version];

  writePropertyName(version, node, filter.geometryName);
  format.prototype.writeGeometryElement(node, filter.geometry, objectStack);
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/DWithin.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeDWithinFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  writeSpatialFilter(node, filter, objectStack);
  const distance = createElementNS(getFilterNS(version), 'Distance');
  writeStringTextNode(distance, filter.distance.toString());
  if (version === '2.0.0') {
    distance.setAttribute('uom', filter.unit);
  } else {
    distance.setAttribute('units', filter.unit);
  }
  node.appendChild(distance);
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/During.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeDuringFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];

  writeExpression(FESNS[version], 'ValueReference', node, filter.propertyName);
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
 * @param {import("./filter/LogicalNary.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeLogicalFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  /** @type {import("../xml.js").NodeStackItem} */
  const item = {node};
  assign(item, {context});
  const conditions = filter.conditions;
  for (let i = 0, ii = conditions.length; i < ii; ++i) {
    const condition = conditions[i];
    pushSerializeAndPop(
      item,
      GETFEATURE_SERIALIZERS,
      makeSimpleNodeFactory(condition.getTagName()),
      [condition],
      objectStack
    );
  }
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/Not.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeNotFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  /** @type {import("../xml.js").NodeStackItem} */
  const item = {node};
  assign(item, {context});
  const condition = filter.condition;
  pushSerializeAndPop(
    item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory(condition.getTagName()),
    [condition],
    objectStack
  );
}

/**
 * @param {Element} node Node.
 * @param {import("./filter/ComparisonBinary.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeComparisonFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  writePropertyName(version, node, filter.propertyName);
  writeLiteral(version, node, '' + filter.expression);
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/IsNull.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeIsNullFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  writePropertyName(version, node, filter.propertyName);
}

/**
 * @param {Node} node Node.
 * @param {import("./filter/IsBetween.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeIsBetweenFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  const ns = getFilterNS(version);

  writePropertyName(version, node, filter.propertyName);

  const lowerBoundary = createElementNS(ns, 'LowerBoundary');
  node.appendChild(lowerBoundary);
  writeLiteral(version, lowerBoundary, '' + filter.lowerBoundary);

  const upperBoundary = createElementNS(ns, 'UpperBoundary');
  node.appendChild(upperBoundary);
  writeLiteral(version, upperBoundary, '' + filter.upperBoundary);
}

/**
 * @param {Element} node Node.
 * @param {import("./filter/IsLike.js").default} filter Filter.
 * @param {Array<*>} objectStack Node stack.
 */
function writeIsLikeFilter(node, filter, objectStack) {
  const parent = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const context = parent['context'];
  const version = context['version'];
  node.setAttribute('wildCard', filter.wildCard);
  node.setAttribute('singleChar', filter.singleChar);
  node.setAttribute('escapeChar', filter.escapeChar);
  if (filter.matchCase !== undefined) {
    node.setAttribute('matchCase', filter.matchCase.toString());
  }
  writePropertyName(version, node, filter.propertyName);
  writeLiteral(version, node, '' + filter.pattern);
}

/**
 * @param {string} ns Namespace.
 * @param {string} tagName Tag name.
 * @param {Node} node Node.
 * @param {string} value Value.
 */
function writeExpression(ns, tagName, node, value) {
  const property = createElementNS(ns, tagName);
  writeStringTextNode(property, value);
  node.appendChild(property);
}

/**
 * @param {string} version Version.
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 */
function writeLiteral(version, node, value) {
  writeExpression(getFilterNS(version), 'Literal', node, value);
}

/**
 * @param {string} version Version.
 * @param {Node} node Node.
 * @param {string} value PropertyName value.
 */
function writePropertyName(version, node, value) {
  if (version === '2.0.0') {
    writeExpression(FESNS[version], 'ValueReference', node, value);
  } else {
    writeExpression(OGCNS[version], 'PropertyName', node, value);
  }
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
 * @param {import("./filter/Filter.js").default} filter Filter.
 * @param {string} version Version.
 * @return {Node} Result.
 * @api
 */
export function writeFilter(filter, version) {
  const child = createElementNS(OGCNS[version], 'Filter');
  const context = {
    node: child,
  };
  assign(context, {
    'version': version,
    'filter': filter,
  });
  writeFilterCondition(child, filter, [context]);
  return child;
}

/**
 * @param {Node} node Node.
 * @param {Array<string>} featureTypes Feature types.
 * @param {Array<*>} objectStack Node stack.
 */
function writeGetFeature(node, featureTypes, objectStack) {
  const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const item = /** @type {import("../xml.js").NodeStackItem} */ (assign(
    {},
    context
  ));
  item.node = node;
  pushSerializeAndPop(
    item,
    GETFEATURE_SERIALIZERS,
    makeSimpleNodeFactory('Query'),
    featureTypes,
    objectStack
  );
}

function getFilterNS(version) {
  let ns;
  if (version === '2.0.0') {
    ns = FESNS[version];
  } else {
    ns = OGCNS[version];
  }
  return ns;
}

export default WFS;
