/**
 * @module ol/format/GPX
 */
import Feature from '../Feature.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import Point from '../geom/Point.js';
import XMLFeature from './XMLFeature.js';
import {
  OBJECT_PROPERTY_NODE_FACTORY,
  XML_SCHEMA_INSTANCE_URI,
  createElementNS,
  makeArrayPusher,
  makeArraySerializer,
  makeChildAppender,
  makeObjectPropertySetter,
  makeSequence,
  makeSimpleNodeFactory,
  makeStructureNS,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop,
} from '../xml.js';
import {get as getProjection} from '../proj.js';
import {
  readDateTime,
  readDecimal,
  readPositiveInteger,
  readString,
  writeDateTimeTextNode,
  writeDecimalTextNode,
  writeNonNegativeIntegerTextNode,
  writeStringTextNode,
} from './xsd.js';
import {transformGeometryWithOptions} from './Feature.js';

/**
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://www.topografix.com/GPX/1/0',
  'http://www.topografix.com/GPX/1/1',
];

/**
 * @const
 * @type {string}
 */
const SCHEMA_LOCATION =
  'http://www.topografix.com/GPX/1/1 ' +
  'http://www.topografix.com/GPX/1/1/gpx.xsd';

/**
 * @const
 * @type {Object<string, function(Node, Array<*>): (Feature|undefined)>}
 */
const FEATURE_READER = {
  'rte': readRte,
  'trk': readTrk,
  'wpt': readWpt,
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GPX_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'rte': makeArrayPusher(readRte),
  'trk': makeArrayPusher(readTrk),
  'wpt': makeArrayPusher(readWpt),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'text': makeObjectPropertySetter(readString, 'linkText'),
  'type': makeObjectPropertySetter(readString, 'linkType'),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const GPX_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'rte': makeChildAppender(writeRte),
  'trk': makeChildAppender(writeTrk),
  'wpt': makeChildAppender(writeWpt),
});

/**
 * @typedef {Object} Options
 * @property {function(Feature, Node):void} [readExtensions] Callback function
 * to process `extensions` nodes. To prevent memory leaks, this callback function must
 * not store any references to the node. Note that the `extensions`
 * node is not allowed in GPX 1.0. Moreover, only `extensions`
 * nodes from `wpt`, `rte` and `trk` can be processed, as those are
 * directly mapped to a feature.
 */

/**
 * @typedef {Object} LayoutOptions
 * @property {boolean} [hasZ] HasZ.
 * @property {boolean} [hasM] HasM.
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the GPX format.
 *
 * Note that {@link module:ol/format/GPX~GPX#readFeature} only reads the first
 * feature of the source.
 *
 * When reading, routes (`<rte>`) are converted into LineString geometries, and
 * tracks (`<trk>`) into MultiLineString. Any properties on route and track
 * waypoints are ignored.
 *
 * When writing, LineString geometries are output as routes (`<rte>`), and
 * MultiLineString as tracks (`<trk>`).
 *
 * @api
 */
class GPX extends XMLFeature {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326');

