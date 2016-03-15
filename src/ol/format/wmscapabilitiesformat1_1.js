goog.provide('ol.format.WMSCapabilities1_1');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol');
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
ol.format.WMSCapabilities1_1 = function() {

	goog.base(this);

	/**
	 * @type {string|undefined}
	 */
	this.version = undefined;
};
goog.inherits(ol.format.WMSCapabilities1_1, ol.format.XML);


/**
 * Read a WMS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMS capabilities.
 * @api
 */
ol.format.WMSCapabilities1_1.prototype.read;


/**
 * @param {Document} doc Document.
 * @return {Object} WMS Capability object.
 */
ol.format.WMSCapabilities1_1.prototype.readFromDocument = function(doc) {
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
 * @return {Object} WMS Capability object.
 */
ol.format.WMSCapabilities1_1.prototype.readFromNode = function(node) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'WMS_Capabilities' ||
	node.localName == 'WMT_MS_Capabilities',
		'localName should be WMS_Capabilities or WMT_MS_Capabilities');
	this.version = node.getAttribute('version').trim();
	goog.asserts.assertString(this.version, 'this.version should be a string');
	goog.asserts.assert(this.version == '1.1.1' || this.version == '1.1.0' || this.version == '1.0.0',
		'version should be 1.x.x');
	var wmsCapabilityObject = ol.xml.pushParseAndPop({
		'version': this.version
	}, ol.format.WMSCapabilities1_1.PARSERS_, node, []);
	return wmsCapabilityObject ? wmsCapabilityObject : null;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
ol.format.WMSCapabilities1_1.readAttribution_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Attribution',
		'localName should be Attribution');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.ATTRIBUTION_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object} Bounding box object.
 */
ol.format.WMSCapabilities1_1.readBoundingBox_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'BoundingBox',
		'localName should be BoundingBox');

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
		'srs': node.getAttribute('SRS'),
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
ol.format.WMSCapabilities1_1.readLatLonBoundingBox_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'LatLonBoundingBox',
		'localName should be LatLonBoundingBox');
	var extent = [
		ol.format.XSD.readDecimalString(node.getAttribute('minx')),
		ol.format.XSD.readDecimalString(node.getAttribute('miny')),
		ol.format.XSD.readDecimalString(node.getAttribute('maxx')),
		ol.format.XSD.readDecimalString(node.getAttribute('maxy'))
	];
	return {
		extent: extent,
	};
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Capability object.
 */
ol.format.WMSCapabilities1_1.readCapability_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Capability',
		'localName should be Capability');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.CAPABILITY_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Service object.
 */
ol.format.WMSCapabilities1_1.readService_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Service',
		'localName should be Service');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.SERVICE_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact information object.
 */
ol.format.WMSCapabilities1_1.readContactInformation_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType shpuld be ELEMENT');
	goog.asserts.assert(node.localName == 'ContactInformation',
		'localName should be ContactInformation');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.CONTACT_INFORMATION_PARSERS_,
		node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact person object.
 */
ol.format.WMSCapabilities1_1.readContactPersonPrimary_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'ContactPersonPrimary',
		'localName should be ContactPersonPrimary');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.CONTACT_PERSON_PARSERS_,
		node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Contact address object.
 */
ol.format.WMSCapabilities1_1.readContactAddress_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'ContactAddress',
		'localName should be ContactAddress');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.CONTACT_ADDRESS_PARSERS_,
		node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<string>|undefined} Format array.
 */
ol.format.WMSCapabilities1_1.readException_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Exception',
		'localName should be Exception');
	return ol.xml.pushParseAndPop(
		[], ol.format.WMSCapabilities1_1.EXCEPTION_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
ol.format.WMSCapabilities1_1.readCapabilityLayer_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Layer', 'localName should be Layer');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.LAYER_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object|undefined} Layer object.
 */
ol.format.WMSCapabilities1_1.readScaleHint_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'ScaleHint', 'localName should be ScaleHint');
	return{
		min: ol.format.XSD.readDecimalString(node.getAttribute('min')),
		max: ol.format.XSD.readDecimalString(node.getAttribute('max')),
	};
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layer object.
 */
