/**
 * @module ol/format/WMSCapabilities
 */
import {inherits} from '../index.js';
import XLink from '../format/XLink.js';
import _ol_format_XML_ from '../format/XML.js';
import _ol_format_XSD_ from '../format/XSD.js';
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Format for reading WMS capabilities data
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
var WMSCapabilities = function() {

  _ol_format_XML_.call(this);

  /**
   * @type {string|undefined}
   */
  this.version = undefined;
};

inherits(WMSCapabilities, _ol_format_XML_);


/**
 * Read a WMS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMS capabilities.
 * @api
 */
WMSCapabilities.prototype.read;


/**
 * @inheritDoc
 */
WMSCapabilities.prototype.readFromDocument = function(doc) {
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
WMSCapabilities.prototype.readFromNode = function(node) {
  this.version = node.getAttribute('version').trim();
  var wmsCapabilityObject = _ol_xml_.pushParseAndPop({
    'version': this.version
  }, WMSCapabilities.PARSERS_, node, []);
  return wmsCapabilityObject ? wmsCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
WMSCapabilities.readAttribution_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.ATTRIBUTION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Bounding box object.
 */
WMSCapabilities.readBoundingBox_ = function(node, objectStack) {
  var extent = [
    _ol_format_XSD_.readDecimalString(node.getAttribute('minx')),
    _ol_format_XSD_.readDecimalString(node.getAttribute('miny')),
    _ol_format_XSD_.readDecimalString(node.getAttribute('maxx')),
    _ol_format_XSD_.readDecimalString(node.getAttribute('maxy'))
  ];

  var resolutions = [
    _ol_format_XSD_.readDecimalString(node.getAttribute('resx')),
    _ol_format_XSD_.readDecimalString(node.getAttribute('resy'))
  ];

  return {
    'crs': node.getAttribute('CRS'),
    'extent': extent,
    'res': resolutions
  };
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.Extent|undefined} Bounding box object.
 */
WMSCapabilities.readEXGeographicBoundingBox_ = function(node, objectStack) {
  var geographicBoundingBox = _ol_xml_.pushParseAndPop(
      {},
      WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_,
      node, objectStack);
  if (!geographicBoundingBox) {
    return undefined;
  }
  var westBoundLongitude = /** @type {number|undefined} */
        (geographicBoundingBox['westBoundLongitude']);
  var southBoundLatitude = /** @type {number|undefined} */
        (geographicBoundingBox['southBoundLatitude']);
  var eastBoundLongitude = /** @type {number|undefined} */
        (geographicBoundingBox['eastBoundLongitude']);
  var northBoundLatitude = /** @type {number|undefined} */
        (geographicBoundingBox['northBoundLatitude']);
  if (westBoundLongitude === undefined || southBoundLatitude === undefined ||
        eastBoundLongitude === undefined || northBoundLatitude === undefined) {
    return undefined;
  }
  return [
    westBoundLongitude, southBoundLatitude,
    eastBoundLongitude, northBoundLatitude
  ];
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Capability object.
 */
WMSCapabilities.readCapability_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.CAPABILITY_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
WMSCapabilities.readService_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.SERVICE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact information object.
 */
WMSCapabilities.readContactInformation_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.CONTACT_INFORMATION_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact person object.
 */
WMSCapabilities.readContactPersonPrimary_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.CONTACT_PERSON_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact address object.
 */
WMSCapabilities.readContactAddress_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.CONTACT_ADDRESS_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<string>|undefined} Format array.
 */
WMSCapabilities.readException_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], WMSCapabilities.EXCEPTION_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
WMSCapabilities.readCapabilityLayer_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layer object.
 */
WMSCapabilities.readLayer_ = function(node, objectStack) {
  var parentLayerObject = /**  @type {Object.<string,*>} */
        (objectStack[objectStack.length - 1]);

  var layerObject = _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.LAYER_PARSERS_, node, objectStack);

  if (!layerObject) {
    return undefined;
  }
  var queryable =
        _ol_format_XSD_.readBooleanString(node.getAttribute('queryable'));
  if (queryable === undefined) {
    queryable = parentLayerObject['queryable'];
  }
  layerObject['queryable'] = queryable !== undefined ? queryable : false;

  var cascaded = _ol_format_XSD_.readNonNegativeIntegerString(
      node.getAttribute('cascaded'));
  if (cascaded === undefined) {
    cascaded = parentLayerObject['cascaded'];
  }
  layerObject['cascaded'] = cascaded;

  var opaque = _ol_format_XSD_.readBooleanString(node.getAttribute('opaque'));
  if (opaque === undefined) {
    opaque = parentLayerObject['opaque'];
  }
  layerObject['opaque'] = opaque !== undefined ? opaque : false;

  var noSubsets =
        _ol_format_XSD_.readBooleanString(node.getAttribute('noSubsets'));
  if (noSubsets === undefined) {
    noSubsets = parentLayerObject['noSubsets'];
  }
  layerObject['noSubsets'] = noSubsets !== undefined ? noSubsets : false;

  var fixedWidth =
        _ol_format_XSD_.readDecimalString(node.getAttribute('fixedWidth'));
  if (!fixedWidth) {
    fixedWidth = parentLayerObject['fixedWidth'];
  }
  layerObject['fixedWidth'] = fixedWidth;

  var fixedHeight =
        _ol_format_XSD_.readDecimalString(node.getAttribute('fixedHeight'));
  if (!fixedHeight) {
    fixedHeight = parentLayerObject['fixedHeight'];
  }
  layerObject['fixedHeight'] = fixedHeight;

  // See 7.2.4.8
  var addKeys = ['Style', 'CRS', 'AuthorityURL'];
  addKeys.forEach(function(key) {
    if (key in parentLayerObject) {
      var childValue = layerObject[key] || [];
      layerObject[key] = childValue.concat(parentLayerObject[key]);
    }
  });

  var replaceKeys = ['EX_GeographicBoundingBox', 'BoundingBox', 'Dimension',
    'Attribution', 'MinScaleDenominator', 'MaxScaleDenominator'];
  replaceKeys.forEach(function(key) {
    if (!(key in layerObject)) {
      var parentValue = parentLayerObject[key];
      layerObject[key] = parentValue;
    }
  });

  return layerObject;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Dimension object.
 */
WMSCapabilities.readDimension_ = function(node, objectStack) {
  var dimensionObject = {
    'name': node.getAttribute('name'),
    'units': node.getAttribute('units'),
    'unitSymbol': node.getAttribute('unitSymbol'),
    'default': node.getAttribute('default'),
    'multipleValues': _ol_format_XSD_.readBooleanString(
        node.getAttribute('multipleValues')),
    'nearestValue': _ol_format_XSD_.readBooleanString(
        node.getAttribute('nearestValue')),
    'current': _ol_format_XSD_.readBooleanString(node.getAttribute('current')),
    'values': _ol_format_XSD_.readString(node)
  };
  return dimensionObject;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
WMSCapabilities.readFormatOnlineresource_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.FORMAT_ONLINERESOURCE_PARSERS_,
      node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Request object.
 */
WMSCapabilities.readRequest_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.REQUEST_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} DCP type object.
 */
WMSCapabilities.readDCPType_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.DCPTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} HTTP object.
 */
