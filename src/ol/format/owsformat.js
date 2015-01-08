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
ol.format.OWS.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var owsObject = ol.xml.pushParseAndPop({},
      ol.format.OWS.PARSERS_, node, []);
  return goog.isDef(owsObject) ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readAddress_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Address');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'AllowedValues');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Constraint');
  var object = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(object));
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWS.CONSTRAINT_PARSERS_, node,
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
ol.format.OWS.readContactInfo_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ContactInfo');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'DCP');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Get');
  var object = objectStack[objectStack.length - 1];
  var url = ol.format.XLink.readHref(node);
  goog.asserts.assert(goog.isObject(object));
  var value = ol.xml.pushParseAndPop({'url': url},
      ol.format.OWS.REQUEST_METHOD_PARSERS_, node, objectStack);
  if (!goog.isDef(value)) {
    return undefined;
  }
  var get = object['get'];
  if (!goog.isDef(get)) {
    object['get'] = [value];
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
ol.format.OWS.readHttp_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'HTTP');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Operation');
  var name = node.getAttribute('name');
  var value = ol.xml.pushParseAndPop({},
      ol.format.OWS.OPERATION_PARSERS_, node, objectStack);
  if (!goog.isDef(value)) {
    return undefined;
  }
  var object = /** @type {Object} */
      (objectStack[objectStack.length - 1]);
  goog.asserts.assert(goog.isObject(object));
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'OperationsMetadata');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Phone');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceIdentification');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceContact');
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ServiceProvider');
  return ol.xml.pushParseAndPop(
      {}, ol.format.OWS.SERVICE_PROVIDER_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined}
 */
ol.format.OWS.readValue_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Value');
  var object = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(object));
  var key = ol.format.XSD.readString(node);
  if (!goog.isDef(key)) {
    return undefined;
  }
  object[key] = true;
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
ol.format.OWS.PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'ServiceIdentification': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceIdentification_,
          'serviceIdentification'),
      'ServiceProvider': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceProvider_,
          'serviceProvider'),
      'OperationsMetadata': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readOperationsMetadata_,
          'operationsMetadata')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.ADDRESS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
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
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.ALLOWED_VALUES_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Value': ol.format.OWS.readValue_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.CONSTRAINT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'AllowedValues': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readAllowedValues_, 'allowedValues'
      )
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.CONTACT_INFO_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Phone': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readPhone_, 'phone'),
      'Address': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readAddress_, 'address')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.DCP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'HTTP': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readHttp_, 'http')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.HTTP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Get': ol.format.OWS.readGet_,
      'Post': undefined // TODO
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.OPERATION_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'DCP': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readDcp_, 'dcp')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.OPERATIONS_METADATA_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Operation': ol.format.OWS.readOperation_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.PHONE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Voice': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'voice'),
      'Facsimile': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'facsimile')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.REQUEST_METHOD_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'Constraint': ol.format.OWS.readConstraint_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.SERVICE_CONTACT_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'IndividualName': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readString, 'individualName'),
      'PositionName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'positionName'),
      'ContactInfo': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readContactInfo_, 'contactInfo')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.OWS.SERVICE_IDENTIFICATION_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
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
ol.format.OWS.SERVICE_PROVIDER_PARSERS_ =
    ol.xml.makeParsersNS(
    ol.format.OWS.NAMESPACE_URIS_, {
      'ProviderName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString,
          'providerName'),
      'ProviderSite': ol.xml.makeObjectPropertySetter(ol.format.XLink.readHref,
          'providerSite'),
      'ServiceContact': ol.xml.makeObjectPropertySetter(
          ol.format.OWS.readServiceContact_, 'serviceContact')
    });
