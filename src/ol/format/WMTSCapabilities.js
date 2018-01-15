/**
 * @module ol/format/WMTSCapabilities
 */
import {inherits} from '../index.js';
import {boundingExtent} from '../extent.js';
import OWS from '../format/OWS.js';
import XLink from '../format/XLink.js';
import XML from '../format/XML.js';
import XSD from '../format/XSD.js';
import _ol_xml_ from '../xml.js';

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
  WMTSCapabilityObject = _ol_xml_.pushParseAndPop(WMTSCapabilityObject,
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
  return _ol_xml_.pushParseAndPop({},
    WMTSCapabilities.CONTENTS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
WMTSCapabilities.readLayer_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
    WMTSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
WMTSCapabilities.readTileMatrixSet_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
    WMTSCapabilities.TMS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
WMTSCapabilities.readStyle_ = function(node, objectStack) {
  const style = _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({},
    WMTSCapabilities.TMS_LINKS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
WMTSCapabilities.readDimensions_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
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
  const coordinates = _ol_xml_.pushParseAndPop([],
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
  return _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop([],
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
  return _ol_xml_.pushParseAndPop({},
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
WMTSCapabilities.PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Contents': _ol_xml_.makeObjectPropertySetter(
      WMTSCapabilities.readContents_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.CONTENTS_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Layer': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readLayer_),
    'TileMatrixSet': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrixSet_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.LAYER_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Style': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readStyle_),
    'Format': _ol_xml_.makeObjectPropertyPusher(
      XSD.readString),
    'TileMatrixSetLink': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrixSetLink_),
    'Dimension': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readDimensions_),
    'ResourceURL': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readResourceUrl_)
  }, _ol_xml_.makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Title': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'Abstract': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'WGS84BoundingBox': _ol_xml_.makeObjectPropertySetter(
      WMTSCapabilities.readWgs84BoundingBox_),
    'Identifier': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'LegendURL': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readLegendUrl_)
  }, _ol_xml_.makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Title': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'Identifier': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LINKS_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrixSet': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'TileMatrixSetLimits': _ol_xml_.makeObjectPropertySetter(
      WMTSCapabilities.readTileMatrixLimitsList_)
  });

/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LIMITS_LIST_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrixLimits': _ol_xml_.makeArrayPusher(
      WMTSCapabilities.readTileMatrixLimits_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_LIMITS_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TileMatrix': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'MinTileRow': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxTileRow': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MinTileCol': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxTileCol': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.DIMENSION_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'Default': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'Value': _ol_xml_.makeObjectPropertyPusher(
      XSD.readString)
  }, _ol_xml_.makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Identifier': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.WGS84_BBOX_READERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'LowerCorner': _ol_xml_.makeArrayPusher(
      WMTSCapabilities.readCoordinates_),
    'UpperCorner': _ol_xml_.makeArrayPusher(
      WMTSCapabilities.readCoordinates_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TMS_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'WellKnownScaleSet': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'TileMatrix': _ol_xml_.makeObjectPropertyPusher(
      WMTSCapabilities.readTileMatrix_)
  }, _ol_xml_.makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'SupportedCRS': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'Identifier': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMTSCapabilities.TM_PARSERS_ = _ol_xml_.makeStructureNS(
  WMTSCapabilities.NAMESPACE_URIS_, {
    'TopLeftCorner': _ol_xml_.makeObjectPropertySetter(
      WMTSCapabilities.readCoordinates_),
    'ScaleDenominator': _ol_xml_.makeObjectPropertySetter(
      XSD.readDecimal),
    'TileWidth': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'TileHeight': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MatrixWidth': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MatrixHeight': _ol_xml_.makeObjectPropertySetter(
      XSD.readNonNegativeInteger)
  }, _ol_xml_.makeStructureNS(WMTSCapabilities.OWS_NAMESPACE_URIS_, {
    'Identifier': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  }));
export default WMTSCapabilities;
