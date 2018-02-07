/**
 * @module ol/format/WMSCapabilities
 */
import {inherits} from '../index.js';
import XLink from '../format/XLink.js';
import XML from '../format/XML.js';
import XSD from '../format/XSD.js';
import {makeArrayPusher, makeObjectPropertyPusher, makeObjectPropertySetter,
  makeStructureNS, pushParseAndPop} from '../xml.js';

/**
 * @classdesc
 * Format for reading WMS capabilities data
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
const WMSCapabilities = function() {

  XML.call(this);

  /**
   * @type {string|undefined}
   */
  this.version = undefined;
};

inherits(WMSCapabilities, XML);


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
WMSCapabilities.prototype.readFromNode = function(node) {
  this.version = node.getAttribute('version').trim();
  const wmsCapabilityObject = pushParseAndPop({
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
  return pushParseAndPop(
    {}, WMSCapabilities.ATTRIBUTION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Bounding box object.
 */
WMSCapabilities.readBoundingBox_ = function(node, objectStack) {
  const extent = [
    XSD.readDecimalString(node.getAttribute('minx')),
    XSD.readDecimalString(node.getAttribute('miny')),
    XSD.readDecimalString(node.getAttribute('maxx')),
    XSD.readDecimalString(node.getAttribute('maxy'))
  ];

  const resolutions = [
    XSD.readDecimalString(node.getAttribute('resx')),
    XSD.readDecimalString(node.getAttribute('resy'))
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
  const geographicBoundingBox = pushParseAndPop(
    {},
    WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_,
    node, objectStack);
  if (!geographicBoundingBox) {
    return undefined;
  }
  const westBoundLongitude = /** @type {number|undefined} */
        (geographicBoundingBox['westBoundLongitude']);
  const southBoundLatitude = /** @type {number|undefined} */
        (geographicBoundingBox['southBoundLatitude']);
  const eastBoundLongitude = /** @type {number|undefined} */
        (geographicBoundingBox['eastBoundLongitude']);
  const northBoundLatitude = /** @type {number|undefined} */
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
  return pushParseAndPop(
    {}, WMSCapabilities.CAPABILITY_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
WMSCapabilities.readService_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, WMSCapabilities.SERVICE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact information object.
 */
WMSCapabilities.readContactInformation_ = function(node, objectStack) {
  return pushParseAndPop(
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
  return pushParseAndPop(
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
  return pushParseAndPop(
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
  return pushParseAndPop(
    [], WMSCapabilities.EXCEPTION_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
WMSCapabilities.readCapabilityLayer_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, WMSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layer object.
 */
WMSCapabilities.readLayer_ = function(node, objectStack) {
  const parentLayerObject = /**  @type {Object.<string,*>} */
        (objectStack[objectStack.length - 1]);

  const layerObject = pushParseAndPop(
    {}, WMSCapabilities.LAYER_PARSERS_, node, objectStack);

  if (!layerObject) {
    return undefined;
  }
  let queryable =
        XSD.readBooleanString(node.getAttribute('queryable'));
  if (queryable === undefined) {
    queryable = parentLayerObject['queryable'];
  }
  layerObject['queryable'] = queryable !== undefined ? queryable : false;

  let cascaded = XSD.readNonNegativeIntegerString(
    node.getAttribute('cascaded'));
  if (cascaded === undefined) {
    cascaded = parentLayerObject['cascaded'];
  }
  layerObject['cascaded'] = cascaded;

  let opaque = XSD.readBooleanString(node.getAttribute('opaque'));
  if (opaque === undefined) {
    opaque = parentLayerObject['opaque'];
  }
  layerObject['opaque'] = opaque !== undefined ? opaque : false;

  let noSubsets =
        XSD.readBooleanString(node.getAttribute('noSubsets'));
  if (noSubsets === undefined) {
    noSubsets = parentLayerObject['noSubsets'];
  }
  layerObject['noSubsets'] = noSubsets !== undefined ? noSubsets : false;

  let fixedWidth =
        XSD.readDecimalString(node.getAttribute('fixedWidth'));
  if (!fixedWidth) {
    fixedWidth = parentLayerObject['fixedWidth'];
  }
  layerObject['fixedWidth'] = fixedWidth;

  let fixedHeight =
        XSD.readDecimalString(node.getAttribute('fixedHeight'));
  if (!fixedHeight) {
    fixedHeight = parentLayerObject['fixedHeight'];
  }
  layerObject['fixedHeight'] = fixedHeight;

  // See 7.2.4.8
  const addKeys = ['Style', 'CRS', 'AuthorityURL'];
  addKeys.forEach(function(key) {
    if (key in parentLayerObject) {
      const childValue = layerObject[key] || [];
      layerObject[key] = childValue.concat(parentLayerObject[key]);
    }
  });

  const replaceKeys = ['EX_GeographicBoundingBox', 'BoundingBox', 'Dimension',
    'Attribution', 'MinScaleDenominator', 'MaxScaleDenominator'];
  replaceKeys.forEach(function(key) {
    if (!(key in layerObject)) {
      const parentValue = parentLayerObject[key];
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
  const dimensionObject = {
    'name': node.getAttribute('name'),
    'units': node.getAttribute('units'),
    'unitSymbol': node.getAttribute('unitSymbol'),
    'default': node.getAttribute('default'),
    'multipleValues': XSD.readBooleanString(
      node.getAttribute('multipleValues')),
    'nearestValue': XSD.readBooleanString(
      node.getAttribute('nearestValue')),
    'current': XSD.readBooleanString(node.getAttribute('current')),
    'values': XSD.readString(node)
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
  return pushParseAndPop(
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
  return pushParseAndPop(
    {}, WMSCapabilities.REQUEST_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} DCP type object.
 */
WMSCapabilities.readDCPType_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, WMSCapabilities.DCPTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} HTTP object.
 */
WMSCapabilities.readHTTP_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, WMSCapabilities.HTTP_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Operation type object.
 */
WMSCapabilities.readOperationType_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, WMSCapabilities.OPERATIONTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
WMSCapabilities.readSizedFormatOnlineresource_ = function(node, objectStack) {
  const formatOnlineresource =
        WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (formatOnlineresource) {
    const size = [
      XSD.readNonNegativeIntegerString(node.getAttribute('width')),
      XSD.readNonNegativeIntegerString(node.getAttribute('height'))
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
  const authorityObject =
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
  const metadataObject =
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
  return pushParseAndPop(
    {}, WMSCapabilities.STYLE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Keyword list.
 */
WMSCapabilities.readKeywordList_ = function(node, objectStack) {
  return pushParseAndPop(
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
WMSCapabilities.PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Service': makeObjectPropertySetter(
      WMSCapabilities.readService_),
    'Capability': makeObjectPropertySetter(
      WMSCapabilities.readCapability_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CAPABILITY_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Request': makeObjectPropertySetter(
      WMSCapabilities.readRequest_),
    'Exception': makeObjectPropertySetter(
      WMSCapabilities.readException_),
    'Layer': makeObjectPropertySetter(
      WMSCapabilities.readCapabilityLayer_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.SERVICE_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Name': makeObjectPropertySetter(XSD.readString),
    'Title': makeObjectPropertySetter(XSD.readString),
    'Abstract': makeObjectPropertySetter(XSD.readString),
    'KeywordList': makeObjectPropertySetter(
      WMSCapabilities.readKeywordList_),
    'OnlineResource': makeObjectPropertySetter(
      XLink.readHref),
    'ContactInformation': makeObjectPropertySetter(
      WMSCapabilities.readContactInformation_),
    'Fees': makeObjectPropertySetter(XSD.readString),
    'AccessConstraints': makeObjectPropertySetter(
      XSD.readString),
    'LayerLimit': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxWidth': makeObjectPropertySetter(
      XSD.readNonNegativeInteger),
    'MaxHeight': makeObjectPropertySetter(
      XSD.readNonNegativeInteger)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_INFORMATION_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'ContactPersonPrimary': makeObjectPropertySetter(
      WMSCapabilities.readContactPersonPrimary_),
    'ContactPosition': makeObjectPropertySetter(
      XSD.readString),
    'ContactAddress': makeObjectPropertySetter(
      WMSCapabilities.readContactAddress_),
    'ContactVoiceTelephone': makeObjectPropertySetter(
      XSD.readString),
    'ContactFacsimileTelephone': makeObjectPropertySetter(
      XSD.readString),
    'ContactElectronicMailAddress': makeObjectPropertySetter(
      XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_PERSON_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'ContactPerson': makeObjectPropertySetter(
      XSD.readString),
    'ContactOrganization': makeObjectPropertySetter(
      XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.CONTACT_ADDRESS_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'AddressType': makeObjectPropertySetter(XSD.readString),
    'Address': makeObjectPropertySetter(XSD.readString),
    'City': makeObjectPropertySetter(XSD.readString),
    'StateOrProvince': makeObjectPropertySetter(
      XSD.readString),
    'PostCode': makeObjectPropertySetter(XSD.readString),
    'Country': makeObjectPropertySetter(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.EXCEPTION_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Format': makeArrayPusher(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.LAYER_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Name': makeObjectPropertySetter(XSD.readString),
    'Title': makeObjectPropertySetter(XSD.readString),
    'Abstract': makeObjectPropertySetter(XSD.readString),
    'KeywordList': makeObjectPropertySetter(
      WMSCapabilities.readKeywordList_),
    'CRS': makeObjectPropertyPusher(XSD.readString),
    'EX_GeographicBoundingBox': makeObjectPropertySetter(
      WMSCapabilities.readEXGeographicBoundingBox_),
    'BoundingBox': makeObjectPropertyPusher(
      WMSCapabilities.readBoundingBox_),
    'Dimension': makeObjectPropertyPusher(
      WMSCapabilities.readDimension_),
    'Attribution': makeObjectPropertySetter(
      WMSCapabilities.readAttribution_),
    'AuthorityURL': makeObjectPropertyPusher(
      WMSCapabilities.readAuthorityURL_),
    'Identifier': makeObjectPropertyPusher(XSD.readString),
    'MetadataURL': makeObjectPropertyPusher(
      WMSCapabilities.readMetadataURL_),
    'DataURL': makeObjectPropertyPusher(
      WMSCapabilities.readFormatOnlineresource_),
    'FeatureListURL': makeObjectPropertyPusher(
      WMSCapabilities.readFormatOnlineresource_),
    'Style': makeObjectPropertyPusher(
      WMSCapabilities.readStyle_),
    'MinScaleDenominator': makeObjectPropertySetter(
      XSD.readDecimal),
    'MaxScaleDenominator': makeObjectPropertySetter(
      XSD.readDecimal),
    'Layer': makeObjectPropertyPusher(
      WMSCapabilities.readLayer_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.ATTRIBUTION_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Title': makeObjectPropertySetter(XSD.readString),
    'OnlineResource': makeObjectPropertySetter(
      XLink.readHref),
    'LogoURL': makeObjectPropertySetter(
      WMSCapabilities.readSizedFormatOnlineresource_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_ =
    makeStructureNS(WMSCapabilities.NAMESPACE_URIS_, {
      'westBoundLongitude': makeObjectPropertySetter(
        XSD.readDecimal),
      'eastBoundLongitude': makeObjectPropertySetter(
        XSD.readDecimal),
      'southBoundLatitude': makeObjectPropertySetter(
        XSD.readDecimal),
      'northBoundLatitude': makeObjectPropertySetter(
        XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.REQUEST_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'GetCapabilities': makeObjectPropertySetter(
      WMSCapabilities.readOperationType_),
    'GetMap': makeObjectPropertySetter(
      WMSCapabilities.readOperationType_),
    'GetFeatureInfo': makeObjectPropertySetter(
      WMSCapabilities.readOperationType_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.OPERATIONTYPE_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Format': makeObjectPropertyPusher(XSD.readString),
    'DCPType': makeObjectPropertyPusher(
      WMSCapabilities.readDCPType_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.DCPTYPE_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'HTTP': makeObjectPropertySetter(
      WMSCapabilities.readHTTP_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.HTTP_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Get': makeObjectPropertySetter(
      WMSCapabilities.readFormatOnlineresource_),
    'Post': makeObjectPropertySetter(
      WMSCapabilities.readFormatOnlineresource_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.STYLE_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Name': makeObjectPropertySetter(XSD.readString),
    'Title': makeObjectPropertySetter(XSD.readString),
    'Abstract': makeObjectPropertySetter(XSD.readString),
    'LegendURL': makeObjectPropertyPusher(
      WMSCapabilities.readSizedFormatOnlineresource_),
    'StyleSheetURL': makeObjectPropertySetter(
      WMSCapabilities.readFormatOnlineresource_),
    'StyleURL': makeObjectPropertySetter(
      WMSCapabilities.readFormatOnlineresource_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.FORMAT_ONLINERESOURCE_PARSERS_ =
    makeStructureNS(WMSCapabilities.NAMESPACE_URIS_, {
      'Format': makeObjectPropertySetter(XSD.readString),
      'OnlineResource': makeObjectPropertySetter(
        XLink.readHref)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
WMSCapabilities.KEYWORDLIST_PARSERS_ = makeStructureNS(
  WMSCapabilities.NAMESPACE_URIS_, {
    'Keyword': makeArrayPusher(XSD.readString)
  });
export default WMSCapabilities;
