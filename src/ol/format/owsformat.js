goog.provide('ol.format.OWS');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.XML}
 */
ol.format.OWS = function() {
  goog.base(this);
};
goog.inherits(ol.format.OWS, ol.format.XML);


/**
 * @param {Document} doc Document.
 * @return {Object} OWS object.
 */
ol.format.OWS.prototype.readFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT,
      'doc.nodeType should be DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Object} OWS object.
 */
ol.format.OWS.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  var owsObject = ol.xml.pushParseAndPop({},
      ol.format.OWS.PARSERS_, node, []);
  return owsObject ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readAddress_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Address',
      'localName should be Address');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readAllowedValues_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'AllowedValues',
      'localName should be AllowedValues');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.ALLOWED_VALUES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readConstraint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Constraint',
      'localName should be Constraint');
  var name = node.getAttribute('name');
  if (!name) {
    return undefined;
  }
  return ol.xml.pushParseAndPop({'name': name},
      ol.format.OWS.CONSTRAINT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readContactInfo_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'ContactInfo',
      'localName should be ContactInfo');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readDcp_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'DCP', 'localName should be DCP');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.DCP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readGet_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Get', 'localName should be Get');
  var href = ol.format.XLink.readHref(node);
  if (!href) {
    return undefined;
  }
  return ol.xml.pushParseAndPop({'href': href},
      ol.format.OWS.REQUEST_METHOD_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readHttp_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'HTTP', 'localName should be HTTP');
  return ol.xml.pushParseAndPop({}, ol.format.OWS.HTTP_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readOperation_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Operation',
      'localName should be Operation');
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWS.OPERATION_PARSERS_, node, objectStack);
  if (!value) {
    return undefined;
  }
  var object = /** @type {Object} */
      (objectStack[objectStack.length - 1]);
  goog.asserts.assert(goog.isObject(object), 'object should be an Object');
  object[name] = value;

};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readOperationsMetadata_ = function(node,
    objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'OperationsMetadata',
      'localName should be OperationsMetadata');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.OPERATIONS_METADATA_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readPhone_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Phone', 'localName should be Phone');
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.PHONE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readServiceIdentification_ = function(node,
    objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'ServiceIdentification',
      'localName should be ServiceIdentification');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_IDENTIFICATION_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readServiceContact_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'ServiceContact',
      'localName should be ServiceContact');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_CONTACT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readServiceProvider_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'ServiceProvider',
      'localName should be ServiceProvider');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_PROVIDER_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {string|undefined}
 */
ol.format.OWS.readValue_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Value', 'localName should be Value');
  return ol.format.XSD.readString(node);
};


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.OWS.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'ServiceIdentification': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceIdentification_),
      'ServiceProvider': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceProvider_),
      'OperationsMetadata': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readOperationsMetadata_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.ADDRESS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'DeliveryPoint': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'City': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'AdministrativeArea': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'PostalCode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Country': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'ElectronicMailAddress': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.ALLOWED_VALUES_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Value': ol.xml.makeObjectPropertyPusher(ol.format.OWS.readValue_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.CONSTRAINT_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'AllowedValues': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readAllowedValues_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.CONTACT_INFO_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Phone': ol.xml.makeObjectPropertySetter(ol.format.OWS.readPhone_),
      'Address': ol.xml.makeObjectPropertySetter(ol.format.OWS.readAddress_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.DCP_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'HTTP': ol.xml.makeObjectPropertySetter(ol.format.OWS.readHttp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.HTTP_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Get': ol.xml.makeObjectPropertyPusher(ol.format.OWS.readGet_),
      'Post': undefined // TODO
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.OPERATION_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'DCP': ol.xml.makeObjectPropertySetter(ol.format.OWS.readDcp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.OPERATIONS_METADATA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Operation': ol.format.OWS.readOperation_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.PHONE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Voice': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Facsimile': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.REQUEST_METHOD_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Constraint': ol.xml.makeObjectPropertyPusher(
          ol.format.OWS.readConstraint_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.SERVICE_CONTACT_PARSERS_ =
    ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'IndividualName': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'PositionName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'ContactInfo': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readContactInfo_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.SERVICE_IDENTIFICATION_PARSERS_ =
    ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'ServiceTypeVersion': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString),
      'ServiceType': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.SERVICE_PROVIDER_PARSERS_ =
    ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'ProviderName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'ProviderSite': ol.xml.makeObjectPropertySetter(ol.format.XLink.readHref),
      'ServiceContact': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceContact_)
    });
