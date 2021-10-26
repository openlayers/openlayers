/**
 * @module ol/format/WMTSCapabilities
 */
import OWS from './OWS.js';
import XML from './XML.js';
import {boundingExtent} from '../extent.js';
import {
  makeArrayPusher,
  makeObjectPropertyPusher,
  makeObjectPropertySetter,
  makeStructureNS,
  pushParseAndPop,
} from '../xml.js';
import {readDecimal, readPositiveInteger, readString} from './xsd.js';
import {readHref} from './xlink.js';

/**
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [null, 'http://www.opengis.net/wmts/1.0'];

/**
 * @const
 * @type {Array<null|string>}
 */
const OWS_NAMESPACE_URIS = [null, 'http://www.opengis.net/ows/1.1'];

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Contents': makeObjectPropertySetter(readContents),
});

/**
 * @classdesc
 * Format for reading WMTS capabilities data.
 *
 * @api
 */
class WMTSCapabilities extends XML {
  constructor() {
    super();

    /**
     * @type {OWS}
     * @private
     */
    this.owsParser_ = new OWS();
  }

  /**
   * @param {Element} node Node.
   * @return {Object} Object
   */
  readFromNode(node) {
    let version = node.getAttribute('version');
    if (version) {
      version = version.trim();
    }
    let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
    if (!WMTSCapabilityObject) {
      return null;
    }
    WMTSCapabilityObject['version'] = version;
    WMTSCapabilityObject = pushParseAndPop(
      WMTSCapabilityObject,
      PARSERS,
      node,
      []
    );
    return WMTSCapabilityObject ? WMTSCapabilityObject : null;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const CONTENTS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Layer': makeObjectPropertyPusher(readLayer),
  'TileMatrixSet': makeObjectPropertyPusher(readTileMatrixSet),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LAYER_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'Style': makeObjectPropertyPusher(readStyle),
    'Format': makeObjectPropertyPusher(readString),
    'TileMatrixSetLink': makeObjectPropertyPusher(readTileMatrixSetLink),
    'Dimension': makeObjectPropertyPusher(readDimensions),
    'ResourceURL': makeObjectPropertyPusher(readResourceUrl),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'WGS84BoundingBox': makeObjectPropertySetter(readBoundingBox),
    'Identifier': makeObjectPropertySetter(readString),
  })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'LegendURL': makeObjectPropertyPusher(readLegendUrl),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    'Title': makeObjectPropertySetter(readString),
    'Identifier': makeObjectPropertySetter(readString),
  })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TMS_LINKS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'TileMatrixSet': makeObjectPropertySetter(readString),
  'TileMatrixSetLimits': makeObjectPropertySetter(readTileMatrixLimitsList),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TMS_LIMITS_LIST_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'TileMatrixLimits': makeArrayPusher(readTileMatrixLimits),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TMS_LIMITS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'TileMatrix': makeObjectPropertySetter(readString),
  'MinTileRow': makeObjectPropertySetter(readPositiveInteger),
  'MaxTileRow': makeObjectPropertySetter(readPositiveInteger),
  'MinTileCol': makeObjectPropertySetter(readPositiveInteger),
  'MaxTileCol': makeObjectPropertySetter(readPositiveInteger),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const DIMENSION_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'Default': makeObjectPropertySetter(readString),
    'Value': makeObjectPropertyPusher(readString),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    'Identifier': makeObjectPropertySetter(readString),
  })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const WGS84_BBOX_READERS = makeStructureNS(OWS_NAMESPACE_URIS, {
  'LowerCorner': makeArrayPusher(readCoordinates),
  'UpperCorner': makeArrayPusher(readCoordinates),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TMS_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'WellKnownScaleSet': makeObjectPropertySetter(readString),
    'TileMatrix': makeObjectPropertyPusher(readTileMatrix),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    'SupportedCRS': makeObjectPropertySetter(readString),
    'Identifier': makeObjectPropertySetter(readString),
    'BoundingBox': makeObjectPropertySetter(readBoundingBox),
  })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const TM_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'TopLeftCorner': makeObjectPropertySetter(readCoordinates),
    'ScaleDenominator': makeObjectPropertySetter(readDecimal),
    'TileWidth': makeObjectPropertySetter(readPositiveInteger),
    'TileHeight': makeObjectPropertySetter(readPositiveInteger),
    'MatrixWidth': makeObjectPropertySetter(readPositiveInteger),
    'MatrixHeight': makeObjectPropertySetter(readPositiveInteger),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    'Identifier': makeObjectPropertySetter(readString),
  })
);

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
function readContents(node, objectStack) {
  return pushParseAndPop({}, CONTENTS_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
function readLayer(node, objectStack) {
  return pushParseAndPop({}, LAYER_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
function readTileMatrixSet(node, objectStack) {
  return pushParseAndPop({}, TMS_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
function readStyle(node, objectStack) {
  const style = pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
  if (!style) {
    return undefined;
  }
  const isDefault = node.getAttribute('isDefault') === 'true';
  style['isDefault'] = isDefault;
  return style;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set Link object.
 */
function readTileMatrixSetLink(node, objectStack) {
  return pushParseAndPop({}, TMS_LINKS_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
function readDimensions(node, objectStack) {
  return pushParseAndPop({}, DIMENSION_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Resource URL object.
 */
function readResourceUrl(node, objectStack) {
  const format = node.getAttribute('format');
  const template = node.getAttribute('template');
  const resourceType = node.getAttribute('resourceType');
  const resource = {};
  if (format) {
    resource['format'] = format;
  }
  if (template) {
    resource['template'] = template;
  }
  if (resourceType) {
    resource['resourceType'] = resourceType;
  }
  return resource;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} BBox object.
 */
function readBoundingBox(node, objectStack) {
  const coordinates = pushParseAndPop(
    [],
    WGS84_BBOX_READERS,
    node,
    objectStack
  );
  if (coordinates.length != 2) {
    return undefined;
  }
  return boundingExtent(coordinates);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Legend object.
 */
function readLegendUrl(node, objectStack) {
  const legend = {};
  legend['format'] = node.getAttribute('format');
  legend['href'] = readHref(node);
  return legend;
}

/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} Coordinates object.
 */
function readCoordinates(node, objectStack) {
  const coordinates = readString(node).split(/\s+/);
  if (!coordinates || coordinates.length != 2) {
    return undefined;
  }
  const x = +coordinates[0];
  const y = +coordinates[1];
  if (isNaN(x) || isNaN(y)) {
    return undefined;
  }
  return [x, y];
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrix object.
 */
function readTileMatrix(node, objectStack) {
  return pushParseAndPop({}, TM_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixSetLimits Object.
 */
function readTileMatrixLimitsList(node, objectStack) {
  return pushParseAndPop([], TMS_LIMITS_LIST_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixLimits Array.
 */
function readTileMatrixLimits(node, objectStack) {
  return pushParseAndPop({}, TMS_LIMITS_PARSERS, node, objectStack);
}

export default WMTSCapabilities;
