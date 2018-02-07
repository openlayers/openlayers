/**
 * @module ol/format/WMTSCapabilities
 */
import {inherits} from '../index.js';
import {boundingExtent} from '../extent.js';
import OWS from '../format/OWS.js';
import XLink from '../format/XLink.js';
import XML from '../format/XML.js';
import XSD from '../format/XSD.js';
import {pushParseAndPop, makeStructureNS,
  makeObjectPropertySetter, makeObjectPropertyPusher, makeArrayPusher} from '../xml.js';

/**
 * @classdesc
 * Format for reading WMTS capabilities data.
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
const WMTSCapabilities = function() {
  XML.call(this);

  /**
   * @type {ol.format.OWS}
   * @private
   */
  this.owsParser_ = new OWS();
};

inherits(WMTSCapabilities, XML);


/**
 * Read a WMTS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMTS capabilities.
 * @api
 */
WMTSCapabilities.prototype.read;


/**
 * @inheritDoc
 */
WMTSCapabilities.prototype.readFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @inheritDoc
 */
WMTSCapabilities.prototype.readFromNode = function(node) {
  const version = node.getAttribute('version').trim();
  let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
  if (!WMTSCapabilityObject) {
    return null;
  }
  WMTSCapabilityObject['version'] = version;
  WMTSCapabilityObject = pushParseAndPop(WMTSCapabilityObject,
    WMTSCapabilities.PARSERS_, node, []);
  return WMTSCapabilityObject ? WMTSCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
WMTSCapabilities.readContents_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.CONTENTS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
WMTSCapabilities.readLayer_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
WMTSCapabilities.readTileMatrixSet_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.TMS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
WMTSCapabilities.readStyle_ = function(node, objectStack) {
  const style = pushParseAndPop({},
    WMTSCapabilities.STYLE_PARSERS_, node, objectStack);
  if (!style) {
    return undefined;
  }
  const isDefault = node.getAttribute('isDefault') === 'true';
  style['isDefault'] = isDefault;
  return style;

};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set Link object.
 */
WMTSCapabilities.readTileMatrixSetLink_ = function(node,
  objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.TMS_LINKS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
WMTSCapabilities.readDimensions_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.DIMENSION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Resource URL object.
 */
WMTSCapabilities.readResourceUrl_ = function(node, objectStack) {
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
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} WGS84 BBox object.
 */
WMTSCapabilities.readWgs84BoundingBox_ = function(node, objectStack) {
  const coordinates = pushParseAndPop([],
    WMTSCapabilities.WGS84_BBOX_READERS_, node, objectStack);
  if (coordinates.length != 2) {
    return undefined;
  }
  return boundingExtent(coordinates);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Legend object.
 */
WMTSCapabilities.readLegendUrl_ = function(node, objectStack) {
  const legend = {};
  legend['format'] = node.getAttribute('format');
  legend['href'] = XLink.readHref(node);
  return legend;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Coordinates object.
 */
WMTSCapabilities.readCoordinates_ = function(node, objectStack) {
  const coordinates = XSD.readString(node).split(' ');
  if (!coordinates || coordinates.length != 2) {
    return undefined;
  }
  const x = +coordinates[0];
  const y = +coordinates[1];
  if (isNaN(x) || isNaN(y)) {
    return undefined;
  }
  return [x, y];
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrix object.
 */
WMTSCapabilities.readTileMatrix_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.TM_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixSetLimits Object.
 */
WMTSCapabilities.readTileMatrixLimitsList_ = function(node,
  objectStack) {
  return pushParseAndPop([],
    WMTSCapabilities.TMS_LIMITS_LIST_PARSERS_, node,
    objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixLimits Array.
 */
WMTSCapabilities.readTileMatrixLimits_ = function(node, objectStack) {
  return pushParseAndPop({},
    WMTSCapabilities.TMS_LIMITS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
WMTSCapabilities.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wmts/1.0'
];


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
WMTSCapabilities.OWS_NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Contents': makeObjectPropertySetter(
      WMTSCapabilities.readContents_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.CONTENTS_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Layer': makeObjectPropertyPusher(
      WMTSCapabilities.readLayer_),
    'TileMatrixSet': makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrixSet_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.LAYER_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Style': makeObjectPropertyPusher(
      WMTSCapabilities.readStyle_),
    'Format': makeObjectPropertyPusher(
      XSD.readString),
    'TileMatrixSetLink': makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrixSetLink_),
    'Dimension': makeObjectPropertyPusher(
      WMTSCapabilities.readDimensions_),
    'ResourceURL': makeObjectPropertyPusher(
      WMTSCapabilities.readResourceUrl_)
  }, makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Title': makeObjectPropertySetter(
      XSD.readString),
    'Abstract': makeObjectPropertySetter(
      XSD.readString),
    'WGS84BoundingBox': makeObjectPropertySetter(
      WMTSCapabilities.readWgs84BoundingBox_),
    'Identifier': makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.STYLE_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'LegendURL': makeObjectPropertyPusher(
      WMTSCapabilities.readLegendUrl_)
  }, makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Title': makeObjectPropertySetter(
      XSD.readString),
    'Identifier': makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LINKS_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrixSet': makeObjectPropertySetter(
      XSD.readString),
    'TileMatrixSetLimits': makeObjectPropertySetter(
      WMTSCapabilities.readTileMatrixLimitsList_)
  });

/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LIMITS_LIST_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrixLimits': makeArrayPusher(
      WMTSCapabilities.readTileMatrixLimits_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LIMITS_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrix': makeObjectPropertySetter(
      XSD.readString),
    'MinTileRow': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxTileRow': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MinTileCol': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxTileCol': makeObjectPropertySetter(
      XSD.readNonNegativeInteger)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.DIMENSION_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Default': makeObjectPropertySetter(
      XSD.readString),
    'Value': makeObjectPropertyPusher(
      XSD.readString)
  }, makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Identifier': makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.WGS84_BBOX_READERS_ = makeStructureNS(
  WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'LowerCorner': makeArrayPusher(
      WMTSCapabilities.readCoordinates_),
    'UpperCorner': makeArrayPusher(
      WMTSCapabilities.readCoordinates_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'WellKnownScaleSet': makeObjectPropertySetter(
      XSD.readString),
    'TileMatrix': makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrix_)
  }, makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'SupportedCRS': makeObjectPropertySetter(
      XSD.readString),
    'Identifier': makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TM_PARSERS_ = makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TopLeftCorner': makeObjectPropertySetter(
      WMTSCapabilities.readCoordinates_),
    'ScaleDenominator': makeObjectPropertySetter(
      XSD.readDecimal),
    'TileWidth': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'TileHeight': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MatrixWidth': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MatrixHeight': makeObjectPropertySetter(
      XSD.readNonNegativeInteger)
  }, makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Identifier': makeObjectPropertySetter(
      XSD.readString)
  }));
export default WMTSCapabilities;
