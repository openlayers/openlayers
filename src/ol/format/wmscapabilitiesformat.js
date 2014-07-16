goog.provide('ol.format.WMSCapabilities');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @classdesc
 * Format for reading WMS capabilities data
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
ol.format.WMSCapabilities = function() {

  goog.base(this);

  /**
   * @type {string|undefined}
   */
  this.version = undefined;
};
goog.inherits(ol.format.WMSCapabilities, ol.format.XML);


/**
 * Read a WMS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMS capabilities.
 * @api
 */
ol.format.WMSCapabilities.prototype.read;


/**
 * @param {Document} doc Document.
 * @return {Object} WMS Capability object.
 */
ol.format.WMSCapabilities.prototype.readFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT);
  for (var n = doc.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Object} WMS Capability object.
 */
ol.format.WMSCapabilities.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'WMS_Capabilities' ||
      node.localName == 'WMT_MS_Capabilities');
  this.version = goog.string.trim(node.getAttribute('version'));
  goog.asserts.assertString(this.version);
  var wmsCapabilityObject = ol.xml.pushParseAndPop({
    'version': this.version
  }, ol.format.WMSCapabilities.PARSERS_, node, []);
  return goog.isDef(wmsCapabilityObject) ? wmsCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
ol.format.WMSCapabilities.readAttribution_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Attribution');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.ATTRIBUTION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Bounding box object.
 */
ol.format.WMSCapabilities.readBoundingBox_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'BoundingBox');

  var extent = [
    ol.format.XSD.readDecimalString(node.getAttribute('minx')),
    ol.format.XSD.readDecimalString(node.getAttribute('miny')),
    ol.format.XSD.readDecimalString(node.getAttribute('maxx')),
    ol.format.XSD.readDecimalString(node.getAttribute('maxy'))
  ];

  var resolutions = [
    ol.format.XSD.readDecimalString(node.getAttribute('resx')),
    ol.format.XSD.readDecimalString(node.getAttribute('resy'))
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
ol.format.WMSCapabilities.readEXGeographicBoundingBox_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'EX_GeographicBoundingBox');
  var geographicBoundingBox = ol.xml.pushParseAndPop(
      {},
      ol.format.WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_,
      node, objectStack);
  if (!goog.isDef(geographicBoundingBox)) {
    return undefined;
  }
  var westBoundLongitude = /** @type {number|undefined} */ (goog.object.get(
      geographicBoundingBox, 'westBoundLongitude'));
  var southBoundLatitude = /** @type {number|undefined} */ (goog.object.get(
      geographicBoundingBox, 'southBoundLatitude'));
  var eastBoundLongitude = /** @type {number|undefined} */ (goog.object.get(
      geographicBoundingBox, 'eastBoundLongitude'));
  var northBoundLatitude = /** @type {number|undefined} */ (goog.object.get(
      geographicBoundingBox, 'northBoundLatitude'));
  if (!goog.isDef(westBoundLongitude) || !goog.isDef(southBoundLatitude) ||
      !goog.isDef(eastBoundLongitude) || !goog.isDef(northBoundLatitude)) {
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
ol.format.WMSCapabilities.readCapability_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Capability');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.CAPABILITY_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.WMSCapabilities.readService_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Service');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.SERVICE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact information object.
 */
ol.format.WMSCapabilities.readContactInformation_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ContactInformation');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.CONTACT_INFORMATION_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact person object.
 */
ol.format.WMSCapabilities.readContactPersonPrimary_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ContactPersonPrimary');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.CONTACT_PERSON_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact address object.
 */
ol.format.WMSCapabilities.readContactAddress_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ContactAddress');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.CONTACT_ADDRESS_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<string>|undefined} Format array.
 */