    /**
     * @type {function(Feature, Node): void|undefined}
     * @private
     */
    this.readExtensions_ = options.readExtensions;
  }

  /**
   * @param {Array<Feature>} features List of features.
   * @private
   */
  handleReadExtensions_(features) {
    if (!features) {
      features = [];
    }
    for (let i = 0, ii = features.length; i < ii; ++i) {
      const feature = features[i];
      if (this.readExtensions_) {
        const extensionsNode = feature.get('extensionsNode_') || null;
        this.readExtensions_(feature, extensionsNode);
      }
      feature.set('extensionsNode_', undefined);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromNode(node, options) {
    if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
      return null;
    }
    const featureReader = FEATURE_READER[node.localName];
    if (!featureReader) {
      return null;
    }
    const feature = featureReader(node, [this.getReadOptions(node, options)]);
    if (!feature) {
      return null;
    }
    this.handleReadExtensions_([feature]);
    return feature;
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, options) {
    if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
      return [];
    }
    if (node.localName == 'gpx') {
      /** @type {Array<Feature>} */
      const features = pushParseAndPop([], GPX_PARSERS, node, [
        this.getReadOptions(node, options),
      ]);
      if (features) {
        this.handleReadExtensions_(features);
        return features;
      }
      return [];
    }
    return [];
  }

  /**
   * Encode an array of features in the GPX format as an XML node.
   * LineString geometries are output as routes (`<rte>`), and MultiLineString
   * as tracks (`<trk>`).
   *
   * @param {Array<Feature>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Node} Node.
   * @api
   */
  writeFeaturesNode(features, options) {
    options = this.adaptOptions(options);
    //FIXME Serialize metadata
    const gpx = createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
    const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
    gpx.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
    gpx.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      SCHEMA_LOCATION
    );
    gpx.setAttribute('version', '1.1');
    gpx.setAttribute('creator', 'OpenLayers');

    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      ({node: gpx}),
      GPX_SERIALIZERS,
      GPX_NODE_FACTORY,
      features,
      [options]
    );
    return gpx;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const RTE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'name': makeObjectPropertySetter(readString),
  'cmt': makeObjectPropertySetter(readString),
  'desc': makeObjectPropertySetter(readString),
  'src': makeObjectPropertySetter(readString),
  'link': parseLink,
  'number': makeObjectPropertySetter(readPositiveInteger),
  'extensions': parseExtensions,
  'type': makeObjectPropertySetter(readString),
  'rtept': parseRtePt,
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const RTEPT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'ele': makeObjectPropertySetter(readDecimal),
  'time': makeObjectPropertySetter(readDateTime),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TRK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'name': makeObjectPropertySetter(readString),
  'cmt': makeObjectPropertySetter(readString),
  'desc': makeObjectPropertySetter(readString),
  'src': makeObjectPropertySetter(readString),
  'link': parseLink,
  'number': makeObjectPropertySetter(readPositiveInteger),
  'type': makeObjectPropertySetter(readString),
  'extensions': parseExtensions,
  'trkseg': parseTrkSeg,
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TRKSEG_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'trkpt': parseTrkPt,
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TRKPT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'ele': makeObjectPropertySetter(readDecimal),
  'time': makeObjectPropertySetter(readDateTime),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const WPT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'ele': makeObjectPropertySetter(readDecimal),
  'time': makeObjectPropertySetter(readDateTime),
  'magvar': makeObjectPropertySetter(readDecimal),
  'geoidheight': makeObjectPropertySetter(readDecimal),
  'name': makeObjectPropertySetter(readString),
  'cmt': makeObjectPropertySetter(readString),
  'desc': makeObjectPropertySetter(readString),
  'src': makeObjectPropertySetter(readString),
  'link': parseLink,
  'sym': makeObjectPropertySetter(readString),
  'type': makeObjectPropertySetter(readString),
  'fix': makeObjectPropertySetter(readString),
  'sat': makeObjectPropertySetter(readPositiveInteger),
  'hdop': makeObjectPropertySetter(readDecimal),
  'vdop': makeObjectPropertySetter(readDecimal),
  'pdop': makeObjectPropertySetter(readDecimal),
  'ageofdgpsdata': makeObjectPropertySetter(readDecimal),
  'dgpsid': makeObjectPropertySetter(readPositiveInteger),
  'extensions': parseExtensions,
});

/**
 * @const
 * @type {Array<string>}
 */
const LINK_SEQUENCE = ['text', 'type'];

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const LINK_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'text': makeChildAppender(writeStringTextNode),
  'type': makeChildAppender(writeStringTextNode),
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const RTE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'name',
  'cmt',
  'desc',
  'src',
  'link',
  'number',
  'type',
  'rtept',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const RTE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'name': makeChildAppender(writeStringTextNode),
  'cmt': makeChildAppender(writeStringTextNode),
  'desc': makeChildAppender(writeStringTextNode),
  'src': makeChildAppender(writeStringTextNode),
  'link': makeChildAppender(writeLink),
  'number': makeChildAppender(writeNonNegativeIntegerTextNode),
  'type': makeChildAppender(writeStringTextNode),
  'rtept': makeArraySerializer(makeChildAppender(writeWptType)),
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const RTEPT_TYPE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['ele', 'time']);

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const TRK_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'name',
  'cmt',
  'desc',
  'src',
  'link',
  'number',
  'type',
  'trkseg',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const TRK_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'name': makeChildAppender(writeStringTextNode),
  'cmt': makeChildAppender(writeStringTextNode),
  'desc': makeChildAppender(writeStringTextNode),
  'src': makeChildAppender(writeStringTextNode),
  'link': makeChildAppender(writeLink),
  'number': makeChildAppender(writeNonNegativeIntegerTextNode),
  'type': makeChildAppender(writeStringTextNode),
  'trkseg': makeArraySerializer(makeChildAppender(writeTrkSeg)),
});

