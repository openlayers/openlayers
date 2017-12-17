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
var _ol_format_WMTSCapabilities_ = function() {
  XML.call(this);

  /**
   * @type {ol.format.OWS}
   * @private
   */
  this.owsParser_ = new OWS();
};

inherits(_ol_format_WMTSCapabilities_, XML);


/**
 * Read a WMTS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMTS capabilities.
 * @api
 */
_ol_format_WMTSCapabilities_.prototype.read;


/**
 * @inheritDoc
 */
_ol_format_WMTSCapabilities_.prototype.readFromDocument = function(doc) {
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @inheritDoc
 */
_ol_format_WMTSCapabilities_.prototype.readFromNode = function(node) {
  var version = node.getAttribute('version').trim();
  var WMTSCapabilityObject = this.owsParser_.readFromNode(node);
  if (!WMTSCapabilityObject) {
    return null;
  }
  WMTSCapabilityObject['version'] = version;
  WMTSCapabilityObject = _ol_xml_.pushParseAndPop(WMTSCapabilityObject,
      _ol_format_WMTSCapabilities_.PARSERS_, node, []);
  return WMTSCapabilityObject ? WMTSCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
_ol_format_WMTSCapabilities_.readContents_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.CONTENTS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
_ol_format_WMTSCapabilities_.readLayer_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
_ol_format_WMTSCapabilities_.readTileMatrixSet_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.TMS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
_ol_format_WMTSCapabilities_.readStyle_ = function(node, objectStack) {
  var style = _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.STYLE_PARSERS_, node, objectStack);
  if (!style) {
    return undefined;
  }
  var isDefault = node.getAttribute('isDefault') === 'true';
  style['isDefault'] = isDefault;
  return style;

};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set Link object.
 */
_ol_format_WMTSCapabilities_.readTileMatrixSetLink_ = function(node,
    objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.TMS_LINKS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
_ol_format_WMTSCapabilities_.readDimensions_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.DIMENSION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Resource URL object.
 */
_ol_format_WMTSCapabilities_.readResourceUrl_ = function(node, objectStack) {
  var format = node.getAttribute('format');
  var template = node.getAttribute('template');
  var resourceType = node.getAttribute('resourceType');
  var resource = {};
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
_ol_format_WMTSCapabilities_.readWgs84BoundingBox_ = function(node, objectStack) {
  var coordinates = _ol_xml_.pushParseAndPop([],
      _ol_format_WMTSCapabilities_.WGS84_BBOX_READERS_, node, objectStack);
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
_ol_format_WMTSCapabilities_.readLegendUrl_ = function(node, objectStack) {
  var legend = {};
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
_ol_format_WMTSCapabilities_.readCoordinates_ = function(node, objectStack) {
  var coordinates = XSD.readString(node).split(' ');
  if (!coordinates || coordinates.length != 2) {
    return undefined;
  }
  var x = +coordinates[0];
  var y = +coordinates[1];
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
_ol_format_WMTSCapabilities_.readTileMatrix_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.TM_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixSetLimits Object.
 */
_ol_format_WMTSCapabilities_.readTileMatrixLimitsList_ = function(node,
    objectStack) {
  return _ol_xml_.pushParseAndPop([],
      _ol_format_WMTSCapabilities_.TMS_LIMITS_LIST_PARSERS_, node,
      objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixLimits Array.
 */
_ol_format_WMTSCapabilities_.readTileMatrixLimits_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_WMTSCapabilities_.TMS_LIMITS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_format_WMTSCapabilities_.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wmts/1.0'
];


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'Contents': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMTSCapabilities_.readContents_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.CONTENTS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'Layer': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readLayer_),
      'TileMatrixSet': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readTileMatrixSet_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.LAYER_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'Style': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readStyle_),
      'Format': _ol_xml_.makeObjectPropertyPusher(
          XSD.readString),
      'TileMatrixSetLink': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readTileMatrixSetLink_),
      'Dimension': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readDimensions_),
      'ResourceURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readResourceUrl_)
    }, _ol_xml_.makeStructureNS(_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
      'Title': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
      'WGS84BoundingBox': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMTSCapabilities_.readWgs84BoundingBox_),
      'Identifier': _ol_xml_.makeObjectPropertySetter(
          XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'LegendURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readLegendUrl_)
    }, _ol_xml_.makeStructureNS(_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
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
_ol_format_WMTSCapabilities_.TMS_LINKS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'TileMatrixSet': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
      'TileMatrixSetLimits': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMTSCapabilities_.readTileMatrixLimitsList_)
    });

/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.TMS_LIMITS_LIST_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'TileMatrixLimits': _ol_xml_.makeArrayPusher(
          _ol_format_WMTSCapabilities_.readTileMatrixLimits_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.TMS_LIMITS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
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
_ol_format_WMTSCapabilities_.DIMENSION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'Default': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
      'Value': _ol_xml_.makeObjectPropertyPusher(
          XSD.readString)
    }, _ol_xml_.makeStructureNS(_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
      'Identifier': _ol_xml_.makeObjectPropertySetter(
          XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.WGS84_BBOX_READERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
      'LowerCorner': _ol_xml_.makeArrayPusher(
          _ol_format_WMTSCapabilities_.readCoordinates_),
      'UpperCorner': _ol_xml_.makeArrayPusher(
          _ol_format_WMTSCapabilities_.readCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMTSCapabilities_.TMS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'WellKnownScaleSet': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
      'TileMatrix': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMTSCapabilities_.readTileMatrix_)
    }, _ol_xml_.makeStructureNS(_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
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
_ol_format_WMTSCapabilities_.TM_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMTSCapabilities_.NAMESPACE_URIS_, {
      'TopLeftCorner': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMTSCapabilities_.readCoordinates_),
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
    }, _ol_xml_.makeStructureNS(_ol_format_WMTSCapabilities_.OWS_NAMESPACE_URIS_, {
      'Identifier': _ol_xml_.makeObjectPropertySetter(
          XSD.readString)
    }));
export default _ol_format_WMTSCapabilities_;