ol.format.WMSCapabilities1_1.readLayer_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Layer', 'localName should be Layer');
	var parentLayerObject = /**  @type {Object.<string,*>} */
	(objectStack[objectStack.length - 1]);

	var layerObject = ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.LAYER_PARSERS_, node, objectStack);

	if (!layerObject) {
		return undefined;
	}
	var queryable = ol.format.XSD.readBooleanString(node.getAttribute('queryable'));
	if (queryable === undefined) {
		queryable = parentLayerObject['queryable'];
	}
	layerObject['queryable'] = queryable !== undefined ? queryable : false;

	var cascaded = ol.format.XSD.readNonNegativeIntegerString(
		node.getAttribute('cascaded'));
	if (cascaded === undefined) {
		cascaded = parentLayerObject['cascaded'];
	}
	layerObject['cascaded'] = cascaded;

	var opaque = ol.format.XSD.readBooleanString(node.getAttribute('opaque'));
	if (opaque === undefined) {
		opaque = parentLayerObject['opaque'];
	}
	layerObject['opaque'] = opaque !== undefined ? opaque : false;

	var noSubsets = ol.format.XSD.readBooleanString(node.getAttribute('noSubsets'));
	if (noSubsets === undefined) {
		noSubsets = parentLayerObject['noSubsets'];
	}
	layerObject['noSubsets'] = noSubsets !== undefined ? noSubsets : false;

	var fixedWidth = ol.format.XSD.readDecimalString(node.getAttribute('fixedWidth'));
	if (!fixedWidth) {
		fixedWidth = parentLayerObject['fixedWidth'];
	}
	layerObject['fixedWidth'] = fixedWidth;

	var fixedHeight = ol.format.XSD.readDecimalString(node.getAttribute('fixedHeight'));
	if (!fixedHeight) {
		fixedHeight = parentLayerObject['fixedHeight'];
	}
	layerObject['fixedHeight'] = fixedHeight;

	// See 7.2.4.8
	var addKeys = ['Style', 'SRS', 'AuthorityURL'];
	addKeys.forEach(function(key) {
		if (key in parentLayerObject) {
			var childValue = layerObject[key] || [];
			layerObject[key] = childValue.concat(parentLayerObject[key]);
		}
	});

	var replaceKeys = ['LatLonBoundingBox', 'BoundingBox', 'Dimension',
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
ol.format.WMSCapabilities1_1.readDimension_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Dimension',
		'localName should be Dimension');
	var dimensionObject = {
		'name': node.getAttribute('name'),
		'units': node.getAttribute('units'),
		'unitSymbol': node.getAttribute('unitSymbol'),
	};
	return dimensionObject;
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
ol.format.WMSCapabilities1_1.readFormatOnlineresource_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.FORMAT_ONLINERESOURCE_PARSERS_,
		node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Request object.
 */
ol.format.WMSCapabilities1_1.readRequest_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Request',
		'localName should be Request');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.REQUEST_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} DCP type object.
 */
ol.format.WMSCapabilities1_1.readDCPType_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'DCPType',
		'localName should be DCPType');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.DCPTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} HTTP object.
 */
ol.format.WMSCapabilities1_1.readHTTP_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'HTTP', 'localName should be HTTP');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.HTTP_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Operation type object.
 */
ol.format.WMSCapabilities1_1.readOperationType_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.OPERATIONTYPE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Online resource object.
 */
ol.format.WMSCapabilities1_1.readSizedFormatOnlineresource_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	var formatOnlineresource = ol.format.WMSCapabilities1_1.readFormatOnlineresource_(node, objectStack);
	if (formatOnlineresource) {
		var size = [
			ol.format.XSD.readNonNegativeIntegerString(node.getAttribute('width')),
			ol.format.XSD.readNonNegativeIntegerString(node.getAttribute('height'))
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
ol.format.WMSCapabilities1_1.readAuthorityURL_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'AuthorityURL',
		'localName should be AuthorityURL');
	var authorityObject = ol.format.WMSCapabilities1_1.readFormatOnlineresource_(node, objectStack);
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
ol.format.WMSCapabilities1_1.readMetadataURL_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'MetadataURL',
		'localName should be MetadataURL');
	var metadataObject = ol.format.WMSCapabilities1_1.readFormatOnlineresource_(node, objectStack);
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
ol.format.WMSCapabilities1_1.readStyle_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'Style', 'localName should be Style');
	return ol.xml.pushParseAndPop(
		{}, ol.format.WMSCapabilities1_1.STYLE_PARSERS_, node, objectStack);
};


