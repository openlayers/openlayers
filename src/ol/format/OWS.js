/**
 * @module ol/format/OWS
 */
import {inherits} from '../index.js';
import XLink from '../format/XLink.js';
import XML from '../format/XML.js';
import XSD from '../format/XSD.js';
import {makeObjectPropertyPusher, makeObjectPropertySetter, makeStructureNS, pushParseAndPop} from '../xml.js';

/**
 * @constructor
 * @extends {ol.format.XML}
 */
const OWS = function() {
  XML.call(this);
};

inherits(OWS, XML);


/**
 * @inheritDoc
 */
OWS.prototype.readFromDocument = function(doc) {
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
OWS.prototype.readFromNode = function(node) {
  const owsObject = pushParseAndPop({},
    OWS.PARSERS_, node, []);
  return owsObject ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The address.
 */
OWS.readAddress_ = function(node, objectStack) {
  return pushParseAndPop({},
    OWS.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The values.
 */
OWS.readAllowedValues_ = function(node, objectStack) {
  return pushParseAndPop({},
    OWS.ALLOWED_VALUES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The constraint.
 */
OWS.readConstraint_ = function(node, objectStack) {
  const name = node.getAttribute('name');
  if (!name) {
    return undefined;
  }
  return pushParseAndPop({'name': name},
    OWS.CONSTRAINT_PARSERS_, node,
    objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The contact info.
 */
OWS.readContactInfo_ = function(node, objectStack) {
  return pushParseAndPop({},
    OWS.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The DCP.
 */
OWS.readDcp_ = function(node, objectStack) {
  return pushParseAndPop({},
    OWS.DCP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The GET object.
 */
OWS.readGet_ = function(node, objectStack) {
  const href = XLink.readHref(node);
  if (!href) {
    return undefined;
  }
  return pushParseAndPop({'href': href},
    OWS.REQUEST_METHOD_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The HTTP object.
 */
OWS.readHttp_ = function(node, objectStack) {
  return pushParseAndPop({}, OWS.HTTP_PARSERS_,
    node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The operation.
 */
OWS.readOperation_ = function(node, objectStack) {
  const name = node.getAttribute('name');
  const value = pushParseAndPop({},
    OWS.OPERATION_PARSERS_, node, objectStack);
  if (!value) {
    return undefined;
  }
  const object = /** @type {Object} */
      (objectStack[objectStack.length - 1]);
  object[name] = value;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The operations metadata.
 */
OWS.readOperationsMetadata_ = function(node,
  objectStack) {
  return pushParseAndPop({},
    OWS.OPERATIONS_METADATA_PARSERS_, node,
    objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The phone.
 */
OWS.readPhone_ = function(node, objectStack) {
  return pushParseAndPop({},
    OWS.PHONE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service identification.
 */
OWS.readServiceIdentification_ = function(node,
  objectStack) {
  return pushParseAndPop(
    {}, OWS.SERVICE_IDENTIFICATION_PARSERS_, node,
    objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service contact.
 */
OWS.readServiceContact_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, OWS.SERVICE_CONTACT_PARSERS_, node,
    objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service provider.
 */
OWS.readServiceProvider_ = function(node, objectStack) {
  return pushParseAndPop(
    {}, OWS.SERVICE_PROVIDER_PARSERS_, node,
    objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {string|undefined} The value.
 */
OWS.readValue_ = function(node, objectStack) {
  return XSD.readString(node);
};


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
OWS.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'ServiceIdentification': makeObjectPropertySetter(
      OWS.readServiceIdentification_),
    'ServiceProvider': makeObjectPropertySetter(
      OWS.readServiceProvider_),
    'OperationsMetadata': makeObjectPropertySetter(
      OWS.readOperationsMetadata_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.ADDRESS_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'DeliveryPoint': makeObjectPropertySetter(
      XSD.readString),
    'City': makeObjectPropertySetter(XSD.readString),
    'AdministrativeArea': makeObjectPropertySetter(
      XSD.readString),
    'PostalCode': makeObjectPropertySetter(XSD.readString),
    'Country': makeObjectPropertySetter(XSD.readString),
    'ElectronicMailAddress': makeObjectPropertySetter(
      XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.ALLOWED_VALUES_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Value': makeObjectPropertyPusher(OWS.readValue_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.CONSTRAINT_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'AllowedValues': makeObjectPropertySetter(
      OWS.readAllowedValues_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.CONTACT_INFO_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Phone': makeObjectPropertySetter(OWS.readPhone_),
    'Address': makeObjectPropertySetter(OWS.readAddress_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.DCP_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'HTTP': makeObjectPropertySetter(OWS.readHttp_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.HTTP_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Get': makeObjectPropertyPusher(OWS.readGet_),
    'Post': undefined // TODO
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.OPERATION_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'DCP': makeObjectPropertySetter(OWS.readDcp_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.OPERATIONS_METADATA_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Operation': OWS.readOperation_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.PHONE_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Voice': makeObjectPropertySetter(XSD.readString),
    'Facsimile': makeObjectPropertySetter(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.REQUEST_METHOD_PARSERS_ = makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Constraint': makeObjectPropertyPusher(
      OWS.readConstraint_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_CONTACT_PARSERS_ =
    makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'IndividualName': makeObjectPropertySetter(
          XSD.readString),
        'PositionName': makeObjectPropertySetter(XSD.readString),
        'ContactInfo': makeObjectPropertySetter(
          OWS.readContactInfo_)
      });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_IDENTIFICATION_PARSERS_ =
    makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'Abstract': makeObjectPropertySetter(XSD.readString),
        'AccessConstraints': makeObjectPropertySetter(XSD.readString),
        'Fees': makeObjectPropertySetter(XSD.readString),
        'Title': makeObjectPropertySetter(XSD.readString),
        'ServiceTypeVersion': makeObjectPropertySetter(
          XSD.readString),
        'ServiceType': makeObjectPropertySetter(XSD.readString)
      });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_PROVIDER_PARSERS_ =
    makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'ProviderName': makeObjectPropertySetter(XSD.readString),
        'ProviderSite': makeObjectPropertySetter(XLink.readHref),
        'ServiceContact': makeObjectPropertySetter(
          OWS.readServiceContact_)
      });
export default OWS;