/**
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const TRKSEG_NODE_FACTORY = makeSimpleNodeFactory('trkpt');

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const TRKSEG_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'trkpt': makeChildAppender(writeWptType),
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const WPT_TYPE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'ele',
  'time',
  'magvar',
  'geoidheight',
  'name',
  'cmt',
  'desc',
  'src',
  'link',
  'sym',
  'type',
  'fix',
  'sat',
  'hdop',
  'vdop',
  'pdop',
  'ageofdgpsdata',
  'dgpsid',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const WPT_TYPE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'ele': makeChildAppender(writeDecimalTextNode),
  'time': makeChildAppender(writeDateTimeTextNode),
  'magvar': makeChildAppender(writeDecimalTextNode),
  'geoidheight': makeChildAppender(writeDecimalTextNode),
  'name': makeChildAppender(writeStringTextNode),
  'cmt': makeChildAppender(writeStringTextNode),
  'desc': makeChildAppender(writeStringTextNode),
  'src': makeChildAppender(writeStringTextNode),
  'link': makeChildAppender(writeLink),
  'sym': makeChildAppender(writeStringTextNode),
  'type': makeChildAppender(writeStringTextNode),
  'fix': makeChildAppender(writeStringTextNode),
  'sat': makeChildAppender(writeNonNegativeIntegerTextNode),
  'hdop': makeChildAppender(writeDecimalTextNode),
  'vdop': makeChildAppender(writeDecimalTextNode),
  'pdop': makeChildAppender(writeDecimalTextNode),
  'ageofdgpsdata': makeChildAppender(writeDecimalTextNode),
  'dgpsid': makeChildAppender(writeNonNegativeIntegerTextNode),
});

/**
 * @const
 * @type {Object<string, string>}
 */
const GEOMETRY_TYPE_TO_NODENAME = {
  'Point': 'wpt',
  'LineString': 'rte',
  'MultiLineString': 'trk',
};

/**
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [nodeName] Node name.
 * @return {Node|undefined} Node.
 */
function GPX_NODE_FACTORY(value, objectStack, nodeName) {
  const geometry = /** @type {Feature} */ (value).getGeometry();
  if (geometry) {
    const nodeName = GEOMETRY_TYPE_TO_NODENAME[geometry.getType()];
    if (nodeName) {
      const parentNode = objectStack[objectStack.length - 1].node;
      return createElementNS(parentNode.namespaceURI, nodeName);
    }
  }
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {LayoutOptions} layoutOptions Layout options.
 * @param {Element} node Node.
 * @param {!Object} values Values.
 * @return {Array<number>} Flat coordinates.
 */
function appendCoordinate(flatCoordinates, layoutOptions, node, values) {
  flatCoordinates.push(
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat'))
  );
  if ('ele' in values) {
    flatCoordinates.push(/** @type {number} */ (values['ele']));
    delete values['ele'];
    layoutOptions.hasZ = true;
  } else {
    flatCoordinates.push(0);
  }
  if ('time' in values) {
    flatCoordinates.push(/** @type {number} */ (values['time']));
    delete values['time'];
    layoutOptions.hasM = true;
  } else {
    flatCoordinates.push(0);
  }
  return flatCoordinates;
}

/**
 * Choose GeometryLayout based on flags in layoutOptions and adjust flatCoordinates
 * and ends arrays by shrinking them accordingly (removing unused zero entries).
 *
 * @param {LayoutOptions} layoutOptions Layout options.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {Array<number>} [ends] Ends.
 * @return {import("../geom/Geometry.js").GeometryLayout} Layout.
 */
function applyLayoutOptions(layoutOptions, flatCoordinates, ends) {
  /** @type {import("../geom/Geometry.js").GeometryLayout} */
  let layout = 'XY';
  let stride = 2;
  if (layoutOptions.hasZ && layoutOptions.hasM) {
    layout = 'XYZM';
    stride = 4;
  } else if (layoutOptions.hasZ) {
    layout = 'XYZ';
    stride = 3;
  } else if (layoutOptions.hasM) {
    layout = 'XYM';
    stride = 3;
  }
  if (stride !== 4) {
    for (let i = 0, ii = flatCoordinates.length / 4; i < ii; i++) {
      flatCoordinates[i * stride] = flatCoordinates[i * 4];
      flatCoordinates[i * stride + 1] = flatCoordinates[i * 4 + 1];
      if (layoutOptions.hasZ) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 2];
      }
      if (layoutOptions.hasM) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 3];
      }
    }
    flatCoordinates.length = (flatCoordinates.length / 4) * stride;
    if (ends) {
      for (let i = 0, ii = ends.length; i < ii; i++) {
        ends[i] = (ends[i] / 4) * stride;
      }
    }
  }
  return layout;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseLink(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const href = node.getAttribute('href');
  if (href !== null) {
    values['link'] = href;
  }
  parseNode(LINK_PARSERS, node, objectStack);
}

