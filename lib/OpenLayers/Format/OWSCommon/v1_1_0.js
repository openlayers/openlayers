/* Copyright (c) 2006-2009 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

OpenLayers.Format.OWSCommon = {};

/**
 * Class: OpenLayers.Format.OWSCommon.v1_1_0
 * Parser for OWS Common version 1.1.0 which can be used by other parsers.
 * It is not intended to be used on its own.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OWSCommon.v1_1_0 = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        xlink: "http://www.w3.org/1999/xlink"
    },

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "ows": {
            "ServiceIdentification": function(node, obj) {
                obj.serviceIdentification = {};
                this.readChildNodes(node, obj.serviceIdentification);
            },
            "Title": function(node, serviceIdentification) {
                serviceIdentification.title = this.getChildValue(node);
            },
            "Abstract": function(node, serviceIdentification) {
                serviceIdentification.abstract = this.getChildValue(node);
            },
            "Keywords": function(node, serviceIdentification) {
                serviceIdentification.keywords = {};
                this.readChildNodes(node, serviceIdentification.keywords);
            },
            "Keyword": function(node, keywords) {
                keywords[this.getChildValue(node)] = true;
            },
            "ServiceType": function(node, serviceIdentification) {
                serviceIdentification.serviceType = {
                    codeSpace: node.getAttribute('codeSpace'), 
                    value: this.getChildValue(node)};
            },
            "ServiceTypeVersion": function(node, serviceIdentification) {
                serviceIdentification.serviceTypeVersion = this.getChildValue(node);
            },
            "Fees": function(node, serviceIdentification) {
                serviceIdentification.fees = this.getChildValue(node);
            },
            "AccessConstraints": function(node, serviceIdentification) {
                serviceIdentification.accessConstraints = 
                    this.getChildValue(node);
            },
            "ServiceProvider": function(node, obj) {
                obj.serviceProvider = {};
                this.readChildNodes(node, obj.serviceProvider);
            },
            "ProviderName": function(node, serviceProvider) {
                serviceProvider.providerName = this.getChildValue(node);
            },
            "ProviderSite": function(node, serviceProvider) {
                serviceProvider.providerSite = this.getAttributeNS(node, 
                    this.namespaces.xlink, "href");
            },
            "ServiceContact": function(node, serviceProvider) {
                serviceProvider.serviceContact = {};
                this.readChildNodes(node, serviceProvider.serviceContact);
            },
            "IndividualName": function(node, serviceContact) {
                serviceContact.individualName = this.getChildValue(node);
            },
            "PositionName": function(node, serviceContact) {
                serviceContact.positionName = this.getChildValue(node);
            },
            "ContactInfo": function(node, serviceContact) {
                serviceContact.contactInfo = {};
                this.readChildNodes(node, serviceContact.contactInfo);
            },
            "Phone": function(node, contactInfo) {
                contactInfo.phone = {};
                this.readChildNodes(node, contactInfo.phone);
            },
            "Voice": function(node, phone) {
                phone.voice = this.getChildValue(node);
            },
            "Address": function(node, contactInfo) {
                contactInfo.address = {};
                this.readChildNodes(node, contactInfo.address);
            },
            "DeliveryPoint": function(node, address) {
                address.deliveryPoint = this.getChildValue(node);
            },
            "City": function(node, address) {
                address.city = this.getChildValue(node);
            },
            "AdministrativeArea": function(node, address) {
                address.administrativeArea = this.getChildValue(node);
            },
            "PostalCode": function(node, address) {
                address.postalCode = this.getChildValue(node);
            },
            "Country": function(node, address) {
                address.country = this.getChildValue(node);
            },
            "ElectronicMailAddress": function(node, address) {
                address.electronicMailAddress = this.getChildValue(node);
            },
            "Role": function(node, serviceContact) {
                serviceContact.role = this.getChildValue(node);
            },
            "OperationsMetadata": function(node, obj) {
                obj.operationsMetadata = {};
                this.readChildNodes(node, obj.operationsMetadata);
            },
            "Operation": function(node, operationsMetadata) {
                var name = node.getAttribute("name");
                operationsMetadata[name] = {};
                this.readChildNodes(node, operationsMetadata[name]);
            },
            "DCP": function(node, operation) {
                operation.dcp = {};
                this.readChildNodes(node, operation.dcp);
            },
            "HTTP": function(node, dcp) {
                dcp.http = {};
                this.readChildNodes(node, dcp.http);
            },
            "Get": function(node, http) {
                http.get = this.getAttributeNS(node, 
                    this.namespaces.xlink, "href");
            },
            "Post": function(node, http) {
                http.post = this.getAttributeNS(node, 
                    this.namespaces.xlink, "href");
            },
            "Parameter": function(node, operation) {
                if (!operation.parameters) {
                    operation.parameters = {};
                }
                var name = node.getAttribute("name");
                operation.parameters[name] = {};
                this.readChildNodes(node, operation.parameters[name]);
            },
            "AllowedValues": function(node, parameter) {
                parameter.allowedValues = {};
                this.readChildNodes(node, parameter.allowedValues);
            },
            "AnyValue": function(node, parameter) {
                parameter.anyValue = true;
            },
            "Value": function(node, allowedValues) {
                allowedValues[this.getChildValue(node)] = true;
            },
            "Range": function(node, allowedValues) {
                allowedValues.range = {};
                this.readChildNodes(node, allowedValues.range);
            },
            "MinimumValue": function(node, range) {
                range.minValue = this.getChildValue(node);
            },
            "MaximumValue": function(node, range) {
                range.maxValue = this.getChildValue(node);
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.OWSCommon.v1_1_0"

});
