/**
 * @module ol/format/GPX
 */
import {inherits} from '../index.js';
import Feature from '../Feature.js';
import {includes} from '../array.js';
import {transformWithOptions} from '../format/Feature.js';
import XMLFeature from '../format/XMLFeature.js';
import XSD from '../format/XSD.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import Point from '../geom/Point.js';
import {get as getProjection} from '../proj.js';
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Feature format for reading and writing data in the GPX format.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @param {olx.format.GPXOptions=} opt_options Options.
 * @api
 */
const GPX = function(opt_options) {

  const options = opt_options ? opt_options : {};

  XMLFeature.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection('EPSG:4326');

  /**
   * @type {function(ol.Feature, Node)|undefined}
   * @private
   */
  this.readExtensions_ = options.readExtensions;
};

inherits(GPX, XMLFeature);


/**
 * @const
 * @type {Array.<string>}
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
 * @type {Object.<string, function(Node, Array.<*>): (ol.Feature|undefined)>}
 */
const FEATURE_READER = {
  'rte': readRte,
  'trk': readTrk,
  'wpt': readWpt
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const GPX_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'rte': _ol_xml_.makeArrayPusher(readRte),
    'trk': _ol_xml_.makeArrayPusher(readTrk),
    'wpt': _ol_xml_.makeArrayPusher(readWpt)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const LINK_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'text': _ol_xml_.makeObjectPropertySetter(XSD.readString, 'linkText'),
    'type': _ol_xml_.makeObjectPropertySetter(XSD.readString, 'linkType')
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const RTE_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'name': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'cmt': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'desc': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'src': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'link': parseLink,
    'number': _ol_xml_.makeObjectPropertySetter(XSD.readNonNegativeInteger),
    'extensions': parseExtensions,
    'type': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'rtept': parseRtePt
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const RTEPT_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'ele': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'time': _ol_xml_.makeObjectPropertySetter(XSD.readDateTime)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TRK_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'name': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'cmt': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'desc': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'src': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'link': parseLink,
    'number': _ol_xml_.makeObjectPropertySetter(XSD.readNonNegativeInteger),
    'type': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'extensions': parseExtensions,
    'trkseg': parseTrkSeg
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TRKSEG_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'trkpt': parseTrkPt
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TRKPT_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'ele': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'time': _ol_xml_.makeObjectPropertySetter(XSD.readDateTime)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const WPT_PARSERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'ele': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'time': _ol_xml_.makeObjectPropertySetter(XSD.readDateTime),
    'magvar': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'geoidheight': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'name': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'cmt': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'desc': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'src': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'link': parseLink,
    'sym': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'type': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'fix': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'sat': _ol_xml_.makeObjectPropertySetter(XSD.readNonNegativeInteger),
    'hdop': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'vdop': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'pdop': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'ageofdgpsdata': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
    'dgpsid': _ol_xml_.makeObjectPropertySetter(XSD.readNonNegativeInteger),
    'extensions': parseExtensions
  });


/**
 * @const
 * @type {Array.<string>}
 */
const LINK_SEQUENCE = ['text', 'type'];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const LINK_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'text': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'type': _ol_xml_.makeChildAppender(XSD.writeStringTextNode)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const RTE_SEQUENCE = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, [
    'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'rtept'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const RTE_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'name': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'cmt': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'desc': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'src': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'link': _ol_xml_.makeChildAppender(writeLink),
    'number': _ol_xml_.makeChildAppender(XSD.writeNonNegativeIntegerTextNode),
    'type': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'rtept': _ol_xml_.makeArraySerializer(_ol_xml_.makeChildAppender(writeWptType))
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const RTEPT_TYPE_SEQUENCE = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, [
    'ele', 'time'
  ]);


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const TRK_SEQUENCE = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, [
    'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'trkseg'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const TRK_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'name': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'cmt': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'desc': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'src': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'link': _ol_xml_.makeChildAppender(writeLink),
    'number': _ol_xml_.makeChildAppender(XSD.writeNonNegativeIntegerTextNode),
    'type': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'trkseg': _ol_xml_.makeArraySerializer(_ol_xml_.makeChildAppender(writeTrkSeg))
  });