/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseExtensions(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values['extensionsNode_'] = node;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseRtePt(node, objectStack) {
  const values = pushParseAndPop({}, RTEPT_PARSERS, node, objectStack);
  if (values) {
    const rteValues = /** @type {!Object} */ (
      objectStack[objectStack.length - 1]
    );
    const flatCoordinates = /** @type {Array<number>} */ (
      rteValues['flatCoordinates']
    );
    const layoutOptions = /** @type {LayoutOptions} */ (
      rteValues['layoutOptions']
    );
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseTrkPt(node, objectStack) {
  const values = pushParseAndPop({}, TRKPT_PARSERS, node, objectStack);
  if (values) {
    const trkValues = /** @type {!Object} */ (
      objectStack[objectStack.length - 1]
    );
    const flatCoordinates = /** @type {Array<number>} */ (
      trkValues['flatCoordinates']
    );
    const layoutOptions = /** @type {LayoutOptions} */ (
      trkValues['layoutOptions']
    );
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseTrkSeg(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  parseNode(TRKSEG_PARSERS, node, objectStack);
  const flatCoordinates =
    /** @type {Array<number>} */
    (values['flatCoordinates']);
  const ends = /** @type {Array<number>} */ (values['ends']);
  ends.push(flatCoordinates.length);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Track.
 */
function readRte(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (
    objectStack[0]
  );
  const values = pushParseAndPop(
    {
      'flatCoordinates': [],
      'layoutOptions': {},
    },
    RTE_PARSERS,
    node,
    objectStack
  );
  if (!values) {
    return undefined;
  }
  const flatCoordinates =
    /** @type {Array<number>} */
    (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates);
  const geometry = new LineString(flatCoordinates, layout);
  transformGeometryWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values, true);
  return feature;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Track.
 */
function readTrk(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (
    objectStack[0]
  );
  const values = pushParseAndPop(
    {
      'flatCoordinates': [],
      'ends': [],
      'layoutOptions': {},
    },
    TRK_PARSERS,
    node,
    objectStack
  );
  if (!values) {
    return undefined;
  }
  const flatCoordinates =
    /** @type {Array<number>} */
    (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const ends = /** @type {Array<number>} */ (values['ends']);
  delete values['ends'];
  const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates, ends);
  const geometry = new MultiLineString(flatCoordinates, layout, ends);
  transformGeometryWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values, true);
  return feature;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Waypoint.
 */
function readWpt(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (
    objectStack[0]
  );
  const values = pushParseAndPop({}, WPT_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const layoutOptions = /** @type {LayoutOptions} */ ({});
  const coordinates = appendCoordinate([], layoutOptions, node, values);
  const layout = applyLayoutOptions(layoutOptions, coordinates);
  const geometry = new Point(coordinates, layout);
  transformGeometryWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values, true);
  return feature;
}

/**
 * @param {Element} node Node.
 * @param {string} value Value for the link's `href` attribute.
 * @param {Array<*>} objectStack Node stack.
 */
function writeLink(node, value, objectStack) {
  node.setAttribute('href', value);
  const context = objectStack[objectStack.length - 1];
  const properties = context['properties'];
  const link = [properties['linkText'], properties['linkType']];
  pushSerializeAndPop(
    /** @type {import("../xml.js").NodeStackItem} */ ({node: node}),
    LINK_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    link,
    objectStack,
    LINK_SEQUENCE
  );
}

/**
 * @param {Element} node Node.
 * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
 * @param {Array<*>} objectStack Object stack.
 */
function writeWptType(node, coordinate, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const parentNode = context.node;
  const namespaceURI = parentNode.namespaceURI;
  const properties = context['properties'];
  //FIXME Projection handling
  node.setAttributeNS(null, 'lat', String(coordinate[1]));
  node.setAttributeNS(null, 'lon', String(coordinate[0]));
  const geometryLayout = context['geometryLayout'];
  switch (geometryLayout) {
    case 'XYZM':
      if (coordinate[3] !== 0) {
        properties['time'] = coordinate[3];
      }
    // fall through
    case 'XYZ':
      if (coordinate[2] !== 0) {
        properties['ele'] = coordinate[2];
      }
      break;
    case 'XYM':
      if (coordinate[2] !== 0) {
        properties['time'] = coordinate[2];
      }
      break;
    default:
    // pass
  }
  const orderedKeys =
    node.nodeName == 'rtept'
      ? RTEPT_TYPE_SEQUENCE[namespaceURI]
      : WPT_TYPE_SEQUENCE[namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    /** @type {import("../xml.js").NodeStackItem} */
    ({node: node, 'properties': properties}),
    WPT_TYPE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @param {Node} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 */
function writeRte(node, feature, objectStack) {
  const options = /** @type {import("./Feature.js").WriteOptions} */ (
    objectStack[0]
  );
  const properties = feature.getProperties();
  const context = {node: node};
  context['properties'] = properties;
  const geometry = feature.getGeometry();
  if (geometry.getType() == 'LineString') {
    const lineString = /** @type {LineString} */ (
      transformGeometryWithOptions(geometry, true, options)
    );
    context['geometryLayout'] = lineString.getLayout();
    properties['rtept'] = lineString.getCoordinates();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = RTE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    RTE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @param {Element} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 */
function writeTrk(node, feature, objectStack) {
  const options = /** @type {import("./Feature.js").WriteOptions} */ (
    objectStack[0]
  );
  const properties = feature.getProperties();
  /** @type {import("../xml.js").NodeStackItem} */
  const context = {node: node};
  context['properties'] = properties;
  const geometry = feature.getGeometry();
  if (geometry.getType() == 'MultiLineString') {
    const multiLineString = /** @type {MultiLineString} */ (
      transformGeometryWithOptions(geometry, true, options)
    );
    properties['trkseg'] = multiLineString.getLineStrings();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = TRK_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    TRK_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @param {Element} node Node.
 * @param {LineString} lineString LineString.
 * @param {Array<*>} objectStack Object stack.
 */
function writeTrkSeg(node, lineString, objectStack) {
  /** @type {import("../xml.js").NodeStackItem} */
  const context = {node: node};
  context['geometryLayout'] = lineString.getLayout();
  context['properties'] = {};
  pushSerializeAndPop(
    context,
    TRKSEG_SERIALIZERS,
    TRKSEG_NODE_FACTORY,
    lineString.getCoordinates(),
    objectStack
  );
}

/**
 * @param {Element} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 */
function writeWpt(node, feature, objectStack) {
  const options = /** @type {import("./Feature.js").WriteOptions} */ (
    objectStack[0]
  );
  const context = objectStack[objectStack.length - 1];
  context['properties'] = feature.getProperties();
  const geometry = feature.getGeometry();
  if (geometry.getType() == 'Point') {
    const point = /** @type {Point} */ (
      transformGeometryWithOptions(geometry, true, options)
    );
    context['geometryLayout'] = point.getLayout();
    writeWptType(node, point.getCoordinates(), objectStack);
  }
}

export default GPX;