/**
 * @private
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<string>|undefined} Keyword list.
 */
ol.format.WMSCapabilities1_1.readKeywordList_ = function(node, objectStack) {
	goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
		'node.nodeType should be ELEMENT');
	goog.asserts.assert(node.localName == 'KeywordList',
		'localName should be KeywordList');
	return ol.xml.pushParseAndPop(
		[], ol.format.WMSCapabilities1_1.KEYWORDLIST_PARSERS_, node, objectStack);
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.WMSCapabilities1_1.NAMESPACE_URIS_ = [
	null,
	'http://www.opengis.net/wms'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Service': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readService_),
		'Capability': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readCapability_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.CAPABILITY_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Request': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readRequest_),
		'Exception': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readException_),
		'Layer': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readCapabilityLayer_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.SERVICE_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'KeywordList': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readKeywordList_),
		'OnlineResource': ol.xml.makeObjectPropertySetter(
			ol.format.XLink.readHref),
		'ContactInformation': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readContactInformation_),
		'Fees': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'AccessConstraints': ol.xml.makeObjectPropertySetter(
			ol.format.XSD.readString)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.CONTACT_INFORMATION_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'ContactPersonPrimary': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readContactPersonPrimary_),
		'ContactPosition': ol.xml.makeObjectPropertySetter(
			ol.format.XSD.readString),
		'ContactAddress': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readContactAddress_),
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
ol.format.WMSCapabilities1_1.CONTACT_PERSON_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
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
ol.format.WMSCapabilities1_1.CONTACT_ADDRESS_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
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
ol.format.WMSCapabilities1_1.EXCEPTION_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Format': ol.xml.makeArrayPusher(ol.format.XSD.readString)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.LAYER_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'KeywordList': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readKeywordList_),
		'SRS': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
		'LatLonBoundingBox': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readLatLonBoundingBox_),
		'BoundingBox': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readBoundingBox_),
		'Dimension': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readDimension_),
		'Attribution': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readAttribution_),
		'AuthorityURL': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readAuthorityURL_),
		'Identifier': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
		'MetadataURL': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readMetadataURL_),
		'DataURL': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_),
		'FeatureListURL': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_),
		'Style': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readStyle_),
		'Layer': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readLayer_)
		'ScaleHint': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readScaleHint_)
		
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.ATTRIBUTION_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'OnlineResource': ol.xml.makeObjectPropertySetter(
			ol.format.XLink.readHref),
		'LogoURL': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readSizedFormatOnlineresource_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.REQUEST_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'GetCapabilities': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'GetMap': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'GetFeatureInfo': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'DescribeLayer': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'GetLegendGraphic': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'GetStyles': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_),
		'PutStyles': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readOperationType_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.OPERATIONTYPE_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Format': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
		'DCPType': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readDCPType_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.DCPTYPE_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'HTTP': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readHTTP_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.HTTP_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Get': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_),
		'Post': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.STYLE_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
		'LegendURL': ol.xml.makeObjectPropertyPusher(
			ol.format.WMSCapabilities1_1.readSizedFormatOnlineresource_),
		'StyleSheetURL': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_),
		'StyleURL': ol.xml.makeObjectPropertySetter(
			ol.format.WMSCapabilities1_1.readFormatOnlineresource_)
	});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.FORMAT_ONLINERESOURCE_PARSERS_ = ol.xml.makeStructureNS(ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
	'Format': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
	'OnlineResource': ol.xml.makeObjectPropertySetter(
		ol.format.XLink.readHref)
});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.WMSCapabilities1_1.KEYWORDLIST_PARSERS_ = ol.xml.makeStructureNS(
	ol.format.WMSCapabilities1_1.NAMESPACE_URIS_, {
		'Keyword': ol.xml.makeArrayPusher(ol.format.XSD.readString)
	});