WMSCapabilities.readHTTP_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.HTTP_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Operation type object.
 */
WMSCapabilities.readOperationType_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.OPERATIONTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
WMSCapabilities.readSizedFormatOnlineresource_ = function(node, objectStack) {
  var formatOnlineresource =
        WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (formatOnlineresource) {
    var size = [
      _ol_format_XSD_.readNonNegativeIntegerString(node.getAttribute('width')),
      _ol_format_XSD_.readNonNegativeIntegerString(node.getAttribute('height'))
    ];
    formatOnlineresource['size'] = size;
    return formatOnlineresource;
  }
  return undefined;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Authority URL object.
 */
WMSCapabilities.readAuthorityURL_ = function(node, objectStack) {
  var authorityObject =
        WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (authorityObject) {
    authorityObject['name'] = node.getAttribute('name');
    return authorityObject;
  }
  return undefined;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Metadata URL object.
 */
WMSCapabilities.readMetadataURL_ = function(node, objectStack) {
  var metadataObject =
        WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (metadataObject) {
    metadataObject['type'] = node.getAttribute('type');
    return metadataObject;
  }
  return undefined;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
WMSCapabilities.readStyle_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, WMSCapabilities.STYLE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Keyword list.
 */
WMSCapabilities.readKeywordList_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], WMSCapabilities.KEYWORDLIST_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
WMSCapabilities.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wms'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Service': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readService_),
      'Capability': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readCapability_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CAPABILITY_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Request': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readRequest_),
      'Exception': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readException_),
      'Layer': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readCapabilityLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.SERVICE_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'KeywordList': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readKeywordList_),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          XLink.readHref),
      'ContactInformation': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readContactInformation_),
      'Fees': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'AccessConstraints': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'LayerLimit': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readNonNegativeInteger),
      'MaxWidth': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readNonNegativeInteger),
      'MaxHeight': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readNonNegativeInteger)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_INFORMATION_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'ContactPersonPrimary': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readContactPersonPrimary_),
      'ContactPosition': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'ContactAddress': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readContactAddress_),
      'ContactVoiceTelephone': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'ContactFacsimileTelephone': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'ContactElectronicMailAddress': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_PERSON_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'ContactPerson': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'ContactOrganization': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_ADDRESS_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'AddressType': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Address': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'City': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'StateOrProvince': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'PostCode': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Country': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.EXCEPTION_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeArrayPusher(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.LAYER_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'KeywordList': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readKeywordList_),
      'CRS': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'EX_GeographicBoundingBox': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readEXGeographicBoundingBox_),
      'BoundingBox': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readBoundingBox_),
      'Dimension': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readDimension_),
      'Attribution': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readAttribution_),
      'AuthorityURL': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readAuthorityURL_),
      'Identifier': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'MetadataURL': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readMetadataURL_),
      'DataURL': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readFormatOnlineresource_),
      'FeatureListURL': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readFormatOnlineresource_),
      'Style': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readStyle_),
      'MinScaleDenominator': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'MaxScaleDenominator': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'Layer': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.ATTRIBUTION_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          XLink.readHref),
      'LogoURL': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readSizedFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_ =
    _ol_xml_.makeStructureNS(WMSCapabilities.NAMESPACE_URIS_, {
      'westBoundLongitude': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'eastBoundLongitude': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'southBoundLatitude': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'northBoundLatitude': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.REQUEST_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'GetCapabilities': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readOperationType_),
      'GetMap': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readOperationType_),
      'GetFeatureInfo': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readOperationType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.OPERATIONTYPE_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'DCPType': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readDCPType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.DCPTYPE_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'HTTP': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readHTTP_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.HTTP_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Get': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readFormatOnlineresource_),
      'Post': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'LegendURL': _ol_xml_.makeObjectPropertyPusher(
          WMSCapabilities.readSizedFormatOnlineresource_),
      'StyleSheetURL': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readFormatOnlineresource_),
      'StyleURL': _ol_xml_.makeObjectPropertySetter(
          WMSCapabilities.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.FORMAT_ONLINERESOURCE_PARSERS_ =
    _ol_xml_.makeStructureNS(WMSCapabilities.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          XLink.readHref)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.KEYWORDLIST_PARSERS_ = _ol_xml_.makeStructureNS(
    WMSCapabilities.NAMESPACE_URIS_, {
      'Keyword': _ol_xml_.makeArrayPusher(_ol_format_XSD_.readString)
    });
export default WMSCapabilities;