ol.format.WMSCapabilities.readException_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Exception');
  return ol.xml.pushParseAndPop(
      [], ol.format.WMSCapabilities.EXCEPTION_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
ol.format.WMSCapabilities.readCapabilityLayer_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Layer');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.LAYER_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layer object.
 */
ol.format.WMSCapabilities.readLayer_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Layer');
  var parentLayerObject = /**  @type {Object.<string,*>} */
      (objectStack[objectStack.length - 1]);

  var layerObject = /**  @type {Object.<string,*>} */ (ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.LAYER_PARSERS_, node, objectStack));

  if (!goog.isDef(layerObject)) {
    return undefined;
  }
  var queryable =
      ol.format.XSD.readBooleanString(node.getAttribute('queryable'));
  if (!goog.isDef(queryable)) {
    queryable = goog.object.get(parentLayerObject, 'queryable');
  }
  goog.object.set(
      layerObject, 'queryable', goog.isDef(queryable) ? queryable : false);

  var cascaded = ol.format.XSD.readNonNegativeIntegerString(
      node.getAttribute('cascaded'));
  if (!goog.isDef(cascaded)) {
    cascaded = goog.object.get(parentLayerObject, 'cascaded');
  }
  goog.object.set(layerObject, 'cascaded', cascaded);

  var opaque = ol.format.XSD.readBooleanString(node.getAttribute('opaque'));
  if (!goog.isDef(opaque)) {
    opaque = goog.object.get(parentLayerObject, 'opaque');
  }
  goog.object.set(layerObject, 'opaque', goog.isDef(opaque) ? opaque : false);

  var noSubsets =
      ol.format.XSD.readBooleanString(node.getAttribute('noSubsets'));
  if (!goog.isDef(noSubsets)) {
    noSubsets = goog.object.get(parentLayerObject, 'noSubsets');
  }
  goog.object.set(
      layerObject, 'noSubsets', goog.isDef(noSubsets) ? noSubsets : false);

  var fixedWidth =
      ol.format.XSD.readDecimalString(node.getAttribute('fixedWidth'));
  if (!goog.isDef(fixedWidth)) {
    fixedWidth = goog.object.get(parentLayerObject, 'fixedWidth');
  }
  goog.object.set(layerObject, 'fixedWidth', fixedWidth);

  var fixedHeight =
      ol.format.XSD.readDecimalString(node.getAttribute('fixedHeight'));
  if (!goog.isDef(fixedHeight)) {
    fixedHeight = goog.object.get(parentLayerObject, 'fixedHeight');
  }
  goog.object.set(layerObject, 'fixedHeight', fixedHeight);

  // See 7.2.4.8
  var addKeys = ['Style', 'CRS', 'AuthorityURL'];
  goog.array.forEach(addKeys, function(key) {
    var parentValue = goog.object.get(parentLayerObject, key);
    if (goog.isDef(parentValue)) {
      var childValue = goog.object.setIfUndefined(layerObject, key, []);
      childValue = childValue.concat(parentValue);
    }
  });

  var replaceKeys = ['EX_GeographicBoundingBox', 'BoundingBox', 'Dimension',
    'Attribution', 'MinScaleDenominator', 'MaxScaleDenominator'];
  goog.array.forEach(replaceKeys, function(key) {
    var childValue = goog.object.get(layerObject, key);
    if (!goog.isDef(childValue)) {
      var parentValue = goog.object.get(parentLayerObject, key);
      goog.object.set(layerObject, key, parentValue);
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
ol.format.WMSCapabilities.readDimension_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Dimension');
  var dimensionObject = {
    'name': node.getAttribute('name'),
    'units': node.getAttribute('units'),
    'unitSymbol': node.getAttribute('unitSymbol'),
    'default': node.getAttribute('default'),
    'multipleValues': ol.format.XSD.readBooleanString(
        node.getAttribute('multipleValues')),
    'nearestValue': ol.format.XSD.readBooleanString(
        node.getAttribute('nearestValue')),
    'current': ol.format.XSD.readBooleanString(node.getAttribute('current')),
    'values': ol.format.XSD.readString(node)
  };
  return dimensionObject;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
ol.format.WMSCapabilities.readFormatOnlineresource_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.FORMAT_ONLINERESOURCE_PARSERS_,
      node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Request object.
 */
ol.format.WMSCapabilities.readRequest_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Request');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.REQUEST_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} DCP type object.
 */
ol.format.WMSCapabilities.readDCPType_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'DCPType');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.DCPTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} HTTP object.
 */
ol.format.WMSCapabilities.readHTTP_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'HTTP');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.HTTP_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Operation type object.
 */
