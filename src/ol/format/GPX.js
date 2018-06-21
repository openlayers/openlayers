/**
 * @module ol/format/GPX
 */
import {inherits} from '../util.js';
import Feature from '../Feature.js';
import {includes} from '../array.js';
import {transformWithOptions} from '../format/Feature.js';
import XMLFeature from '../format/XMLFeature.js';
import {readString, readDecimal, readNonNegativeInteger, readDateTime, writeStringTextNode, writeNonNegativeIntegerTextNode, writeDecimalTextNode, writeDateTimeTextNode} from '../format/xsd.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import Point from '../geom/Point.js';
import {get as getProjection} from '../proj.js';
import {createElementNS, makeArrayPusher, makeArraySerializer, makeChildAppender,
  makeObjectPropertySetter, makeSequence, makeSimpleNodeFactory, makeStructureNS,
  OBJECT_PROPERTY_NODE_FACTORY, parseNode, pushParseAndPop, pushSerializeAndPop,
  XML_SCHEMA_INSTANCE_URI} from '../xml.js';


/**
 * @typedef {Object} Options
 * @property {function(module:ol/Feature, Node)} [readExtensions] Callback function
 * to process `extensions` nodes. To prevent memory leaks, this callback function must
 * not store any references to the node. Note that the `extensions`
 * node is not allowed in GPX 1.0. Moreover, only `extensions`
 * nodes from `wpt`, `rte` and `trk` can be processed, as those are
 * directly mapped to a feature.
 */

/**
 * @typedef {Object} LayoutOptions
 * @property {boolean} [hasZ]
 * @property {boolean} [hasM]
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the GPX format.
 *
 * @constructor
 * @extends {module:ol/format/XMLFeature}
 * @param {module:ol/format/GPX~Options=} opt_options Options.
 * @api
 */
const GPX = function(opt_options) {

  const options = opt_options ? opt_options : {};

  XMLFeature.call(this);

  /**
   * @inheritDoc
   */
  this.dataProjection = getProjection('EPSG:4326');

  /**
   * @type {function(module:ol/Feature, Node)|undefined}
   * @private
   */
  this.readExtensions_ = options.readExtensions;
};

inherits(GPX, XMLFeature);


/**
 * @const
 * @type {Array.<null|string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://www.topografix.com/GPX/1/0',
  'http://www.topografix.com/GPX/1/1'
];


/**
 * @const
 * @type {string}
 */
const SCHEMA_LOCATION = 'http://www.topografix.com/GPX/1/1 ' +
    'http://www.topografix.com/GPX/1/1/gpx.xsd';


/**
 * @const
 * @type {Object.<string, function(Node, Array.<*>): (module:ol/Feature|undefined)>}
 */
const FEATURE_READER = {
  'rte': readRte,
  'trk': readTrk,
  'wpt': readWpt
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const GPX_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'rte': makeArrayPusher(readRte),
    'trk': makeArrayPusher(readTrk),
    'wpt': makeArrayPusher(readWpt)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const LINK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'text': makeObjectPropertySetter(readString, 'linkText'),
    'type': makeObjectPropertySetter(readString, 'linkType')
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const RTE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeObjectPropertySetter(readString),
    'cmt': makeObjectPropertySetter(readString),
    'desc': makeObjectPropertySetter(readString),
    'src': makeObjectPropertySetter(readString),
    'link': parseLink,
    'number': makeObjectPropertySetter(readNonNegativeInteger),
    'extensions': parseExtensions,
    'type': makeObjectPropertySetter(readString),
    'rtept': parseRtePt
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const RTEPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ele': makeObjectPropertySetter(readDecimal),
    'time': makeObjectPropertySetter(readDateTime)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const TRK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeObjectPropertySetter(readString),
    'cmt': makeObjectPropertySetter(readString),
    'desc': makeObjectPropertySetter(readString),
    'src': makeObjectPropertySetter(readString),
    'link': parseLink,
    'number': makeObjectPropertySetter(readNonNegativeInteger),
    'type': makeObjectPropertySetter(readString),
    'extensions': parseExtensions,
    'trkseg': parseTrkSeg
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const TRKSEG_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'trkpt': parseTrkPt
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const TRKPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ele': makeObjectPropertySetter(readDecimal),
    'time': makeObjectPropertySetter(readDateTime)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 */
const WPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
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
    'sat': makeObjectPropertySetter(readNonNegativeInteger),
    'hdop': makeObjectPropertySetter(readDecimal),
    'vdop': makeObjectPropertySetter(readDecimal),
    'pdop': makeObjectPropertySetter(readDecimal),
    'ageofdgpsdata': makeObjectPropertySetter(readDecimal),
    'dgpsid': makeObjectPropertySetter(readNonNegativeInteger),
    'extensions': parseExtensions
  });


