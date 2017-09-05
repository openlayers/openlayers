import _ol_ from '../index';
import _ol_format_XLink_ from '../format/xlink';
import _ol_format_XML_ from '../format/xml';
import _ol_format_XSD_ from '../format/xsd';
import _ol_xml_ from '../xml';

/**
 * @constructor
 * @extends {ol.format.XML}
 */
var _ol_format_OWS_ = function() {
  _ol_format_XML_.call(this);
};

_ol_.inherits(_ol_format_OWS_, _ol_format_XML_);


/**
 * @inheritDoc
 */
_ol_format_OWS_.prototype.readFromDocument = function(doc) {
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
_ol_format_OWS_.prototype.readFromNode = function(node) {
  var owsObject = _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.PARSERS_, node, []);
  return owsObject ? owsObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The address.
 */
_ol_format_OWS_.readAddress_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.ADDRESS_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The values.
 */
_ol_format_OWS_.readAllowedValues_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.ALLOWED_VALUES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The constraint.
 */
_ol_format_OWS_.readConstraint_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  if (!name) {
    return undefined;
  }
  return _ol_xml_.pushParseAndPop({'name': name},
      _ol_format_OWS_.CONSTRAINT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The contact info.
 */
_ol_format_OWS_.readContactInfo_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.CONTACT_INFO_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The DCP.
 */
_ol_format_OWS_.readDcp_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.DCP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The GET object.
 */
_ol_format_OWS_.readGet_ = function(node, objectStack) {
  var href = _ol_format_XLink_.readHref(node);
  if (!href) {
    return undefined;
  }
  return _ol_xml_.pushParseAndPop({'href': href},
      _ol_format_OWS_.REQUEST_METHOD_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The HTTP object.
 */
_ol_format_OWS_.readHttp_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({}, _ol_format_OWS_.HTTP_PARSERS_,
      node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The operation.
 */
_ol_format_OWS_.readOperation_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  var value = _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.OPERATION_PARSERS_, node, objectStack);
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
_ol_format_OWS_.readOperationsMetadata_ = function(node,
    objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.OPERATIONS_METADATA_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The phone.
 */
_ol_format_OWS_.readPhone_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop({},
      _ol_format_OWS_.PHONE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service identification.
 */
_ol_format_OWS_.readServiceIdentification_ = function(node,
    objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_OWS_.SERVICE_IDENTIFICATION_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service contact.
 */
_ol_format_OWS_.readServiceContact_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_OWS_.SERVICE_CONTACT_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} The service provider.
 */
_ol_format_OWS_.readServiceProvider_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(
      {}, _ol_format_OWS_.SERVICE_PROVIDER_PARSERS_, node,
      objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {string|undefined} The value.
 */
_ol_format_OWS_.readValue_ = function(node, objectStack) {
  return _ol_format_XSD_.readString(node);
};


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
_ol_format_OWS_.NAMESPACE_URIS_ = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'ServiceIdentification': _ol_xml_.makeObjectPropertySetter(
          _ol_format_OWS_.readServiceIdentification_),
      'ServiceProvider': _ol_xml_.makeObjectPropertySetter(
          _ol_format_OWS_.readServiceProvider_),
      'OperationsMetadata': _ol_xml_.makeObjectPropertySetter(
          _ol_format_OWS_.readOperationsMetadata_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.ADDRESS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'DeliveryPoint': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'City': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'AdministrativeArea': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString),
      'PostalCode': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Country': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'ElectronicMailAddress': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.ALLOWED_VALUES_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Value': _ol_xml_.makeObjectPropertyPusher(_ol_format_OWS_.readValue_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.CONSTRAINT_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'AllowedValues': _ol_xml_.makeObjectPropertySetter(
          _ol_format_OWS_.readAllowedValues_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.CONTACT_INFO_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Phone': _ol_xml_.makeObjectPropertySetter(_ol_format_OWS_.readPhone_),
      'Address': _ol_xml_.makeObjectPropertySetter(_ol_format_OWS_.readAddress_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.DCP_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'HTTP': _ol_xml_.makeObjectPropertySetter(_ol_format_OWS_.readHttp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.HTTP_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Get': _ol_xml_.makeObjectPropertyPusher(_ol_format_OWS_.readGet_),
      'Post': undefined // TODO
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.OPERATION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'DCP': _ol_xml_.makeObjectPropertySetter(_ol_format_OWS_.readDcp_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.OPERATIONS_METADATA_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Operation': _ol_format_OWS_.readOperation_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.PHONE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Voice': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'Facsimile': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.REQUEST_METHOD_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OWS_.NAMESPACE_URIS_, {
      'Constraint': _ol_xml_.makeObjectPropertyPusher(
          _ol_format_OWS_.readConstraint_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.SERVICE_CONTACT_PARSERS_ =
    _ol_xml_.makeStructureNS(
        _ol_format_OWS_.NAMESPACE_URIS_, {
          'IndividualName': _ol_xml_.makeObjectPropertySetter(
              _ol_format_XSD_.readString),
          'PositionName': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
          'ContactInfo': _ol_xml_.makeObjectPropertySetter(
              _ol_format_OWS_.readContactInfo_)
        });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.SERVICE_IDENTIFICATION_PARSERS_ =
    _ol_xml_.makeStructureNS(
        _ol_format_OWS_.NAMESPACE_URIS_, {
          'Title': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
          'ServiceTypeVersion': _ol_xml_.makeObjectPropertySetter(
              _ol_format_XSD_.readString),
          'ServiceType': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString)
        });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OWS_.SERVICE_PROVIDER_PARSERS_ =
    _ol_xml_.makeStructureNS(
        _ol_format_OWS_.NAMESPACE_URIS_, {
          'ProviderName': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
          'ProviderSite': _ol_xml_.makeObjectPropertySetter(_ol_format_XLink_.readHref),
          'ServiceContact': _ol_xml_.makeObjectPropertySetter(
              _ol_format_OWS_.readServiceContact_)
        });
export default _ol_format_OWS_;