ol.format.WMSCapabilities.readOperationType_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.OPERATIONTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
ol.format.WMSCapabilities.readSizedFormatOnlineresource_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var formatOnlineresource =
      ol.format.WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (goog.isDef(formatOnlineresource)) {
    var size = [
      ol.format.XSD.readNonNegativeIntegerString(node.getAttribute('width')),
      ol.format.XSD.readNonNegativeIntegerString(node.getAttribute('height'))
    ];
    goog.object.set(formatOnlineresource, 'size', size);
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
ol.format.WMSCapabilities.readAuthorityURL_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'AuthorityURL');
  var authorityObject =
      ol.format.WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (goog.isDef(authorityObject)) {
    goog.object.set(authorityObject, 'name', node.getAttribute('name'));
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
ol.format.WMSCapabilities.readMetadataURL_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MetadataURL');
  var metadataObject =
      ol.format.WMSCapabilities.readFormatOnlineresource_(node, objectStack);
  if (goog.isDef(metadataObject)) {
    goog.object.set(metadataObject, 'type', node.getAttribute('type'));
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
ol.format.WMSCapabilities.readStyle_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Style');
  return ol.xml.pushParseAndPop(
      {}, ol.format.WMSCapabilities.STYLE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Keyword list.
 */
ol.format.WMSCapabilities.readKeywordList_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'KeywordList');
  return ol.xml.pushParseAndPop(
      [], ol.format.WMSCapabilities.KEYWORDLIST_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.WMSCapabilities.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/wms'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Service': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readService_),
      'Capability': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readCapability_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.CAPABILITY_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Request': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readRequest_),
      'Exception': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readException_),
      'Layer': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readCapabilityLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.SERVICE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'KeywordList': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readKeywordList_),
      'OnlineResource': ol.xml.makeObjectPropertySetter(
          ol.format.XLink.readHref),
      'ContactInformation': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readContactInformation_),
      'Fees': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'AccessConstraints': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'LayerLimit': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MaxWidth': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'MaxHeight': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.CONTACT_INFORMATION_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'ContactPersonPrimary': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readContactPersonPrimary_),
      'ContactPosition': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'ContactAddress': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readContactAddress_),
      'ContactVoiceTelephone': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'ContactFacsimileTelephone': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'ContactElectronicMailAddress': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.CONTACT_PERSON_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'ContactPerson': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'ContactOrganization': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.CONTACT_ADDRESS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'AddressType': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Address': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'City': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'StateOrProvince': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'PostCode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Country': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.EXCEPTION_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Format': ol.xml.makeArrayPusher(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.LAYER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'KeywordList': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readKeywordList_),
      'CRS': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
      'EX_GeographicBoundingBox': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readEXGeographicBoundingBox_),
      'BoundingBox': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readBoundingBox_),
      'Dimension': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readDimension_),
      'Attribution': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readAttribution_),
      'AuthorityURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readAuthorityURL_),
      'Identifier': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
      'MetadataURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readMetadataURL_),
      'DataURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readFormatOnlineresource_),
      'FeatureListURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readFormatOnlineresource_),
      'Style': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readStyle_),
      'MinScaleDenominator': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'MaxScaleDenominator': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'Layer': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readLayer_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.ATTRIBUTION_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'OnlineResource': ol.xml.makeObjectPropertySetter(
          ol.format.XLink.readHref),
      'LogoURL': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readSizedFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS_ =
    ol.xml.makeParsersNS(ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'westBoundLongitude': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'eastBoundLongitude': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'southBoundLatitude': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal),
      'northBoundLatitude': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.REQUEST_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'GetCapabilities': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readOperationType_),
      'GetMap': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readOperationType_),
      'GetFeatureInfo': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readOperationType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.OPERATIONTYPE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Format': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
      'DCPType': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readDCPType_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.DCPTYPE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'HTTP': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readHTTP_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.HTTP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Get': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readFormatOnlineresource_),
      'Post': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.STYLE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'LegendURL': ol.xml.makeObjectPropertyPusher(
          ol.format.WMSCapabilities.readSizedFormatOnlineresource_),
      'StyleSheetURL': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readFormatOnlineresource_),
      'StyleURL': ol.xml.makeObjectPropertySetter(
          ol.format.WMSCapabilities.readFormatOnlineresource_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.FORMAT_ONLINERESOURCE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Format': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'OnlineResource': ol.xml.makeObjectPropertySetter(
          ol.format.XLink.readHref)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities.KEYWORDLIST_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.WMSCapabilities.NAMESPACE_URIS_, {
      'Keyword': ol.xml.makeArrayPusher(ol.format.XSD.readString)
    });