/**
 * @const
 * @type {Array.<string>}
 */
const LINK_SEQUENCE = ['text', 'type'];


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const LINK_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'text': makeChildAppender(writeStringTextNode),
    'type': makeChildAppender(writeStringTextNode)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const RTE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'rtept'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const RTE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeChildAppender(writeStringTextNode),
    'cmt': makeChildAppender(writeStringTextNode),
    'desc': makeChildAppender(writeStringTextNode),
    'src': makeChildAppender(writeStringTextNode),
    'link': makeChildAppender(writeLink),
    'number': makeChildAppender(writeNonNegativeIntegerTextNode),
    'type': makeChildAppender(writeStringTextNode),
    'rtept': makeArraySerializer(makeChildAppender(writeWptType))
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const RTEPT_TYPE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'ele', 'time'
  ]);


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const TRK_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'trkseg'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const TRK_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeChildAppender(writeStringTextNode),
    'cmt': makeChildAppender(writeStringTextNode),
    'desc': makeChildAppender(writeStringTextNode),
    'src': makeChildAppender(writeStringTextNode),
    'link': makeChildAppender(writeLink),
    'number': makeChildAppender(writeNonNegativeIntegerTextNode),
    'type': makeChildAppender(writeStringTextNode),
    'trkseg': makeArraySerializer(makeChildAppender(writeTrkSeg))
  });


/**
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const TRKSEG_NODE_FACTORY = makeSimpleNodeFactory('trkpt');


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const TRKSEG_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'trkpt': makeChildAppender(writeWptType)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const WPT_TYPE_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS, [
    'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
    'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
    'ageofdgpsdata', 'dgpsid'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const WPT_TYPE_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
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
    'dgpsid': makeChildAppender(writeNonNegativeIntegerTextNode)
  });


/**
 * @const
 * @type {Object.<string, string>}
 */
const GEOMETRY_TYPE_TO_NODENAME = {
  'Point': 'wpt',
  'LineString': 'rte',
  'MultiLineString': 'trk'
};


/**
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
function GPX_NODE_FACTORY(value, objectStack, opt_nodeName) {
  const geometry = /** @type {module:ol/Feature} */ (value).getGeometry();
  if (geometry) {
    const nodeName = GEOMETRY_TYPE_TO_NODENAME[geometry.getType()];
    if (nodeName) {
      const parentNode = objectStack[objectStack.length - 1].node;
      return createElementNS(parentNode.namespaceURI, nodeName);
    }
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Serializer>>}
 */
const GPX_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS, {
    'rte': makeChildAppender(writeRte),
    'trk': makeChildAppender(writeTrk),
    'wpt': makeChildAppender(writeWpt)
  });


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {module:ol/format/GPX~LayoutOptions} layoutOptions Layout options.
 * @param {Node} node Node.
 * @param {!Object} values Values.
 * @return {Array.<number>} Flat coordinates.
 */
