goog.provide('ol.format.WMTSCapabilities');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.format.OWS');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');


/**
 * @classdesc
 * Format for reading WMTS capabilities data.
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
ol.format.WMTSCapabilities = function() {
  ol.format.XML.call(this);

  /**
   * @type {ol.format.OWS}
   * @private
   */
  this.owsParser_ = new ol.format.OWS();
};
ol.inherits(ol.format.WMTSCapabilities, ol.format.XML);


/**
 * Read a WMTS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMTS capabilities.
 * @api
 */
ol.format.WMTSCapabilities.prototype.read;


/**
 * @param {Document} doc Document.
 * @return {Object} WMTS Capability object.
 */
ol.format.WMTSCapabilities.prototype.readFromDocument = function(doc) {
  ol.DEBUG && console.assert(doc.nodeType == Node.DOCUMENT_NODE,
      'doc.nodeType should be DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Object} WMTS Capability object.
 */
ol.format.WMTSCapabilities.prototype.readFromNode = function(node) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Capabilities',
      'localName should be Capabilities');
  var version = node.getAttribute('version').trim();
  var WMTSCapabilityObject = this.owsParser_.readFromNode(node);
  if (!WMTSCapabilityObject) {
    return null;
  }
  WMTSCapabilityObject['version'] = version;
  WMTSCapabilityObject = ol.xml.pushParseAndPop(WMTSCapabilityObject,
      ol.format.WMTSCapabilities.PARSERS_, node, []);
  return WMTSCapabilityObject ? WMTSCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
ol.format.WMTSCapabilities.readContents_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Contents',
      'localName should be Contents');

  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.CONTENTS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
ol.format.WMTSCapabilities.readLayer_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Layer', 'localName should be Layer');
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
ol.format.WMTSCapabilities.readTileMatrixSet_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.TMS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
ol.format.WMTSCapabilities.readStyle_ = function(node, objectStack) {
  var style = ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.STYLE_PARSERS_, node, objectStack);
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
ol.format.WMTSCapabilities.readTileMatrixSetLink_ = function(node,
    objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.TMS_LINKS_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
ol.format.WMTSCapabilities.readDimensions_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.DIMENSION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Resource URL object.
 */
ol.format.WMTSCapabilities.readResourceUrl_ = function(node, objectStack) {
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
ol.format.WMTSCapabilities.readWgs84BoundingBox_ = function(node, objectStack) {
  var coordinates = ol.xml.pushParseAndPop([],
      ol.format.WMTSCapabilities.WGS84_BBOX_READERS_, node, objectStack);
  if (coordinates.length != 2) {
    return undefined;
  }
  return ol.extent.boundingExtent(coordinates);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Legend object.
 */
ol.format.WMTSCapabilities.readLegendUrl_ = function(node, objectStack) {
  var legend = {};
  legend['format'] = node.getAttribute('format');
  legend['href'] = ol.format.XLink.readHref(node);
  return legend;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Coordinates object.
 */
ol.format.WMTSCapabilities.readCoordinates_ = function(node, objectStack) {
  var coordinates = ol.format.XSD.readString(node).split(' ');
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
ol.format.WMTSCapabilities.readTileMatrix_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.TM_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixSetLimits Object.
 */
ol.format.WMTSCapabilities.readTileMatrixLimitsList_ = function(node,
    objectStack) {
  return ol.xml.pushParseAndPop([],
      ol.format.WMTSCapabilities.TMS_LIMITS_LIST_PARSERS_, node,
      objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixLimits Array.
 */
ol.format.WMTSCapabilities.readTileMatrixLimits_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.WMTSCapabilities.TMS_LIMITS_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.WMTSCapabilities.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wmts/1.0'
];


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'Contents': ol.xml.makeObjectPropertySetter(
          ol.format.WMTSCapabilities.readContents_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.CONTENTS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'Layer': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readLayer_),
      'TileMatrixSet': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readTileMatrixSet_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.LAYER_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'Style': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readStyle_),
      'Format': ol.xml.makeObjectPropertyPusher(
          ol.format.XSD.readString),
      'TileMatrixSetLink': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readTileMatrixSetLink_),
      'Dimension': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readDimensions_),
      'ResourceURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readResourceUrl_)
    }, ol.xml.makeStructureNS(ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'Title': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'Abstract': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'WGS84BoundingBox': ol.xml.makeObjectPropertySetter(
          ol.format.WMTSCapabilities.readWgs84BoundingBox_),
      'Identifier': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'LegendURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readLegendUrl_)
    }, ol.xml.makeStructureNS(ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'Title': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'Identifier': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.TMS_LINKS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'TileMatrixSet': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'TileMatrixSetLimits': ol.xml.makeObjectPropertySetter(
          ol.format.WMTSCapabilities.readTileMatrixLimitsList_)
    });

/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.TMS_LIMITS_LIST_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'TileMatrixLimits': ol.xml.makeArrayPusher(
          ol.format.WMTSCapabilities.readTileMatrixLimits_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.TMS_LIMITS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'TileMatrix': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'MinTileRow': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MaxTileRow': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MinTileCol': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MaxTileCol': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.DIMENSION_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'Default': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'Value': ol.xml.makeObjectPropertyPusher(
          ol.format.XSD.readString)
    }, ol.xml.makeStructureNS(ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'Identifier': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.WGS84_BBOX_READERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'LowerCorner': ol.xml.makeArrayPusher(
          ol.format.WMTSCapabilities.readCoordinates_),
      'UpperCorner': ol.xml.makeArrayPusher(
          ol.format.WMTSCapabilities.readCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.TMS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'WellKnownScaleSet': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'TileMatrix': ol.xml.makeObjectPropertyPusher(
          ol.format.WMTSCapabilities.readTileMatrix_)
    }, ol.xml.makeStructureNS(ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'SupportedCRS': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'Identifier': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.WMTSCapabilities.TM_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.WMTSCapabilities.NAMESPACE_URIS_, {
      'TopLeftCorner': ol.xml.makeObjectPropertySetter(
          ol.format.WMTSCapabilities.readCoordinates_),
      'ScaleDenominator': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'TileWidth': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'TileHeight': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MatrixWidth': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MatrixHeight': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger)
    }, ol.xml.makeStructureNS(ol.format.WMTSCapabilities.OWS_NAMESPACE_URIS_, {
      'Identifier': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    }));