/**
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 */
const TRKSEG_NODE_FACTORY = _ol_xml_.makeSimpleNodeFactory('trkpt');


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const TRKSEG_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'trkpt': _ol_xml_.makeChildAppender(writeWptType)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 */
const WPT_TYPE_SEQUENCE = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, [
    'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
    'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
    'ageofdgpsdata', 'dgpsid'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const WPT_TYPE_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'ele': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'time': _ol_xml_.makeChildAppender(XSD.writeDateTimeTextNode),
    'magvar': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'geoidheight': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'name': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'cmt': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'desc': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'src': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'link': _ol_xml_.makeChildAppender(writeLink),
    'sym': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'type': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'fix': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
    'sat': _ol_xml_.makeChildAppender(XSD.writeNonNegativeIntegerTextNode),
    'hdop': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'vdop': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'pdop': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'ageofdgpsdata': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
    'dgpsid': _ol_xml_.makeChildAppender(XSD.writeNonNegativeIntegerTextNode)
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
  const geometry = /** @type {ol.Feature} */ (value).getGeometry();
  if (geometry) {
    const nodeName = GEOMETRY_TYPE_TO_NODENAME[geometry.getType()];
    if (nodeName) {
      const parentNode = objectStack[objectStack.length - 1].node;
      return _ol_xml_.createElementNS(parentNode.namespaceURI, nodeName);
    }
  }
}


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 */
const GPX_SERIALIZERS = _ol_xml_.makeStructureNS(
  NAMESPACE_URIS, {
    'rte': _ol_xml_.makeChildAppender(writeRte),
    'trk': _ol_xml_.makeChildAppender(writeTrk),
    'wpt': _ol_xml_.makeChildAppender(writeWpt)
  });


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {ol.LayoutOptions} layoutOptions Layout options.
 * @param {Node} node Node.
 * @param {Object} values Values.
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
 * @param {ol.LayoutOptions} layoutOptions Layout options.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>=} ends Ends.
 * @return {ol.geom.GeometryLayout} Layout.
 */
