/**
 * @module ol/format/OWS
 */
import {inherits} from '../index.js';
import XLink from '../format/XLink.js';
import XML from '../format/XML.js';
import XSD from '../format/XSD.js';
import _ol_xml_ from '../xml.js';

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
  const owsObject = _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({},
    OWS.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The values.
 */
OWS.readAllowedValues_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({'name': name},
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
  return _ol_xml_.pushParseAndPop({},
    OWS.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The DCP.
 */
OWS.readDcp_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({'href': href},
    OWS.REQUEST_METHOD_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The HTTP object.
 */
OWS.readHttp_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({}, OWS.HTTP_PARSERS_,
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
  const value = _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop({},
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
  return _ol_xml_.pushParseAndPop(
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
  return _ol_xml_.pushParseAndPop(
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
  return _ol_xml_.pushParseAndPop(
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
OWS.PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'ServiceIdentification': _ol_xml_.makeObjectPropertySetter(
      OWS.readServiceIdentification_),
    'ServiceProvider': _ol_xml_.makeObjectPropertySetter(
      OWS.readServiceProvider_),
    'OperationsMetadata': _ol_xml_.makeObjectPropertySetter(
      OWS.readOperationsMetadata_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.ADDRESS_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'DeliveryPoint': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'City': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'AdministrativeArea': _ol_xml_.makeObjectPropertySetter(
      XSD.readString),
    'PostalCode': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'Country': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'ElectronicMailAddress': _ol_xml_.makeObjectPropertySetter(
      XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.ALLOWED_VALUES_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Value': _ol_xml_.makeObjectPropertyPusher(OWS.readValue_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.CONSTRAINT_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'AllowedValues': _ol_xml_.makeObjectPropertySetter(
      OWS.readAllowedValues_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.CONTACT_INFO_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Phone': _ol_xml_.makeObjectPropertySetter(OWS.readPhone_),
    'Address': _ol_xml_.makeObjectPropertySetter(OWS.readAddress_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.DCP_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'HTTP': _ol_xml_.makeObjectPropertySetter(OWS.readHttp_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.HTTP_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Get': _ol_xml_.makeObjectPropertyPusher(OWS.readGet_),
    'Post': undefined // TODO
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.OPERATION_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'DCP': _ol_xml_.makeObjectPropertySetter(OWS.readDcp_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.OPERATIONS_METADATA_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Operation': OWS.readOperation_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.PHONE_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Voice': _ol_xml_.makeObjectPropertySetter(XSD.readString),
    'Facsimile': _ol_xml_.makeObjectPropertySetter(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.REQUEST_METHOD_PARSERS_ = _ol_xml_.makeStructureNS(
  OWS.NAMESPACE_URIS_, {
    'Constraint': _ol_xml_.makeObjectPropertyPusher(
      OWS.readConstraint_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_CONTACT_PARSERS_ =
    _ol_xml_.makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'IndividualName': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
        'PositionName': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'ContactInfo': _ol_xml_.makeObjectPropertySetter(
          OWS.readContactInfo_)
      });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_IDENTIFICATION_PARSERS_ =
    _ol_xml_.makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'Abstract': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'AccessConstraints': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'Fees': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'Title': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'ServiceTypeVersion': _ol_xml_.makeObjectPropertySetter(
          XSD.readString),
        'ServiceType': _ol_xml_.makeObjectPropertySetter(XSD.readString)
      });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OWS.SERVICE_PROVIDER_PARSERS_ =
    _ol_xml_.makeStructureNS(
      OWS.NAMESPACE_URIS_, {
        'ProviderName': _ol_xml_.makeObjectPropertySetter(XSD.readString),
        'ProviderSite': _ol_xml_.makeObjectPropertySetter(XLink.readHref),
        'ServiceContact': _ol_xml_.makeObjectPropertySetter(
          OWS.readServiceContact_)
      });
export default OWS;
