goog.provide('ol.format.OWSCapabilities');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol.format.XLink');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.XML}
 */
ol.format.OWSCapabilities = function() {
  goog.base(this);
};
goog.inherits(ol.format.OWSCapabilities, ol.format.XML);


/**
 * @param {Document} doc Document.
 * @return {Object} OWS object.
 */
ol.format.OWSCapabilities.prototype.readFromDocument = function(doc) {
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
 * @return {Object} OWS object.
 */
ol.format.OWSCapabilities.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var owsObject = ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.PARSERS_, node, []);
  return goog.isDef(owsObject) ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readAddress_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Address');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readAllowedValues_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'AllowedValues');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.ALLOWED_VALUES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readConstraint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Constraint');
  var object = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(object));
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.CONSTRAINT_PARSERS_, node,
      objectStack);
  if (!goog.isDef(value)) {
    return undefined;
  }
  if (!goog.isDef(object.constraints)) {
    object.constraints = {};
  }
  object.constraints[name] = value;

};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readContactInfo_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ContactInfo');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readDcp_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'DCP');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.DCP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readGet_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Get');
  var object = objectStack[objectStack.length - 1];
  var url = ol.format.XLink.readHref(node);
  goog.asserts.assert(goog.isObject(object));
  var value = ol.xml.pushParseAndPop({'url': url},
      ol.format.OWSCapabilities.REQUEST_METHOD_PARSERS_, node, objectStack);
  if (!goog.isDef(value)) {
    return undefined;
  }
  var get = goog.object.get(object, 'get');
  if (!goog.isDef(get)) {
    goog.object.set(object, 'get', [value]);
  }else {
    goog.asserts.assert(goog.isArray(get));
    get.push(value);
  }

};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readHttp_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'HTTP');
  return ol.xml.pushParseAndPop({}, ol.format.OWSCapabilities.HTTP_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readOperation_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Operation');
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.OPERATION_PARSERS_, node, objectStack);
  if (!goog.isDef(value)) {
    return undefined;
  }
  var object = /** @type {Object} */
      (objectStack[objectStack.length - 1]);
  goog.asserts.assert(goog.isObject(object));
  goog.object.set(object, name, value);

};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readOperationsMetadata_ = function(node,
    objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'OperationsMetadata');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.OPERATIONS_METADATA_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readPhone_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Phone');
  return ol.xml.pushParseAndPop({},
      ol.format.OWSCapabilities.PHONE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readServiceIdentification_ = function(node,
    objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceIdentification');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWSCapabilities.SERVICE_IDENTIFICATION_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readServiceContact_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceContact');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWSCapabilities.SERVICE_CONTACT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readServiceProvider_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceProvider');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWSCapabilities.SERVICE_PROVIDER_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWSCapabilities.readValue_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Value');
  var object = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(object));
  var key = ol.format.XSD.readString(node);
  if (!goog.isDef(key)) {
    return undefined;
  }
  goog.object.set(object, key, true);
};


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.OWSCapabilities.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'ServiceIdentification': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readServiceIdentification_,
          'serviceIdentification'),
      'ServiceProvider': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readServiceProvider_,
          'serviceProvider'),
      'OperationsMetadata': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readOperationsMetadata_,
          'operationsMetadata')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.ADDRESS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'DeliveryPoint': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'deliveryPoint'),
      'City': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'city'),
      'AdministrativeArea': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'administrativeArea'),
      'PostalCode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'postalCode'),
      'Country': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'country'),
      'ElectronicMailAddress': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'electronicMailAddress')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.ALLOWED_VALUES_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Value': ol.format.OWSCapabilities.readValue_
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.CONSTRAINT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'AllowedValues': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readAllowedValues_, 'allowedValues'
      )
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.CONTACT_INFO_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Phone': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readPhone_, 'phone'),
      'Address': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readAddress_, 'address')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.DCP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'HTTP': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readHttp_, 'http')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.HTTP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Get': ol.format.OWSCapabilities.readGet_,
      'Post': undefined // TODO
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.OPERATION_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'DCP': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readDcp_, 'dcp')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.OPERATIONS_METADATA_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Operation': ol.format.OWSCapabilities.readOperation_
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.PHONE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Voice': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'voice'),
      'Facsimile': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'facsimile')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.REQUEST_METHOD_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Constraint': ol.format.OWSCapabilities.readConstraint_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.SERVICE_CONTACT_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'IndividualName': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'individualName'),
      'PositionName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'positionName'),
      'ContactInfo': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readContactInfo_, 'contactInfo')
    }
    );


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.SERVICE_IDENTIFICATION_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'title'),
      'ServiceTypeVersion': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'serviceTypeVersion'),
      'ServiceType': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'serviceType')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWSCapabilities.SERVICE_PROVIDER_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWSCapabilities.NAMESPACE_URIS_, {
      'ProviderName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'providerName'),
      'ProviderSite': ol.xml.makeObjectPropertySetter(ol.format.XLink.readHref,
          'providerSite'),
      'ServiceContact': ol.xml.makeObjectPropertySetter(
          ol.format.OWSCapabilities.readServiceContact_, 'serviceContact')
    }
    );