GPX.applyLayoutOptions_ = function(layoutOptions, flatCoordinates, ends) {
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
    let i, ii;
    for (i = 0, ii = flatCoordinates.length / 4; i < ii; i++) {
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
      for (i = 0, ii = ends.length; i < ii; i++) {
        ends[i] = ends[i] / 4 * stride;
      }
    }
  }
  return layout;
};


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
  _ol_xml_.parseNode(LINK_PARSERS, node, objectStack);
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
  const values = _ol_xml_.pushParseAndPop(
    {}, RTEPT_PARSERS, node, objectStack);
  if (values) {
    const rteValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array.<number>} */
        (rteValues['flatCoordinates']);
    const layoutOptions = /** @type {ol.LayoutOptions} */
        (rteValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function parseTrkPt(node, objectStack) {
  const values = _ol_xml_.pushParseAndPop({}, TRKPT_PARSERS, node, objectStack);
  if (values) {
    const trkValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array.<number>} */
        (trkValues['flatCoordinates']);
    const layoutOptions = /** @type {ol.LayoutOptions} */
        (trkValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 */
function parseTrkSeg(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  _ol_xml_.parseNode(TRKSEG_PARSERS, node, objectStack);
  const flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  const ends = /** @type {Array.<number>} */ (values['ends']);
  ends.push(flatCoordinates.length);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.Feature|undefined} Track.
 */
function readRte(node, objectStack) {
  const options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  const values = _ol_xml_.pushParseAndPop({
    'flatCoordinates': [],
    'layoutOptions': {}
  }, RTE_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const layoutOptions = /** @type {ol.LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = GPX.applyLayoutOptions_(layoutOptions, flatCoordinates);
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
 * @return {ol.Feature|undefined} Track.
 */
function readTrk(node, objectStack) {
  const options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  const values = _ol_xml_.pushParseAndPop({
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
  const layoutOptions = /** @type {ol.LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = GPX.applyLayoutOptions_(layoutOptions, flatCoordinates, ends);
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
 * @return {ol.Feature|undefined} Waypoint.
 */
function readWpt(node, objectStack) {
  const options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  const values = _ol_xml_.pushParseAndPop({}, WPT_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const layoutOptions = /** @type {ol.LayoutOptions} */ ({});
  const coordinates = appendCoordinate([], layoutOptions, node, values);
  const layout = GPX.applyLayoutOptions_(layoutOptions, coordinates);
  const geometry = new Point(coordinates, layout);
  transformWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values);
  return feature;
}


/**
 * @param {Array.<ol.Feature>} features List of features.
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
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
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
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
    /** @type {Array.<ol.Feature>} */
    const features = _ol_xml_.pushParseAndPop([], GPX_PARSERS,
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
 * @return {ol.proj.Projection} Projection.
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
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */ ({node: node}),
    LINK_SERIALIZERS, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
    link, objectStack, LINK_SEQUENCE);
}


/**
 * @param {Node} node Node.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeWptType(node, coordinate, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const parentNode = context.node;
  const namespaceURI = parentNode.namespaceURI;
  const properties = context['properties'];
  //FIXME Projection handling
  _ol_xml_.setAttributeNS(node, null, 'lat', coordinate[1]);
  _ol_xml_.setAttributeNS(node, null, 'lon', coordinate[0]);
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
  const values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
    ({node: node, 'properties': properties}),
    WPT_TYPE_SERIALIZERS, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeRte(node, feature, objectStack) {
  const options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  const properties = feature.getProperties();
  const context = {node: node, 'properties': properties};
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.LineString} */ (transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    properties['rtept'] = geometry.getCoordinates();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = RTE_SEQUENCE[parentNode.namespaceURI];
  const values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
    RTE_SERIALIZERS, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeTrk(node, feature, objectStack) {
  const options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  const properties = feature.getProperties();
  /** @type {ol.XmlNodeStackItem} */
  const context = {node: node, 'properties': properties};
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.MultiLineString} */
      (transformWithOptions(geometry, true, options));
    properties['trkseg'] = geometry.getLineStrings();
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = TRK_SEQUENCE[parentNode.namespaceURI];
  const values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
    TRK_SERIALIZERS, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
}


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} lineString LineString.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeTrkSeg(node, lineString, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  const context = {node: node, 'geometryLayout': lineString.getLayout(),
    'properties': {}};
  _ol_xml_.pushSerializeAndPop(context,
    TRKSEG_SERIALIZERS, TRKSEG_NODE_FACTORY,
    lineString.getCoordinates(), objectStack);
}


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 */
function writeWpt(node, feature, objectStack) {
  const options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  const context = objectStack[objectStack.length - 1];
  context['properties'] = feature.getProperties();
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.Point} */
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
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 * @api
 */
GPX.prototype.writeFeatures;


/**
 * Encode an array of features in the GPX format as an XML node.
 * LineString geometries are output as routes (`<rte>`), and MultiLineString
 * as tracks (`<trk>`).
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
GPX.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  //FIXME Serialize metadata
  const gpx = _ol_xml_.createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
  const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  const xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  _ol_xml_.setAttributeNS(gpx, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  _ol_xml_.setAttributeNS(gpx, xmlSchemaInstanceUri, 'xsi:schemaLocation',
    SCHEMA_LOCATION);
  gpx.setAttribute('version', '1.1');
  gpx.setAttribute('creator', 'OpenLayers');

  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
    ({node: gpx}), GPX_SERIALIZERS, GPX_NODE_FACTORY, features, [opt_options]);
  return gpx;
};
export default GPX;
