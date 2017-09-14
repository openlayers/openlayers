goog.provide('ol.format.OWS');

goog.require('ol');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');


/**
 * @constructor
 * @extends {ol.format.XML}
 */
ol.format.OWS = function() {
  ol.format.XML.call(this);
};
ol.inherits(ol.format.OWS, ol.format.XML);


/**
 * @inheritDoc
 */
ol.format.OWS.prototype.readFromDocument = function(doc) {
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
ol.format.OWS.prototype.readFromNode = function(node) {
  var owsObject = ol.xml.pushParseAndPop({},
      ol.format.OWS.PARSERS_, node, []);
  return owsObject ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The address.
 */
ol.format.OWS.readAddress_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The values.
 */
ol.format.OWS.readAllowedValues_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.ALLOWED_VALUES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The constraint.
 */
ol.format.OWS.readConstraint_ = function(node, objectStack) {
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
 * @return {Object|undefined} The contact info.
 */
ol.format.OWS.readContactInfo_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The DCP.
 */
ol.format.OWS.readDcp_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.DCP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The GET object.
 */
ol.format.OWS.readGet_ = function(node, objectStack) {
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
 * @return {Object|undefined} The HTTP object.
 */
ol.format.OWS.readHttp_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({}, ol.format.OWS.HTTP_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The operation.
 */
ol.format.OWS.readOperation_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWS.OPERATION_PARSERS_, node, objectStack);
  if (!value) {
    return undefined;
  }
  var object = /** @type {Object} */
      (objectStack[objectStack.length - 1]);
  object[name] = value;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The operations metadata.
 */
ol.format.OWS.readOperationsMetadata_ = function(node,
    objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.OPERATIONS_METADATA_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The phone.
 */
ol.format.OWS.readPhone_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop({},
      ol.format.OWS.PHONE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service identification.
 */
ol.format.OWS.readServiceIdentification_ = function(node,
    objectStack) {
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_IDENTIFICATION_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service contact.
 */
ol.format.OWS.readServiceContact_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_CONTACT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service provider.
 */
ol.format.OWS.readServiceProvider_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_PROVIDER_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {string|undefined} The value.
 */
ol.format.OWS.readValue_ = function(node, objectStack) {
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.ALLOWED_VALUES_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Value': ol.xml.makeObjectPropertyPusher(ol.format.OWS.readValue_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.CONSTRAINT_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'AllowedValues': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readAllowedValues_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.CONTACT_INFO_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Phone': ol.xml.makeObjectPropertySetter(ol.format.OWS.readPhone_),
      'Address': ol.xml.makeObjectPropertySetter(ol.format.OWS.readAddress_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.DCP_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'HTTP': ol.xml.makeObjectPropertySetter(ol.format.OWS.readHttp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.HTTP_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Get': ol.xml.makeObjectPropertyPusher(ol.format.OWS.readGet_),
      'Post': undefined // TODO
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.OPERATION_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'DCP': ol.xml.makeObjectPropertySetter(ol.format.OWS.readDcp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.OPERATIONS_METADATA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Operation': ol.format.OWS.readOperation_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.PHONE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Voice': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'Facsimile': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OWS.REQUEST_METHOD_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Constraint': ol.xml.makeObjectPropertyPusher(
          ol.format.OWS.readConstraint_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
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
