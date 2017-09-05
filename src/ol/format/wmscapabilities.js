import _ol_ from '../index';
import _ol_format_XLink_ from '../format/xlink';
import _ol_format_XML_ from '../format/xml';
import _ol_format_XSD_ from '../format/xsd';
import _ol_xml_ from '../xml';

/**
 * @classdesc
 * Format for reading WMS capabilities data
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
var _ol_format_WMSCapabilities_ = function() {

  _ol_format_XML_.call(this);

  /**
   * @type {string|undefined}
   */
  this.version = undefined;
};

_ol_.inherits(_ol_format_WMSCapabilities_, _ol_format_XML_);


/**
 * Read a WMS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMS capabilities.
 * @api
 */
_ol_format_WMSCapabilities_.prototype.read;


/**
 * @inheritDoc
 */
_ol_format_WMSCapabilities_.prototype.readFromDocument = function(doc) {
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
_ol_format_WMSCapabilities_.prototype.readFromNode = function(node) {
  this.version = node.getAttribute('version').trim();
  var wmsCapabilityObject = _ol_xml_.pushParseAndPop({
    'version': this.version
  }, _ol_format_WMSCapabilities_.PARSERS_, node, []);
  return wmsCapabilityObject ? wmsCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
_ol_format_WMSCapabilities_.readAttribution_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.ATTRIBUTION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Bounding box object.
 */
_ol_format_WMSCapabilities_.readBoundingBox_ = function(node, objectStack) {
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
_ol_format_WMSCapabilities_.readEXGeographicBoundingBox_ = function(node, objectStack) {
  var geographicBoundingBox = _ol_xml_.pushParseAndPop(
      {},
      _ol_format_WMSCapabilities_.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_,
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
_ol_format_WMSCapabilities_.readCapability_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.CAPABILITY_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
_ol_format_WMSCapabilities_.readService_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.SERVICE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact information object.
 */
_ol_format_WMSCapabilities_.readContactInformation_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.CONTACT_INFORMATION_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact person object.
 */
_ol_format_WMSCapabilities_.readContactPersonPrimary_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.CONTACT_PERSON_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact address object.
 */
_ol_format_WMSCapabilities_.readContactAddress_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.CONTACT_ADDRESS_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<string>|undefined} Format array.
 */
_ol_format_WMSCapabilities_.readException_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], _ol_format_WMSCapabilities_.EXCEPTION_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
_ol_format_WMSCapabilities_.readCapabilityLayer_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layer object.
 */
_ol_format_WMSCapabilities_.readLayer_ = function(node, objectStack) {
  var parentLayerObject = /**  @type {Object.<string,*>} */
        (objectStack[objectStack.length - 1]);

  var layerObject = _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.LAYER_PARSERS_, node, objectStack);

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
_ol_format_WMSCapabilities_.readDimension_ = function(node, objectStack) {
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
_ol_format_WMSCapabilities_.readFormatOnlineresource_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.FORMAT_ONLINERESOURCE_PARSERS_,
      node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Request object.
 */
_ol_format_WMSCapabilities_.readRequest_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.REQUEST_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} DCP type object.
 */
_ol_format_WMSCapabilities_.readDCPType_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.DCPTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} HTTP object.
 */
_ol_format_WMSCapabilities_.readHTTP_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.HTTP_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Operation type object.
 */
_ol_format_WMSCapabilities_.readOperationType_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.OPERATIONTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
_ol_format_WMSCapabilities_.readSizedFormatOnlineresource_ = function(node, objectStack) {
  var formatOnlineresource =
        _ol_format_WMSCapabilities_.readFormatOnlineresource_(node, objectStack);
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
_ol_format_WMSCapabilities_.readAuthorityURL_ = function(node, objectStack) {
  var authorityObject =
        _ol_format_WMSCapabilities_.readFormatOnlineresource_(node, objectStack);
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
_ol_format_WMSCapabilities_.readMetadataURL_ = function(node, objectStack) {
  var metadataObject =
        _ol_format_WMSCapabilities_.readFormatOnlineresource_(node, objectStack);
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
_ol_format_WMSCapabilities_.readStyle_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_WMSCapabilities_.STYLE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Keyword list.
 */
_ol_format_WMSCapabilities_.readKeywordList_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      [], _ol_format_WMSCapabilities_.KEYWORDLIST_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_format_WMSCapabilities_.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wms'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Service': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readService_),
      'Capability': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readCapability_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.CAPABILITY_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Request': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readRequest_),
      'Exception': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readException_),
      'Layer': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readCapabilityLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.SERVICE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'KeywordList': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readKeywordList_),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XLink_.readHref),
      'ContactInformation': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readContactInformation_),
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
_ol_format_WMSCapabilities_.CONTACT_INFORMATION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'ContactPersonPrimary': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readContactPersonPrimary_),
      'ContactPosition': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'ContactAddress': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readContactAddress_),
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
_ol_format_WMSCapabilities_.CONTACT_PERSON_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
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
_ol_format_WMSCapabilities_.CONTACT_ADDRESS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
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
_ol_format_WMSCapabilities_.EXCEPTION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeArrayPusher(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.LAYER_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'KeywordList': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readKeywordList_),
      'CRS': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'EX_GeographicBoundingBox': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readEXGeographicBoundingBox_),
      'BoundingBox': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readBoundingBox_),
      'Dimension': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readDimension_),
      'Attribution': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readAttribution_),
      'AuthorityURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readAuthorityURL_),
      'Identifier': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'MetadataURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readMetadataURL_),
      'DataURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_),
      'FeatureListURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_),
      'Style': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readStyle_),
      'MinScaleDenominator': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'MaxScaleDenominator': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readDecimal),
      'Layer': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.ATTRIBUTION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XLink_.readHref),
      'LogoURL': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readSizedFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_ =
    _ol_xml_.makeStructureNS(_ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
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
_ol_format_WMSCapabilities_.REQUEST_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'GetCapabilities': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readOperationType_),
      'GetMap': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readOperationType_),
      'GetFeatureInfo': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readOperationType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.OPERATIONTYPE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeObjectPropertyPusher(_ol_format_XSD_.readString),
      'DCPType': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readDCPType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.DCPTYPE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'HTTP': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readHTTP_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.HTTP_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Get': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_),
      'Post': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Abstract': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'LegendURL': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_WMSCapabilities_.readSizedFormatOnlineresource_),
      'StyleSheetURL': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_),
      'StyleURL': _ol_xml_.makeObjectPropertySetter(
          _ol_format_WMSCapabilities_.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.FORMAT_ONLINERESOURCE_PARSERS_ =
    _ol_xml_.makeStructureNS(_ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Format': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'OnlineResource': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XLink_.readHref)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_WMSCapabilities_.KEYWORDLIST_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_WMSCapabilities_.NAMESPACE_URIS_, {
      'Keyword': _ol_xml_.makeArrayPusher(_ol_format_XSD_.readString)
    });
export default _ol_format_WMSCapabilities_;