function appendCoordinate(flatCoordinates, layoutOptions, node, values) {
  flatCoordinates.push(
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat')));
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
 * @param {module:ol/format/GPX~LayoutOptions} layoutOptions Layout options.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>=} ends Ends.
 * @return {module:ol/geom/GeometryLayout} Layout.
 */
function applyLayoutOptions(layoutOptions, flatCoordinates, ends) {
  let layout = GeometryLayout.XY;
  let stride = 2;
  if (layoutOptions.hasZ && layoutOptions.hasM) {
    layout = GeometryLayout.XYZM;
    stride = 4;
  } else if (layoutOptions.hasZ) {
    layout = GeometryLayout.XYZ;
    stride = 3;
  } else if (layoutOptions.hasM) {
    layout = GeometryLayout.XYM;
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
    flatCoordinates.length = flatCoordinates.length / 4 * stride;
    if (ends) {
      for (let i = 0, ii = ends.length; i < ii; i++) {
        ends[i] = ends[i] / 4 * stride;
      }
    }
  }
  return layout;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
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
 * @param {Array.<*>} objectStack Object stack.
 */
function parseExtensions(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values['extensionsNode_'] = node;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function parseRtePt(node, objectStack) {
  const values = pushParseAndPop({}, RTEPT_PARSERS, node, objectStack);
  if (values) {
    const rteValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array.<number>} */ (rteValues['flatCoordinates']);
    const layoutOptions = /** @type {module:ol/format/GPX~LayoutOptions} */ (rteValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function parseTrkPt(node, objectStack) {
  const values = pushParseAndPop({}, TRKPT_PARSERS, node, objectStack);
  if (values) {
    const trkValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array.<number>} */ (trkValues['flatCoordinates']);
    const layoutOptions = /** @type {module:ol/format/GPX~LayoutOptions} */ (trkValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function parseTrkSeg(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  parseNode(TRKSEG_PARSERS, node, objectStack);
  const flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  const ends = /** @type {Array.<number>} */ (values['ends']);
  ends.push(flatCoordinates.length);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/Feature|undefined} Track.
 */
function readRte(node, objectStack) {
  const options = /** @type {module:ol/format/Feature~ReadOptions} */ (objectStack[0]);
  const values = pushParseAndPop({
    'flatCoordinates': [],
    'layoutOptions': {}
  }, RTE_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const layoutOptions = /** @type {module:ol/format/GPX~LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates);
  const geometry = new LineString(null);
  geometry.setFlatCoordinates(layout, flatCoordinates);
  transformWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values);
  return feature;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/Feature|undefined} Track.
 */
function readTrk(node, objectStack) {
  const options = /** @type {module:ol/format/Feature~ReadOptions} */ (objectStack[0]);
  const values = pushParseAndPop({
    'flatCoordinates': [],
    'ends': [],
    'layoutOptions': {}
  }, TRK_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const ends = /** @type {Array.<number>} */ (values['ends']);
  delete values['ends'];
  const layoutOptions = /** @type {module:ol/format/GPX~LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates, ends);
  const geometry = new MultiLineString(null);
  geometry.setFlatCoordinates(layout, flatCoordinates, ends);
  transformWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values);
  return feature;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/Feature|undefined} Waypoint.
 */
function readWpt(node, objectStack) {
  const options = /** @type {module:ol/format/Feature~ReadOptions} */ (objectStack[0]);
  const values = pushParseAndPop({}, WPT_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const layoutOptions = /** @type {module:ol/format/GPX~LayoutOptions} */ ({});
  const coordinates = appendCoordinate([], layoutOptions, node, values);
  const layout = applyLayoutOptions(layoutOptions, coordinates);
  const geometry = new Point(coordinates, layout);
  transformWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values);
  return feature;
}


/**
 * @param {Array.<module:ol/Feature>} features List of features.
 * @private
 */
GPX.prototype.handleReadExtensions_ = function(features) {
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
};


/**
 * Read the first feature from a GPX source.
 * Routes (`<rte>`) are converted into LineString geometries, and tracks (`<trk>`)
 * into MultiLineString. Any properties on route and track waypoints are ignored.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
GPX.prototype.readFeature;


/**
 * @inheritDoc
 */
GPX.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
    return null;
  }
  const featureReader = FEATURE_READER[node.localName];
  if (!featureReader) {
    return null;
  }
  const feature = featureReader(node, [this.getReadOptions(node, opt_options)]);
  if (!feature) {
    return null;
  }
  this.handleReadExtensions_([feature]);
  return feature;
};


/**
 * Read all features from a GPX source.
 * Routes (`<rte>`) are converted into LineString geometries, and tracks (`<trk>`)
 * into MultiLineString. Any properties on route and track waypoints are ignored.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
GPX.prototype.readFeatures;


/**
 * @inheritDoc
 */
GPX.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
    return [];
  }
  if (node.localName == 'gpx') {
    /** @type {Array.<module:ol/Feature>} */
    const features = pushParseAndPop([], GPX_PARSERS,
      node, [this.getReadOptions(node, opt_options)]);
    if (features) {
      this.handleReadExtensions_(features);
      return features;
    } else {
      return [];
    }
  }
  return [];
};


/**
 * Read the projection from a GPX source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
GPX.prototype.readProjection;


/**
 * @param {Node} node Node.
 * @param {string} value Value for the link's `href` attribute.
 * @param {Array.<*>} objectStack Node stack.
 */
function writeLink(node, value, objectStack) {
  node.setAttribute('href', value);
  const context = objectStack[objectStack.length - 1];
  const properties = context['properties'];
  const link = [
    properties['linkText'],
    properties['linkType']
  ];
  pushSerializeAndPop(/** @type {module:ol/xml~NodeStackItem} */ ({node: node}),
    LINK_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY,
    link, objectStack, LINK_SEQUENCE);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeWptType(node, coordinate, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const parentNode = context.node;
  const namespaceURI = parentNode.namespaceURI;
  const properties = context['properties'];
  //FIXME Projection handling
  node.setAttributeNS(null, 'lat', coordinate[1]);
  node.setAttributeNS(null, 'lon', coordinate[0]);
  const geometryLayout = context['geometryLayout'];
  switch (geometryLayout) {
    case GeometryLayout.XYZM:
      if (coordinate[3] !== 0) {
        properties['time'] = coordinate[3];
      }
      // fall through
    case GeometryLayout.XYZ:
      if (coordinate[2] !== 0) {
        properties['ele'] = coordinate[2];
      }
      break;
    case GeometryLayout.XYM:
      if (coordinate[2] !== 0) {
        properties['time'] = coordinate[2];
      }
      break;
    default:
      // pass
  }
  const orderedKeys = (node.nodeName == 'rtept') ?
    RTEPT_TYPE_SEQUENCE[namespaceURI] :
    WPT_TYPE_SEQUENCE[namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(/** @type {module:ol/xml~NodeStackItem} */
    ({node: node, 'properties': properties}),
    WPT_TYPE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeRte(node, feature, objectStack) {
  const options = /** @type {module:ol/format/Feature~WriteOptions} */ (objectStack[0]);
  const properties = feature.getProperties();
  const context = {node: node, 'properties': properties};
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {module:ol/geom/LineString} */ (transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    properties['rtept'] = geometry.getCoordinates();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = RTE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context,
    RTE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeTrk(node, feature, objectStack) {
  const options = /** @type {module:ol/format/Feature~WriteOptions} */ (objectStack[0]);
  const properties = feature.getProperties();
  /** @type {module:ol/xml~NodeStackItem} */
  const context = {node: node, 'properties': properties};
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {module:ol/geom/MultiLineString} */
      (transformWithOptions(geometry, true, options));
    properties['trkseg'] = geometry.getLineStrings();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = TRK_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context,
    TRK_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/geom/LineString} lineString LineString.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeTrkSeg(node, lineString, objectStack) {
  /** @type {module:ol/xml~NodeStackItem} */
  const context = {node: node, 'geometryLayout': lineString.getLayout(),
    'properties': {}};
  pushSerializeAndPop(context,
    TRKSEG_SERIALIZERS, TRKSEG_NODE_FACTORY,
    lineString.getCoordinates(), objectStack);
}


/**
 * @param {Node} node Node.
 * @param {module:ol/Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeWpt(node, feature, objectStack) {
  const options = /** @type {module:ol/format/Feature~WriteOptions} */ (objectStack[0]);
  const context = objectStack[objectStack.length - 1];
  context['properties'] = feature.getProperties();
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {module:ol/geom/Point} */
      (transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    writeWptType(node, geometry.getCoordinates(), objectStack);
  }
}


/**
 * Encode an array of features in the GPX format.
 * LineString geometries are output as routes (`<rte>`), and MultiLineString
 * as tracks (`<trk>`).
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} Result.
 * @api
 */
GPX.prototype.writeFeatures;


/**
 * Encode an array of features in the GPX format as an XML node.
 * LineString geometries are output as routes (`<rte>`), and MultiLineString
 * as tracks (`<trk>`).
 *
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
GPX.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  //FIXME Serialize metadata
  const gpx = createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
  const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  gpx.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
  gpx.setAttributeNS(XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', SCHEMA_LOCATION);
  gpx.setAttribute('version', '1.1');
  gpx.setAttribute('creator', 'OpenLayers');

  pushSerializeAndPop(/** @type {module:ol/xml~NodeStackItem} */
    ({node: gpx}), GPX_SERIALIZERS, GPX_NODE_FACTORY, features, [opt_options]);
  return gpx;
};
export default GPX;
